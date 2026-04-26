import sqlite3
from pathlib import Path
from datetime import datetime
from scraper.config import DATABASE_PATH


def get_unconfirmed_threats():
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    cur.execute("""
        SELECT *
        FROM threats
        WHERE exploit_confirmed = 0
        ORDER BY date_scraped DESC
    """)
    rows = cur.fetchall()
    conn.close()
    return rows


def generate_unconfirmed_report(output_path: Path):
    rows = get_unconfirmed_threats()
    print(f"Unconfirmed threats found: {len(rows)}")

    html_rows = []
    for t in rows:
        html_rows.append(f"""
        <tr>
            <td>{t['id']}</td>
            <td>{t['source']}</td>
            <td><a href="{t['source_url']}" target="_blank">{t['title']}</a></td>
            <td>{t['severity']}</td>
            <td>{t['matched_keywords']}</td>
            <td>{t['component_affected']}</td>
            <td>{t['date_scraped']}</td>
        </tr>
        """)

    html_content = f"""
    <html>
    <head>
        <meta charset="utf-8">
        <title>Unconfirmed Tuning Activity Report</title>
        <style>
            body {{ font-family: Arial, sans-serif; }}
            table {{ border-collapse: collapse; width: 100%; }}
            th, td {{ border: 1px solid #ccc; padding: 6px; font-size: 12px; }}
            th {{ background-color: #f0f0f0; }}
        </style>
    </head>
    <body>
        <h1>Unconfirmed Tuning Activity Report</h1>
        <p>Generated at: {datetime.now().isoformat()}</p>
        <p>Total unconfirmed threats: {len(rows)}</p>
        <table>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Source</th>
                    <th>Title</th>
                    <th>Severity</th>
                    <th>Matched Keywords</th>
                    <th>Component Affected</th>
                    <th>Date Scraped</th>
                </tr>
            </thead>
            <tbody>
                {''.join(html_rows)}
            </tbody>
        </table>
    </body>
    </html>
    """

    output_path.write_text(html_content, encoding="utf-8")
    print(f"[+] Unconfirmed report written to: {output_path}")


if __name__ == "__main__":
    reports_dir = Path("shared/reports")
    reports_dir.mkdir(parents=True, exist_ok=True)

    filename = f"unconfirmed_report_{datetime.now().date()}.html"
    output_file = reports_dir / filename
    generate_unconfirmed_report(output_file)