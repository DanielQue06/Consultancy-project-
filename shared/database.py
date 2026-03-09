
import sqlite3
from datetime import datetime
from scraper.config import DATABASE_PATH


def init_db():
    """Create the database and tables if they don't exist."""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS threats (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            source TEXT NOT NULL,
            source_url TEXT,
            title TEXT NOT NULL,
            description TEXT,
            date_published TEXT,
            date_scraped TEXT NOT NULL,
            matched_keywords TEXT,
            component_affected TEXT,
            severity TEXT NOT NULL,
            exploit_confirmed INTEGER DEFAULT 0,
            exploit_detail TEXT,
            exploiter_name TEXT,
            exploiter_alias TEXT,
            exploiter_group TEXT,
            exploiter_country TEXT,
            exploiter_profile_url TEXT,
            exploiter_type TEXT,
            cvss_score REAL,
            cve_id TEXT,
            raw_data TEXT,
            UNIQUE(source, title, cve_id)
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS scrape_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            source TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            total_found INTEGER DEFAULT 0,
            matched INTEGER DEFAULT 0,
            exploited INTEGER DEFAULT 0,
            status TEXT NOT NULL
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS weekly_reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            week_start TEXT NOT NULL,
            week_end TEXT NOT NULL,
            generated_at TEXT NOT NULL,
            total_threats INTEGER DEFAULT 0,
            critical_count INTEGER DEFAULT 0,
            high_count INTEGER DEFAULT 0,
            medium_count INTEGER DEFAULT 0,
            low_count INTEGER DEFAULT 0,
            new_threats INTEGER DEFAULT 0,
            report_path TEXT
        )
    ''')

    conn.commit()
    conn.close()
    print("[+] Database initialised successfully.")


def insert_threat(threat_data):
    """Insert a new threat into the database. Skips duplicates."""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()

    try:
        cursor.execute('''
            INSERT OR IGNORE INTO threats 
            (source, source_url, title, description, date_published,
             date_scraped, matched_keywords, component_affected, severity,
             exploit_confirmed, exploit_detail, exploiter_name, exploiter_alias,
             exploiter_group, exploiter_country, exploiter_profile_url,
             exploiter_type, cvss_score, cve_id, raw_data)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            threat_data.get("source", ""),
            threat_data.get("source_url", ""),
            threat_data.get("title", ""),
            threat_data.get("description", ""),
            threat_data.get("date_published", ""),
            datetime.now().isoformat(),
            ",".join(threat_data.get("matched_keywords", [])),
            threat_data.get("component_affected", ""),
            threat_data.get("severity", "unknown"),
            1 if threat_data.get("exploit_confirmed") else 0,
            threat_data.get("exploit_detail", ""),
            threat_data.get("exploiter_name", ""),
            threat_data.get("exploiter_alias", ""),
            threat_data.get("exploiter_group", ""),
            threat_data.get("exploiter_country", ""),
            threat_data.get("exploiter_profile_url", ""),
            threat_data.get("exploiter_type", ""),
            threat_data.get("cvss_score", 0.0),
            threat_data.get("cve_id", ""),
            threat_data.get("raw_data", ""),
        ))
        conn.commit()

        if cursor.rowcount > 0:
            print(f"  [+] Saved: {threat_data.get('cve_id', 'Unknown')}")
        else:
            print(f"  [=] Duplicate skipped: {threat_data.get('cve_id', 'Unknown')}")

    except Exception as e:
        print(f"  [-] Error saving threat: {e}")
    finally:
        conn.close()


def log_scrape(source, total_found, matched, exploited, status):
    """Log a scraping session."""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()

    cursor.execute('''
        INSERT INTO scrape_log (source, timestamp, total_found, matched, exploited, status)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (source, datetime.now().isoformat(), total_found, matched, exploited, status))

    conn.commit()
    conn.close()


def get_threats_by_severity(severity=None):
    """Get threats filtered by severity. If None, returns all."""
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    if severity:
        cursor.execute(
            "SELECT * FROM threats WHERE severity = ? AND exploit_confirmed = 1 ORDER BY date_scraped DESC",
            (severity,)
        )
    else:
        cursor.execute(
            "SELECT * FROM threats WHERE exploit_confirmed = 1 ORDER BY severity, date_scraped DESC"
        )

    results = cursor.fetchall()
    conn.close()
    return results


def get_threats_for_week(start_date, end_date):
    """Get all confirmed exploit threats within a date range."""
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute('''
        SELECT * FROM threats 
        WHERE exploit_confirmed = 1 
        AND date_scraped BETWEEN ? AND ?
        ORDER BY 
            CASE severity
                WHEN 'critical' THEN 1
                WHEN 'high' THEN 2
                WHEN 'medium' THEN 3
                WHEN 'low' THEN 4
                ELSE 5
            END,
            date_scraped DESC
    ''', (start_date, end_date))

    results = cursor.fetchall()
    conn.close()
    return results


def get_weekly_stats(start_date, end_date):
    """Get summary statistics for a given week."""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()

    stats = {}
    cursor.execute(
        "SELECT COUNT(*) FROM threats WHERE exploit_confirmed = 1 AND date_scraped BETWEEN ? AND ?",
        (start_date, end_date)
    )
    stats["total"] = cursor.fetchone()[0]

    for sev in ["critical", "high", "medium", "low"]:
        cursor.execute(
            "SELECT COUNT(*) FROM threats WHERE severity = ? AND exploit_confirmed = 1 AND date_scraped BETWEEN ? AND ?",
            (sev, start_date, end_date)
        )
        stats[sev] = cursor.fetchone()[0]

    conn.close()
    return stats


if __name__ == "__main__":
    init_db()