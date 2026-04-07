
# imports the used libraries
import requests
from bs4 import BeautifulSoup
import time
import re


# imports the keywords from config.py
from scraper.config import (
    PRODUCT_KEYWORDS, SEVERITY_MAP
)
from shared.database import insert_threat, log_scrape, init_db

# FORUM SOURCES
#   - name: Website Domain
#   - base_url: website link
#   - search_url: template url for scraping
#   - type: type forum engine (software) - ** importnat because diffrent software has diffrent structure

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


# Search queries that will be put into the search url
TUNING_SEARCH_KEYWORDS = [

    "Infineon TriCore tuning",
    "TC377 remap",
    "Aurix TC387 flash",
    "Bosch MPC5777",
    "SPC5777 chiptuning",
    "NXP MC9S12 tuning",
    "S32K14 flash",
    "TJA1145 CAN",
    "sevcon",
    "sevcon gen 4",
    "eeprom",

    "BorgWarner ECU",
    "BorgWarner inverter",
    "BorgWarner eMotor",
    "BorgWarner controller tuning",

    "TriCore remap",
    "TriCore boot mode",
    "TriCore flash read write",
    "Aurix tuning",
    "Aurix bootloader",

    "HSM bypass automotive",
    "secure boot bypass ECU",
    "immobilizer bypass",
    "IMMO bypass",

    "CAN bus injection",
    "CAN bus reverse engineering",
    "OBD tuning flash",
]





# The string is used to make the request came from a normal browser than a script


USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/120.0.0.0 Safari/537.36"
)


def make_request(url):
    "Make HTTP request with proper headers."
    headers = {
        # Mimics one of the browsers
        "User-Agent": USER_AGENT,
        # Looks for HTML response
        "Accept": "text/html,application/xhtml+xml",
        # Looks for british english but generic is also fine
        "Accept-Language": "en-GB,en;q=0.9",
    }
    try:
        # WIll wait for 30 seconds then move on so it doesn't get stuck,
        #trying the same url
        response = requests.get(url, headers=headers, timeout=30)
        # Checks and raises the error
        response.raise_for_status()
        return response
    # Prints the error and tells the issue
    except requests.RequestException as e:
        print(f"  [-] Request failed for {url}: {e}")
        return None



# phpbb searcher
def parse_phpbb_search_results(html_content, base_url):
    "Parse search results from phpBB forums like ecuedit.com"
    soup = BeautifulSoup(html_content, "html.parser")
    # saves the post in the dictionary
    entries = []

    # Looks for the result from the search url- because they will be in diffrent divs
    posts = soup.find_all("div", class_="search")
    if not posts:
        posts = soup.find_all("div", class_="post")
    if not posts:
        posts = soup.find_all("div", class_="postbody")
    # Look for these terms in the box
    for post in posts:
        entry = {
            "title": "",
            "description": "",
            "author": "",
            "date_published": "",
            "source_url": "",
        }

        # then fills them
        title_el = post.find(["h3", "h2", "a"], class_=["topictitle", "first"])
       # if there is no title - a bqackup
        if not title_el:
            title_el = post.find("a", class_="topictitle")
       # the way it saves the findingd
        if title_el:
            entry["title"] = title_el.get_text(strip=True)
            # gets the link from here
            link = title_el.get("href") or title_el.find("a")
            # check if its the full link if not it adds the base url
            if link:
                href = link if isinstance(link, str) else link.get("href", "")
                if href and not href.startswith("http"):
                    href = base_url + "/" + href.lstrip("./")
                entry["source_url"] = href

        # Get posted content  - same as the title looks for the div
        content_el = post.find("div", class_="content")
        if not content_el:
            content_el = post.find("div", class_="postbody")
        # gets the first 2000 characters from the body
        if content_el:
            entry["description"] = content_el.get_text(strip=True)[:2000]

        # Get the author
        author_el = post.find(["a", "span"], class_=["username", "author"])
        if author_el:
            entry["author"] = author_el.get_text(strip=True)

        # Get the date
        date_el = post.find("time")
        if date_el:
            entry["date_published"] = date_el.get("datetime", date_el.get_text(strip=True))
        # only adds to the dictoneiry if one or both are not empty
        if entry["title"] or entry["description"]:
            entries.append(entry)
    # makes a list in the dictionary
    return entries

# wordpress searcher
def parse_wordpress_search_results(html_content, base_url):
    "Parse search results from WordPress sites like torquecars.com"
    soup = BeautifulSoup(html_content, "html.parser")
    # saves the post in the dictionary
    entries = []
    # Looks for the atg <article> - most search reeslts in here in wordpress
    articles = soup.find_all("article")
    # alternates if not found
    if not articles:
        articles = soup.find_all("div", class_=re.compile(r"post|entry|result"))
    # Look for these terms in the box
    for article in articles:
        entry = {
            "title": "",
            "description": "",
            "author": "",
            "date_published": "",
            "source_url": "",
        }
        # looks for title
        title_el = article.find(["h2", "h3", "h1"])
        if title_el:
            entry["title"] = title_el.get_text(strip=True)
            link = title_el.find("a")
            if link:
                entry["source_url"] = link.get("href", "")
        # looks for an execative summary
        desc_el = article.find(["p", "div"], class_=re.compile(r"excerpt|summary|content"))
        # same as before first 2000 charaters
        if not desc_el:
            desc_el = article.find("p")
        if desc_el:
            entry["description"] = desc_el.get_text(strip=True)[:2000]
        # gets the date
        date_el = article.find("time")
        if date_el:
            entry["date_published"] = date_el.get("datetime", date_el.get_text(strip=True))
        # only adds to the dictoneiry if one or both are not empty
        if entry["title"] or entry["description"]:
            entries.append(entry)
        #  adds to the dictionary
    return entries

# used if it is unsure if it is wordpress or phpbb
def parse_generic_page(html_content, url):
    "Generic parser — grabs all meaningful text blocks."
    soup = BeautifulSoup(html_content, "html.parser")
    # saves the post in the dictionary
    entries = []

    # Remove scripts, styles, navigation
    for tag in soup(["script", "style", "nav", "header", "footer"]):
        tag.decompose()
    # searches for thes blocks
    blocks = soup.find_all(["article", "div", "tr", "li", "section", "td"])
   # if the content is over 100 character it taksse at menign full content
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
            # adds to the dictionary
    return entries




# ANALYSIS FUNCTION

# Checks if borgwarner keywords appear here
def matches_borgwarner_keywords(text):
    "Check if text mentions our products/related chips."
    # makes it simpler
    text_lower = text.lower()
    matched = []

    for keyword in PRODUCT_KEYWORDS:
        if keyword.lower() in text_lower:
            matched.append(keyword)
 # returns matched data which will hlep decide if the post is relevent
    return matched

# checks the effects of the exploited componet
def classify_tuning_severity(text, matched_keywords):

   # Classify severity based on what component is being tuned.
   # major components = critical, minor = low.

    text_lower = text.lower()

    for severity, keywords in SEVERITY_MAP.items():
        for keyword in keywords:
            if keyword.lower() in text_lower:
                return severity, keyword

    # If we matched specific product keywords, use those
    for kw in matched_keywords:
        kw_lower = kw.lower()
        # looks through matched key words
        if any(c in kw_lower for c in ["tc377", "aurix", "tricore", "spc5777", "mpc5777", "s32k"]):
            return "critical", kw
        elif any(c in kw_lower for c in ["tja1145", "tja1044", "infineon", "nxp"]):
            return "high", kw
    # no componet detected but still keep the data and treat as less urgent
    return "medium", "ECU tuning discussion"



#  The Heart of the scrapper
def scrape_forum(forum_config, keyword):
    "Scrape a single forum for a single keyword."
    # builds the url form the fourm templet by replacing key words each time
    search_url = forum_config["search_url"].format(keyword=keyword.replace(" ", "+"))
    # makes a request if it fails it retuns and empty list so nothing brakes
    response = make_request(search_url)
    if not response:
        return []

    # picks parser based on forum type
    if forum_config["type"] == "phpbb":
        entries = parse_phpbb_search_results(response.text, forum_config["base_url"])
    elif forum_config["type"] == "wordpress":
        entries = parse_wordpress_search_results(response.text, forum_config["base_url"])
    else:
        entries = parse_generic_page(response.text, search_url)

    return entries

# processes the saved data
def process_forum_entry(entry, source_name):
    # combines the title and discription- empty string used to stop crashing
    full_text = f"{entry.get('title', '')} {entry.get('description', '')}"

    # Looks for mentions of borgwarner
    matched_keywords = matches_borgwarner_keywords(full_text)
    if not matched_keywords:
        return False, "no_keyword_match"

    # Classify severity
    severity, component = classify_tuning_severity(full_text, matched_keywords)

    # Bulds a threat record  where it came from, title, description, when, which keywords matched, component, severity.
    threat_data = {
        "source": f"Forum: {source_name}",
        "source_url": entry.get("source_url", ""),
        "title": entry.get('title', '')[:300],
        "description": entry.get("description", "")[:5000],
        "date_published": entry.get("date_published", ""),
        "matched_keywords": matched_keywords,
        "component_affected": component or "ECU",
        "severity": severity,
        "exploit_confirmed": False,
        "exploiter_type": "forum_post",
        "cvss_score": 0.0,
        "cve_id": "",
        "raw_data": full_text[:2000],
    }
    # saves and shows status
    insert_threat(threat_data)
    return True, "saved"

# the function that runs the loop
def run_forum_scraper():
    # prints a header to show the console the scan started
    print("=" * 60)
    print("BorgWarner Cyber Dashboard - Tuning Forum Scraper")
    print("=" * 60)

    # counters
    total_entries = 0
    matched_count = 0
    saved_count = 0

    # goes through all the fourm source
    for forum in FORUM_SOURCES:
        print(f"\n[*] Scraping: {forum['name']}")

        # goes through each keyword
        for keyword in TUNING_SEARCH_KEYWORDS:
            print(f"  [*] Searching for: '{keyword}'")

             # looks through the source and adds to counter
            entries = scrape_forum(forum, keyword)
            total_entries += len(entries)

            # shows the number of result if not empty
            if entries:
                print(f"      Found {len(entries)} results")

            for entry in entries:
                saved, reason = process_forum_entry(entry, forum["name"])
               # if it is not a Borgwarner product skips
                if reason == "no_keyword_match":
                    continue
                matched_count += 1
                if saved:
                    saved_count += 1
                    # saved with first 60 characters for idnetification
                    print(f"      [+] SAVED: {entry.get('title', '')[:60]}...")

            # delay between searches - so not many request are sent
            time.sleep(3)
        # saves the records
        log_scrape(
            f"Forum: {forum['name']}",
            total_entries, matched_count, saved_count, "success"
        )

    # prints the results to view
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