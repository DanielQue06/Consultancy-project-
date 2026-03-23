import nvdlib
import requests
import time
import json
from datetime import datetime, timedelta

from scraper.config import (
    NVD_API_KEY, CISA_KEV_URL, NVD_SEARCH_KEYWORDS,
    PRODUCT_KEYWORDS, PAIRED_KEYWORDS, SEVERITY_MAP
)
from shared.database import insert_threat, log_scrape, init_db


# ============================================================
# CISA KEV - Download confirmed exploited vulnerabilities
# ============================================================

def download_kev_catalog():
    """
    Download CISA's Known Exploited Vulnerabilities catalog.
    This is a JSON file of ALL confirmed exploited CVEs.
    We use this to check: has this CVE been exploited? yes/no
    """
    print("[*] Downloading CISA KEV catalog...")

    try:
        response = requests.get(CISA_KEV_URL, timeout=30)
        response.raise_for_status()
        data = response.json()

        vulnerabilities = data.get("vulnerabilities", [])
        print(f"[+] Downloaded {len(vulnerabilities)} known exploited vulnerabilities")

        # Build a lookup dictionary: CVE-ID → KEV details
        kev_lookup = {}
        for vuln in vulnerabilities:
            cve_id = vuln.get("cveID", "")
            kev_lookup[cve_id] = {
                "vendor": vuln.get("vendorProject", ""),
                "product": vuln.get("product", ""),
                "name": vuln.get("vulnerabilityName", ""),
                "date_added": vuln.get("dateAdded", ""),
                "description": vuln.get("shortDescription", ""),
                "action": vuln.get("requiredAction", ""),
                "due_date": vuln.get("dueDate", ""),
                "ransomware_use": vuln.get("knownRansomwareCampaignUse", "Unknown"),
                "notes": vuln.get("notes", ""),
            }

        return kev_lookup

    except Exception as e:
        print(f"[-] Failed to download KEV catalog: {e}")
        return {}


# ============================================================
# NVD API - Search for vulnerabilities by keyword
# ============================================================

def search_nvd_for_keyword(keyword, days_back=120):
    """
    Search the NVD for CVEs matching a keyword.

    Args:
        keyword: Search term (e.g. "Infineon", "TC377")
        days_back: How far back to search (default 120 days)

    Returns:
        List of CVE results
    """
    print(f"  [*] Searching NVD for: '{keyword}'")

    try:
        # Calculate date range
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days_back)

        # Search NVD
        kwargs = {
            "keywordSearch": keyword,
            "pubStartDate": start_date,
            "pubEndDate": end_date,
        }

        # Use API key if available (10x faster)
        if NVD_API_KEY:
            kwargs["key"] = NVD_API_KEY
            kwargs["delay"] = 0.6
        else:
            kwargs["delay"] = 6  # Required delay without API key

        results = nvdlib.searchCVE(**kwargs)
        print(f"      Found {len(results)} CVEs")
        return results

    except Exception as e:
        print(f"      [-] Error searching for '{keyword}': {e}")
        return []


def extract_cve_data(cve_result):
    """
    Extract useful data from an NVD CVE result object.
    """
    data = {
        "cve_id": cve_result.id,
        "description": "",
        "cvss_score": 0.0,
        "cvss_severity": "unknown",
        "date_published": "",
        "references": [],
        "cwe_ids": [],
    }

    # Get description
    try:
        if cve_result.descriptions:
            for desc in cve_result.descriptions:
                if desc.lang == "en":
                    data["description"] = desc.value
                    break
            if not data["description"]:
                data["description"] = cve_result.descriptions[0].value
    except (AttributeError, IndexError):
        pass

    # Get CVSS v3.1 score
    try:
        if hasattr(cve_result, "v31score") and cve_result.v31score:
            data["cvss_score"] = float(cve_result.v31score)
            data["cvss_severity"] = cve_result.v31severity or "unknown"
    except (AttributeError, ValueError):
        pass

    # Fallback to CVSS v3.0
    if data["cvss_score"] == 0.0:
        try:
            if hasattr(cve_result, "v30score") and cve_result.v30score:
                data["cvss_score"] = float(cve_result.v30score)
                data["cvss_severity"] = cve_result.v30severity or "unknown"
        except (AttributeError, ValueError):
            pass

    # Fallback to CVSS v2
    if data["cvss_score"] == 0.0:
        try:
            if hasattr(cve_result, "v2score") and cve_result.v2score:
                data["cvss_score"] = float(cve_result.v2score)
                data["cvss_severity"] = cve_result.v2severity or "unknown"
        except (AttributeError, ValueError):
            pass

    # Get published date
    try:
        data["date_published"] = cve_result.published[:10]  # YYYY-MM-DD
    except (AttributeError, TypeError):
        pass

    # Get references
    try:
        if hasattr(cve_result, "references"):
            for ref in cve_result.references:
                data["references"].append(ref.url)
    except (AttributeError, TypeError):
        pass

    # Get CWE IDs
    try:
        if hasattr(cve_result, "cwe"):
            for cwe in cve_result.cwe:
                data["cwe_ids"].append(cwe.value)
    except (AttributeError, TypeError):
        pass

    return data


# ============================================================
# KEYWORD MATCHING & SEVERITY CLASSIFICATION
# ============================================================

def matches_product_keywords(text):
    """Check if text contains any BorgWarner product keywords."""
    text_lower = text.lower()
    matched = []

    for keyword in PRODUCT_KEYWORDS:
        if keyword.lower() in text_lower:
            if keyword in PAIRED_KEYWORDS:
                if "borgwarner" in text_lower or "borg warner" in text_lower:
                    matched.append(keyword)
            else:
                matched.append(keyword)

    return matched


def classify_severity(text, cvss_score=0.0):
    """
    Classify severity based on component AND CVSS score.
    Component-based classification takes priority (Dani's rule),
    but CVSS is used as a fallback.
    """
    text_lower = text.lower()

    # First: check component-based severity (Dani's rule)
    for severity, keywords in SEVERITY_MAP.items():
        for keyword in keywords:
            if keyword.lower() in text_lower:
                return severity, keyword

    # Fallback: use CVSS score
    if cvss_score >= 9.0:
        return "critical", f"CVSS {cvss_score}"
    elif cvss_score >= 7.0:
        return "high", f"CVSS {cvss_score}"
    elif cvss_score >= 4.0:
        return "medium", f"CVSS {cvss_score}"
    elif cvss_score > 0:
        return "low", f"CVSS {cvss_score}"

    return "unknown", None


# ============================================================
# MAIN SCRAPER PIPELINE
# ============================================================

def run_nvd_scraper(days_back=120):
    """
    Full pipeline:
    1. Download CISA KEV catalog (confirmed exploits)
    2. Search NVD for each keyword
    3. Cross-reference with KEV to find confirmed exploits
    4. Classify severity based on component
    5. Save to database
    """
    print("=" * 60)
    print("BorgWarner Cyber Dashboard - NVD + CISA KEV Scraper")
    print("=" * 60)

    # Step 1: Download KEV catalog
    kev_lookup = download_kev_catalog()

    if not kev_lookup:
        print("[-] WARNING: KEV catalog empty - will still search NVD but can't confirm exploits")

    # Step 2: Search NVD for each keyword
    all_cves = {}  # Use dict to avoid duplicates (CVE-ID → data)
    total_found = 0

    for keyword in NVD_SEARCH_KEYWORDS:
        results = search_nvd_for_keyword(keyword, days_back=days_back)
        total_found += len(results)

        for cve_result in results:
            cve_data = extract_cve_data(cve_result)
            cve_id = cve_data["cve_id"]

            if cve_id not in all_cves:
                cve_data["search_keyword"] = keyword
                all_cves[cve_id] = cve_data

        # Small delay between searches to be respectful
        time.sleep(1)

    print(f"\n[*] Total unique CVEs found: {len(all_cves)}")

    # Step 3 + 4 + 5: Process each CVE
    matched_count = 0
    exploited_count = 0

    for cve_id, cve_data in all_cves.items():
        full_text = f"{cve_id} {cve_data['description']}"

        # Check if it matches our product keywords
        matched_keywords = matches_product_keywords(full_text)

        # Also count the search keyword as a match
        if not matched_keywords:
            matched_keywords = [cve_data.get("search_keyword", "")]

        matched_count += 1

        # Check if this CVE is in the CISA KEV (confirmed exploit)
        is_exploited = cve_id in kev_lookup
        kev_data = kev_lookup.get(cve_id, {})

        # Classify severity
        severity, component = classify_severity(
            full_text, cve_data.get("cvss_score", 0.0)
        )

        # Determine exploiter info from KEV
        exploiter_type = "unknown"
        ransomware_use = kev_data.get("ransomware_use", "Unknown")
        if ransomware_use == "Known":
            exploiter_type = "ransomware_group"
        elif is_exploited:
            exploiter_type = "confirmed_threat_actor"

        # Build threat record
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

        # Only save if exploit is confirmed (Dani's requirement)
        if is_exploited:
            insert_threat(threat_data)
            exploited_count += 1

    # Log the scrape session
    log_scrape("NVD + CISA KEV", total_found, matched_count, exploited_count, "success")

    # Print summary
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
    """
    Quick mode: Only check CISA KEV for our keywords.
    Faster than full NVD search — good for daily checks.
    """
    print("=" * 60)
    print("BorgWarner Cyber Dashboard - CISA KEV Quick Check")
    print("=" * 60)

    kev_lookup = download_kev_catalog()
    if not kev_lookup:
        print("[-] Failed to download KEV catalog")
        return

    matched_count = 0

    for cve_id, kev_data in kev_lookup.items():
        # Check if the KEV entry matches our keywords
        full_text = f"{kev_data['vendor']} {kev_data['product']} {kev_data['description']} {kev_data['name']}"
        matched_keywords = matches_product_keywords(full_text)

        if matched_keywords:
            matched_count += 1
            severity, component = classify_severity(full_text)

            ransomware_use = kev_data.get("ransomware_use", "Unknown")
            exploiter_type = "ransomware_group" if ransomware_use == "Known" else "confirmed_threat_actor"

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

            insert_threat(threat_data)
            print(f"  [+] {cve_id}: {kev_data['name'][:60]}...")
            print(f"      Keywords: {matched_keywords}")
            print(f"      Ransomware: {ransomware_use}")

    log_scrape("CISA KEV", len(kev_lookup), matched_count, matched_count, "success")
    print(f"\n[+] Found {matched_count} KEV entries matching BorgWarner keywords")


if __name__ == "__main__":
    import sys

    init_db()

    if len(sys.argv) > 1 and sys.argv[1] == "--kev-only":
        # Quick check: python -m scraper.nvd_scraper --kev-only
        run_kev_only()
    elif len(sys.argv) > 1 and sys.argv[1] == "--full":
        # Full search with extended history: python -m scraper.nvd_scraper --full
        run_nvd_scraper(days_back=365)
    else:
        # Default: last 120 days: python -m scraper.nvd_scraper
        run_nvd_scraper(days_back=120)