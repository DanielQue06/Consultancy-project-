# imports the library and data needed from other directories
import nvdlib
import requests
import time
import json
from datetime import datetime, timedelta

from scraper.config import (
    NVD_API_KEY, CISA_KEV_URL, NVD_SEARCH_KEYWORDS,
    PRODUCT_KEYWORDS, KEYWORDS_TECHNOLOGIES, SEVERITY_MAP
)  #PAIRED_KEYWORDS
from shared.database import insert_threat, log_scrape, init_db




def download_kev_catalog():

   # Download CISA's Known Exploited Vulnerabilities catalog

    print("[*] Downloading CISA KEV catalog...")

    try:
        # 30 second timeout so it doesn't wait forever
        response = requests.get(CISA_KEV_URL, timeout=30)
        # checks the data so it doesn't silently carry on with fake data
        response.raise_for_status()
        # makes the data searchable
        data = response.json()

        # searchs through the data if nothing is found gives and empty list.
        vulnerabilities = data.get("vulnerabilities", [])
        print(f"[+] Downloaded {len(vulnerabilities)} known exploited vulnerabilities")

        # Empty dictionary to save data.
        kev_lookup = {}
        # Looks through all the vulnerabilities
        for vuln in vulnerabilities:
            cve_id = vuln.get("cveID", "")
            kev_lookup[cve_id] = {
                # who is effected
                "vendor": vuln.get("vendorProject", ""),
                # product
                "product": vuln.get("product", ""),
                # Name
                "name": vuln.get("vulnerabilityName", ""),
                # Date
                "date_added": vuln.get("dateAdded", ""),
                # details
                "description": vuln.get("shortDescription", ""),
                # what to do
                "action": vuln.get("requiredAction", ""),
                # by when
                "due_date": vuln.get("dueDate", ""),
                # used in ransomware
                "ransomware_use": vuln.get("knownRansomwareCampaignUse", "Unknown"),
                "notes": vuln.get("notes", ""),
            }

        return kev_lookup
    # error handling if nothing comes up
    except Exception as e:
        print(f"[-] Failed to download KEV catalog: {e}")
        return {}



# NVD API

def search_nvd_for_keyword(keyword, days_back=None):
   # shows the console what products its searching for
    print(f"  [*] Searching NVD for: '{keyword}'")

    try:
        # dictionary  - keyword arguments
        kwargs = {
            "keywordSearch": keyword,
        }
        # optional date filtering  - at the moment none
        if days_back:
            end_date = datetime.now().replace(microsecond=0)
            start_date = (end_date - timedelta(days=days_back)).replace(microsecond=0)
            kwargs["pubStartDate"] = start_date
            kwargs["pubEndDate"] = end_date

        # API key
        if NVD_API_KEY:
            kwargs["key"] = NVD_API_KEY
            kwargs["delay"] = 0.6

        # call the library with the built in arguments and prints the results
        results = nvdlib.searchCVE(**kwargs)
        print(f"      Found {len(results)} CVEs")
        return results

    # error handeling
    except Exception as e:
        print(f"      [-] Error searching for '{keyword}': {e}")
        return []




#  cleans and normalises the CVE data
def extract_cve_data(cve_result):

    # Default parameters

    data = {
        "cve_id": cve_result.id,
        "description": "",
        "cvss_score": 0.0,
        "cvss_severity": "unknown",
        "date_published": "",
        "references": [],
        "cwe_ids": [],
    }

    # Looks for english description
    try:
        if cve_result.descriptions:
            for desc in cve_result.descriptions:
                if desc.lang == "en":
                    data["description"] = desc.value
                    break
            if not data["description"]:
                data["description"] = cve_result.descriptions[0].value
   # error handeling
    except (AttributeError, IndexError):
        pass

    # Looks for CVSS score - to see how east it is to exploit.
    try:
        if hasattr(cve_result, "v31score") and cve_result.v31score:
            data["cvss_score"] = float(cve_result.v31score)
            data["cvss_severity"] = cve_result.v31severity or "unknown"
    # error handeling
    except (AttributeError, ValueError):
        pass

    # Fallback to CVSS v3.0
    if data["cvss_score"] == 0.0:
        try:
            if hasattr(cve_result, "v30score") and cve_result.v30score:
                data["cvss_score"] = float(cve_result.v30score)
                data["cvss_severity"] = cve_result.v30severity or "unknown"
        # error handeling
        except (AttributeError, ValueError):
            pass

    # Fallback to CVSS v2
    if data["cvss_score"] == 0.0:
        try:
            if hasattr(cve_result, "v2score") and cve_result.v2score:
                data["cvss_score"] = float(cve_result.v2score)
                data["cvss_severity"] = cve_result.v2severity or "unknown"
        # error handeling
        except (AttributeError, ValueError):
            pass

    # Get published date
    try:
        data["date_published"] = cve_result.published[:10]  # YYYY-MM-DD
    # error handeling
    except (AttributeError, TypeError):
        pass

    # Get references
    try:
        if hasattr(cve_result, "references"):
            for ref in cve_result.references:
                data["references"].append(ref.url)
    # error handeling
    except (AttributeError, TypeError):
        pass

    # Get CWE IDs
    try:
        if hasattr(cve_result, "cwe"):
            for cwe in cve_result.cwe:
                data["cwe_ids"].append(cwe.value)
    # error handeling
    except (AttributeError, TypeError):
        pass

    return data


# severity classification
def matches_product_keywords(text):
    """Check if text contains any of our product/technology keywords (generic)."""
    text_lower = text.lower()
    matched = []

    for keyword in PRODUCT_KEYWORDS:
        if keyword.lower() in text_lower:
            matched.append(keyword)

    return matched


def classify_severity(text, cvss_score=0.0):

    # Classify severity based on component AND CVSS score.
    text_lower = text.lower()

    #check component based severity from key words
    for severity, keywords in SEVERITY_MAP.items():
        for keyword in keywords:
            if keyword.lower() in text_lower:
                return severity, keyword

    # use CVSS score
    if cvss_score >= 9.0:
        return "critical", f"CVSS {cvss_score}"
    elif cvss_score >= 7.0:
        return "high", f"CVSS {cvss_score}"
    elif cvss_score >= 4.0:
        return "medium", f"CVSS {cvss_score}"
    elif cvss_score > 0:
        return "low", f"CVSS {cvss_score}"

    return "unknown", None



# Main Scrapper


def run_nvd_scraper(days_back=None):

    print("=" * 60)
    print("BorgWarner Cyber Dashboard - NVD + CISA KEV Scraper")
    print("=" * 60)

    # download KEV catalog
    kev_lookup = download_kev_catalog()

    if not kev_lookup:
        print("[-] WARNING: KEV catalog empty - will still search NVD but can't confirm exploits")

    # search NVD for each keyword
    all_cves = {}  # Use dict to avoid duplicates
    total_found = 0

    # looks through all keywords
    for keyword in NVD_SEARCH_KEYWORDS:
        results = search_nvd_for_keyword(keyword, days_back=days_back)
        total_found += len(results)

        # cleans and stores it
        for cve_result in results:
            cve_data = extract_cve_data(cve_result)
            cve_id = cve_data["cve_id"]

            if cve_id not in all_cves:
                cve_data["search_keyword"] = keyword
                all_cves[cve_id] = cve_data

        #delay searches
        time.sleep(1)

    print(f"\n[*] Total unique CVEs found: {len(all_cves)}")

    # results
    matched_count = 0
    exploited_count = 0

    for cve_id, cve_data in all_cves.items():
        full_text = f"{cve_id} {cve_data['description']}"

        # Check if it matches product/technology
        matched_keywords = matches_product_keywords(full_text)

        # If nothing matched, still remebers the keywword
        if not matched_keywords:
            matched_keywords = [cve_data.get("search_keyword", "")]
            
        matched_count += 1

        # check if this CVE is in the CISA KEV
        is_exploited = cve_id in kev_lookup
        kev_data = kev_lookup.get(cve_id, {})

        # classify severity
        severity, component = classify_severity(
            full_text, cve_data.get("cvss_score", 0.0)
        )

        #exploiter info if any
        exploiter_type = "unknown"
        ransomware_use = kev_data.get("ransomware_use", "Unknown")
        if ransomware_use == "Known":
            exploiter_type = "ransomware_group"
        elif is_exploited:
            exploiter_type = "confirmed_threat_actor"

        # build threat record
        threat_data = {
            "source": "NVD + CISA KEV" if is_exploited else "NVD",
            "source_url": f"https://nvd.nist.gov/vuln/detail/{cve_id}",
            "title": f"{cve_id}: {cve_data['description'][:200]}",
            "description": cve_data["description"],
            "date_published": cve_data.get("date_published", ""),
            "matched_keywords": matched_keywords,
            "component_affected": component or cve_data.get("search_keyword", "unclassified"),
            "severity": severity,
            "exploit_confirmed": is_exploited,
            "exploit_detail": kev_data.get("name", "") if is_exploited else "Not in CISA KEV",
            "exploiter_name": kev_data.get("vendor", ""),
            "exploiter_alias": "",
            "exploiter_group": "",
            "exploiter_country": "",
            "exploiter_profile_url": "",
            "exploiter_type": exploiter_type,
            "cvss_score": cve_data.get("cvss_score", 0.0),
            "cve_id": cve_id,
            "raw_data": json.dumps({
                "description": cve_data["description"],
                "cvss_score": cve_data["cvss_score"],
                "cvss_severity": cve_data["cvss_severity"],
                "references": cve_data["references"][:5],
                "cwe_ids": cve_data["cwe_ids"],
                "kev_data": kev_data if is_exploited else None,
                "ransomware_use": ransomware_use if is_exploited else "N/A",
            }),
        }

        #save confirmed exploit
        if is_exploited:
            insert_threat(threat_data)
            exploited_count += 1

    # Log the scrape session
    log_scrape("NVD + CISA KEV", total_found, matched_count, exploited_count, "success")

    # summary
    print("\n" + "=" * 60)
    print("SCRAPE COMPLETE - SUMMARY")
    print("=" * 60)
    print(f"  Keywords searched:          {len(NVD_SEARCH_KEYWORDS)}")
    print(f"  Total CVEs found in NVD:    {total_found}")
    print(f"  Unique CVEs:                {len(all_cves)}")
    print(f"  Matched product keywords:   {matched_count}")
    print(f"  Confirmed exploits (KEV):   {exploited_count}")
    print(f"  CISA KEV catalog size:      {len(kev_lookup)}")
    print("=" * 60)

    return {
        "total_found": total_found,
        "unique": len(all_cves),
        "matched": matched_count,
        "exploited": exploited_count,
    }


def run_kev_only():

    print("=" * 60)
    print("BorgWarner Cyber Dashboard - CISA KEV Quick Check")
    print("=" * 60)


    kev_lookup = download_kev_catalog()
    if not kev_lookup:
        print("[-] Failed to download KEV catalog")
        return

    matched_count = 0

    # looks through the KEV
    for cve_id, kev_data in kev_lookup.items():

        # Check if the KEV entry matches keywords
        full_text = f"{kev_data['vendor']} {kev_data['product']} {kev_data['description']} {kev_data['name']}"
        matched_keywords = matches_product_keywords(full_text)

        # class severity
        if matched_keywords:
            matched_count += 1
            severity, component = classify_severity(full_text)

            # looks for any exploiter
            ransomware_use = kev_data.get("ransomware_use", "Unknown")
            exploiter_type = "ransomware_group" if ransomware_use == "Known" else "confirmed_threat_actor"


            # builds threat data
            threat_data = {
                "source": "CISA KEV",
                "source_url": f"https://nvd.nist.gov/vuln/detail/{cve_id}",
                "title": f"{cve_id}: {kev_data['name']}",
                "description": kev_data["description"],
                "date_published": kev_data.get("date_added", ""),
                "matched_keywords": matched_keywords,
                "component_affected": component or "unclassified",
                "severity": severity,
                "exploit_confirmed": True,
                "exploit_detail": kev_data.get("name", ""),
                "exploiter_name": kev_data.get("vendor", ""),
                "exploiter_alias": "",
                "exploiter_group": "",
                "exploiter_country": "",
                "exploiter_profile_url": "",
                "exploiter_type": exploiter_type,
                "cvss_score": 0.0,
                "cve_id": cve_id,
                "raw_data": json.dumps(kev_data),
            }

            # adds to database
            insert_threat(threat_data)
            print(f"  [+] {cve_id}: {kev_data['name'][:60]}...")
            print(f"      Keywords: {matched_keywords}")
            print(f"      Ransomware: {ransomware_use}")

    # prints results
    log_scrape("CISA KEV", len(kev_lookup), matched_count, matched_count, "success")
    print(f"\n[+] Found {matched_count} KEV entries matching BorgWarner keywords")


if __name__ == "__main__":
    import sys

    init_db()

    if len(sys.argv) > 1 and sys.argv[1] == "--kev-only":

        run_kev_only()
    elif len(sys.argv) > 1 and sys.argv[1] == "--full":

        run_nvd_scraper(days_back=None)
    else:

        run_nvd_scraper(days_back=None)