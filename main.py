
import sys
import schedule
import time
from shared.database import init_db
from scraper.nvd_scraper import run_nvd_scraper, run_kev_only
from scraper.forum_scraper import run_forum_scraper
from report_generator.report_generator import generate_html_report
from scraper.config import SCRAPE_INTERVAL_HOURS, REPORT_SCHEDULE_DAY, REPORT_SCHEDULE_TIME

# runs forum scrapper
def run_scraper():
    print("\n" + "=" * 60)
    print("Running NVD + CISA KEV scraper...")
    print("=" * 60)
    run_nvd_scraper(days_back=120)
    print("\n" + "=" * 60)
    print("Running forum scraper...")
    print("=" * 60)
    run_forum_scraper()

# generates reports
def run_reports():
    print("\n" + "=" * 60)
    print("Generating weekly report...")
    print("=" * 60)
    generate_html_report()
    print("[+] Report generated.")

# runs the shedule
def run_scheduled():
    print("[*] Starting scheduled mode...")
    print(f"    Scraper runs every {SCRAPE_INTERVAL_HOURS} hours")
    print(f"    Reports generate every {REPORT_SCHEDULE_DAY} at {REPORT_SCHEDULE_TIME}")

    schedule.every(SCRAPE_INTERVAL_HOURS).hours.do(run_scraper)
    getattr(schedule.every(), REPORT_SCHEDULE_DAY).at(REPORT_SCHEDULE_TIME).do(run_reports)

    run_scraper()

    while True:
        schedule.run_pending()
        time.sleep(60)


def main():
    init_db()

    if len(sys.argv) < 2:
        run_scraper()
# runs NVD search
    elif sys.argv[1] == "--full":
        print("Running full NVD search (last 365 days)...")
        run_nvd_scraper(days_back=365)

    # runs kev
    elif sys.argv[1] == "--kev-only":
        run_kev_only()

    # runs forum scraper
    elif sys.argv[1] == "--forums":
        print("Running forum scraper...")
        run_forum_scraper()

    #runs everything
    elif sys.argv[1] == "--all":
        print("Running ALL scrapers...")
        run_nvd_scraper(days_back=120)
        run_forum_scraper()
        generate_html_report()

    # generate report
    elif sys.argv[1] == "--report":
        run_reports()

    # run shedule
    elif sys.argv[1] == "--schedule":
        run_scheduled()

    # creates data base
    elif sys.argv[1] == "--init":
        print("[+] Database initialised. Ready to go.")

    # what can you do
    else:
        print("Usage:")
        print("  python main.py              Run NVD + KEV scraper (last 120 days)")
        print("  python main.py --full       Full NVD search (last 365 days)")
        print("  python main.py --kev-only   Quick CISA KEV check only")
        print("  python main.py --forums     Scrape tuning forums only")
        print("  python main.py --all        Run ALL scrapers + generate report")
        print("  python main.py --report     Generate weekly report")
        print("  python main.py --schedule   Run on schedule")
        print("  python main.py --init       Initialise database only")


if __name__ == "__main__":
    main()