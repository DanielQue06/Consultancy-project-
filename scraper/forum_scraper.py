
import requests
from bs4 import BeautifulSoup
import time
import re
from datetime import datetime

from scraper.config import (
    PRODUCT_KEYWORDS, PAIRED_KEYWORDS, SEVERITY_MAP
)
from shared.database import insert_threat, log_scrape, init_db


# ============================================================
# FORUM SOURCES
# ============================================================

FORUM_SOURCES = [
    {
        "name": "ecuedit.com",
        "base_url": "https://www.ecuedit.com",
        "search_url": "https://www.ecuedit.com/search.php?keywords={keyword}&terms=all&author=&sc=1&sf=all&sr=posts&sk=t&sd=d&st=0&ch=300&t=0&submit=Search",
        "type": "phpbb",
    },
    {
        "name": "torquecars.com",
        "base_url": "https://www.torquecars.com",
        "search_url": "https://www.torquecars.com/?s={keyword}",
        "type": "wordpress",
    },
]

# --- Tuning-specific keywords to search ---
# These combine BorgWarner product names with tuning terms
TUNING_SEARCH_KEYWORDS = [
    # Specific chips people tune
    "Infineon TriCore tuning",
    "TC377 remap",
    "Aurix TC387 flash",
    "Bosch MPC5777",
    "SPC5777 chiptuning",
    "NXP MC9S12 tuning",
    "S32K14 flash",
    "TJA1145 CAN",
    # General BorgWarner terms
    "BorgWarner ECU",
    "BorgWarner inverter",
    "BorgWarner eMotor",
    "BorgWarner controller tuning",
    # Chip families used in BorgWarner products
    "TriCore remap",
    "TriCore boot mode",
    "TriCore flash read write",
    "Aurix tuning",
    "Aurix bootloader",
    # HSM bypass (security concern)
    "HSM bypass automotive",
    "secure boot bypass ECU",
    "immobilizer bypass",
    "IMMO bypass",
    # CAN bus manipulation
    "CAN bus injection",
    "CAN bus reverse engineering",
    "OBD tuning flash",
]

# --- Tuning activity indicators ---
# These phrases suggest someone is actively modifying/tuning
TUNING_INDICATORS = [
    "remapped", "remap", "remapping",
    "flashed", "flash", "flashing",
    "tuned", "tuning", "tune",
    "chipped", "chip tuning", "chiptuning",
    "modified", "modifying", "modification",
    "cracked", "bypass", "bypassed",
    "unlocked", "unlock",
    "read and write", "read/write",
    "boot mode", "bootloader",
    "bench mode", "bench tuning",
    "OBD flash", "OBD tuning",
    "DPF delete", "EGR delete", "DTC off",
    "stage 1", "stage 2", "stage 3",
    "detuned", "stock map", "custom map",
    "WinOLS", "ECM Titanium", "KESS",
    "K-TAG", "CMD Flash", "MPPS",
    "Autotuner", "BitBox", "Alientech",
    "reverse engineer", "disassemble",
]

# ============================================================
# REQUEST HANDLER
# ============================================================

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/120.0.0.0 Safari/537.36"
)


def make_request(url):
    """Make HTTP request with proper headers."""
    headers = {
        "User-Agent": USER_AGENT,
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "en-GB,en;q=0.9",
    }
    try:
        response = requests.get(url, headers=headers, timeout=30)
        response.raise_for_status()
        return response
    except requests.RequestException as e:
        print(f"  [-] Request failed for {url}: {e}")
        return None


# ============================================================
# FORUM PARSERS
# ============================================================

def parse_phpbb_search_results(html_content, base_url):
    """Parse search results from phpBB forums like ecuedit.com"""
    soup = BeautifulSoup(html_content, "html.parser")
    entries = []

    # phpBB search results are in divs with class "search post"
    posts = soup.find_all("div", class_="search")
    if not posts:
        posts = soup.find_all("div", class_="post")
    if not posts:
        posts = soup.find_all("div", class_="postbody")

    for post in posts:
        entry = {
            "title": "",
            "description": "",
            "author": "",
            "date_published": "",
            "source_url": "",
        }

        # Get title
        title_el = post.find(["h3", "h2", "a"], class_=["topictitle", "first"])
        if not title_el:
            title_el = post.find("a", class_="topictitle")
        if title_el:
            entry["title"] = title_el.get_text(strip=True)
            link = title_el.get("href") or title_el.find("a")
            if link:
                href = link if isinstance(link, str) else link.get("href", "")
                if href and not href.startswith("http"):
                    href = base_url + "/" + href.lstrip("./")
                entry["source_url"] = href

        # Get post content
        content_el = post.find("div", class_="content")
        if not content_el:
            content_el = post.find("div", class_="postbody")
        if content_el:
            entry["description"] = content_el.get_text(strip=True)[:2000]

        # Get author
        author_el = post.find(["a", "span"], class_=["username", "author"])
        if author_el:
            entry["author"] = author_el.get_text(strip=True)

        # Get date
        date_el = post.find("time")
        if date_el:
            entry["date_published"] = date_el.get("datetime", date_el.get_text(strip=True))

        if entry["title"] or entry["description"]:
            entries.append(entry)

    return entries


def parse_wordpress_search_results(html_content, base_url):
    """Parse search results from WordPress sites like torquecars.com"""
    soup = BeautifulSoup(html_content, "html.parser")
    entries = []

    articles = soup.find_all("article")
    if not articles:
        articles = soup.find_all("div", class_=re.compile(r"post|entry|result"))

    for article in articles:
        entry = {
            "title": "",
            "description": "",
            "author": "",
            "date_published": "",
            "source_url": "",
        }

        title_el = article.find(["h2", "h3", "h1"])
        if title_el:
            entry["title"] = title_el.get_text(strip=True)
            link = title_el.find("a")
            if link:
                entry["source_url"] = link.get("href", "")

        desc_el = article.find(["p", "div"], class_=re.compile(r"excerpt|summary|content"))
        if not desc_el:
            desc_el = article.find("p")
        if desc_el:
            entry["description"] = desc_el.get_text(strip=True)[:2000]

        date_el = article.find("time")
        if date_el:
            entry["date_published"] = date_el.get("datetime", date_el.get_text(strip=True))

        if entry["title"] or entry["description"]:
            entries.append(entry)

    return entries


def parse_generic_page(html_content, url):
    """Generic parser — grabs all meaningful text blocks."""
    soup = BeautifulSoup(html_content, "html.parser")
    entries = []

    # Remove scripts, styles, navigation
    for tag in soup(["script", "style", "nav", "header", "footer"]):
        tag.decompose()

    blocks = soup.find_all(["article", "div", "tr", "li", "section", "td"])
    for block in blocks:
        text = block.get_text(strip=True)
        if len(text) > 100:
            entry = {
                "title": text[:200],
                "description": text[:2000],
                "author": "",
                "date_published": "",
                "source_url": url,
            }
            entries.append(entry)

    return entries


# ============================================================
# ANALYSIS FUNCTIONS
# ============================================================

def matches_borgwarner_keywords(text):
    """Check if text mentions BorgWarner products or related chips."""
    text_lower = text.lower()
    matched = []

    for keyword in PRODUCT_KEYWORDS:
        if keyword.lower() in text_lower:
            if keyword in PAIRED_KEYWORDS:
                if "borgwarner" in text_lower or "borg warner" in text_lower:
                    matched.append(keyword)
            else:
                matched.append(keyword)

    # Also check for chip families without needing "BorgWarner" context
    # These are specific enough to be relevant
    chip_keywords = [
        "tricore", "aurix", "tc377", "tc387", "tc1767", "tc1782",
        "tc1791", "tc1797", "spc5777", "mpc5777", "s32k",
        "mc9s12", "pic16f", "tja1145", "tja1044", "tle9471",
        "cycurhsm", "yubihsm", "bq7961", "max17841",
    ]
    for chip in chip_keywords:
        if chip in text_lower and chip not in [m.lower() for m in matched]:
            matched.append(chip)

    return matched


def has_tuning_activity(text):
    """Check if text indicates active tuning/modification."""
    text_lower = text.lower()
    found_indicators = []

    for indicator in TUNING_INDICATORS:
        if indicator.lower() in text_lower:
            found_indicators.append(indicator)

    return found_indicators


def classify_tuning_severity(text, matched_keywords):
    """
    Classify severity based on what component is being tuned.
    Dani's rule: major components = critical, minor = low.
    """
    text_lower = text.lower()

    for severity, keywords in SEVERITY_MAP.items():
        for keyword in keywords:
            if keyword.lower() in text_lower:
                return severity, keyword

    # If we matched specific product keywords, use those
    for kw in matched_keywords:
        kw_lower = kw.lower()
        if any(c in kw_lower for c in ["tc377", "aurix", "tricore", "spc5777", "mpc5777", "s32k"]):
            return "critical", kw
        elif any(c in kw_lower for c in ["tja1145", "tja1044", "infineon", "nxp"]):
            return "high", kw

    return "medium", "ECU tuning discussion"


# ============================================================
# MAIN SCRAPER
# ============================================================

def scrape_forum(forum_config, keyword):
    """Scrape a single forum for a single keyword."""
    search_url = forum_config["search_url"].format(keyword=keyword.replace(" ", "+"))

    response = make_request(search_url)
    if not response:
        return []

    # Parse based on forum type
    if forum_config["type"] == "phpbb":
        entries = parse_phpbb_search_results(response.text, forum_config["base_url"])
    elif forum_config["type"] == "wordpress":
        entries = parse_wordpress_search_results(response.text, forum_config["base_url"])
    else:
        entries = parse_generic_page(response.text, search_url)

    return entries


def process_forum_entry(entry, source_name):
    """
    Process a forum entry:
    1. Check if it mentions BorgWarner products
    2. Check if it discusses tuning/modification
    3. Classify severity
    4. Save to database
    """
    full_text = f"{entry.get('title', '')} {entry.get('description', '')}"

    # Step 1: Check for BorgWarner product keywords
    matched_keywords = matches_borgwarner_keywords(full_text)
    if not matched_keywords:
        return False, "no_keyword_match"

    # Step 2: Check for tuning activity
    tuning_indicators = has_tuning_activity(full_text)
    if not tuning_indicators:
        return False, "no_tuning_activity"

    # Step 3: Classify severity
    severity, component = classify_tuning_severity(full_text, matched_keywords)

    # Step 4: Save to database
    threat_data = {
        "source": f"Forum: {source_name}",
        "source_url": entry.get("source_url", ""),
        "title": f"[TUNING] {entry.get('title', '')[:300]}",
        "description": entry.get("description", "")[:5000],
        "date_published": entry.get("date_published", ""),
        "matched_keywords": matched_keywords,
        "component_affected": component or "ECU",
        "severity": severity,
        "exploit_confirmed": True,  # Tuning activity = confirmed modification
        "exploit_detail": f"Tuning indicators: {', '.join(tuning_indicators[:5])}",
        "exploiter_name": entry.get("author", ""),
        "exploiter_alias": "",
        "exploiter_group": "",
        "exploiter_country": "",
        "exploiter_profile_url": "",
        "exploiter_type": "tuning_community",
        "cvss_score": 0.0,
        "cve_id": "",
        "raw_data": full_text[:2000],
    }

    insert_threat(threat_data)
    return True, "saved"


def run_forum_scraper():
    """Full forum scraping pipeline."""
    print("=" * 60)
    print("BorgWarner Cyber Dashboard - Tuning Forum Scraper")
    print("=" * 60)

    total_entries = 0
    matched_count = 0
    saved_count = 0

    for forum in FORUM_SOURCES:
        print(f"\n[*] Scraping: {forum['name']}")

        for keyword in TUNING_SEARCH_KEYWORDS:
            print(f"  [*] Searching for: '{keyword}'")

            entries = scrape_forum(forum, keyword)
            total_entries += len(entries)

            if entries:
                print(f"      Found {len(entries)} results")

            for entry in entries:
                saved, reason = process_forum_entry(entry, forum["name"])
                if reason == "no_keyword_match":
                    continue
                matched_count += 1
                if saved:
                    saved_count += 1
                    print(f"      [+] SAVED: {entry.get('title', '')[:60]}...")

            # Respectful delay between searches
            time.sleep(3)

        log_scrape(
            f"Forum: {forum['name']}",
            total_entries, matched_count, saved_count, "success"
        )

    # Summary
    print("\n" + "=" * 60)
    print("FORUM SCRAPE COMPLETE")
    print("=" * 60)
    print(f"  Forums searched:        {len(FORUM_SOURCES)}")
    print(f"  Keywords searched:      {len(TUNING_SEARCH_KEYWORDS)}")
    print(f"  Total entries found:    {total_entries}")
    print(f"  Matched BW keywords:    {matched_count}")
    print(f"  Saved (with tuning):    {saved_count}")
    print("=" * 60)

    return {
        "total": total_entries,
        "matched": matched_count,
        "saved": saved_count,
    }


if __name__ == "__main__":
    init_db()
    run_forum_scraper()