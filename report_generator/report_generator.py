# report_generator.py
# ============================================================
# BorgWarner Cyber Dashboard - HTML Weekly Report Generator
# Put this in report_generator/ folder
# ============================================================

import os
from datetime import datetime, timedelta
from jinja2 import Template
from shared.database import get_threats_for_week, get_weekly_stats
from scraper.config import REPORT_OUTPUT_DIR


HTML_TEMPLATE = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>BorgWarner Cyber Threat Report - Week {{ week_number }}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', Arial, sans-serif;
            background: #0a0a0a;
            color: #e0e0e0;
            padding: 40px;
        }
        .container { max-width: 1100px; margin: 0 auto; }

        /* Header */
        .header {
            background: linear-gradient(135deg, #1a1a2e, #16213e);
            padding: 30px;
            border-radius: 10px;
            margin-bottom: 30px;
            border-left: 4px solid #e94560;
        }
        .header h1 { font-size: 24px; color: #ffffff; }
        .header p { color: #8892b0; margin-top: 8px; font-size: 14px; }
        .header .subtitle { font-size: 13px; color: #5a6785; margin-top: 4px; }

        /* Stats Grid */
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            gap: 15px;
            margin-bottom: 30px;
        }
        .stat-card {
            background: #1a1a2e;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            border: 1px solid #2a2a4e;
        }
        .stat-card .number { font-size: 36px; font-weight: bold; }
        .stat-card .label {
            font-size: 11px;
            color: #8892b0;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-top: 5px;
        }
        .critical .number { color: #ff4444; }
        .high .number { color: #ff8c00; }
        .medium .number { color: #ffd700; }
        .low .number { color: #4ecdc4; }
        .total .number { color: #e94560; }

        /* Section Titles */
        .section-title {
            font-size: 18px;
            color: #ffffff;
            margin: 30px 0 15px 0;
            padding-bottom: 8px;
            border-bottom: 2px solid #e94560;
        }

        /* Threats Table */
        .threats-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
        }
        .threats-table th {
            background: #16213e;
            padding: 12px 15px;
            text-align: left;
            font-size: 12px;
            text-transform: uppercase;
            color: #8892b0;
            letter-spacing: 0.5px;
        }
        .threats-table td {
            padding: 12px 15px;
            border-bottom: 1px solid #1a1a2e;
            font-size: 13px;
            vertical-align: top;
        }
        .threats-table tr:hover { background: #1a1a2e; }
        .threats-table a { color: #64b5f6; text-decoration: none; }
        .threats-table a:hover { text-decoration: underline; }

        /* Severity Badges */
        .severity-badge {
            padding: 4px 10px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: bold;
            text-transform: uppercase;
            display: inline-block;
        }
        .severity-critical { background: #ff444433; color: #ff4444; border: 1px solid #ff444455; }
        .severity-high { background: #ff8c0033; color: #ff8c00; border: 1px solid #ff8c0055; }
        .severity-medium { background: #ffd70033; color: #ffd700; border: 1px solid #ffd70055; }
        .severity-low { background: #4ecdc433; color: #4ecdc4; border: 1px solid #4ecdc455; }
        .severity-unknown { background: #88888833; color: #888888; border: 1px solid #88888855; }

        /* Ransomware Badge */
        .ransomware-badge {
            padding: 2px 8px;
            border-radius: 3px;
            font-size: 10px;
            font-weight: bold;
            text-transform: uppercase;
        }
        .ransomware-yes { background: #ff444433; color: #ff4444; }
        .ransomware-no { background: #4ecdc433; color: #4ecdc4; }

        /* CVSS Score */
        .cvss-score {
            font-weight: bold;
            font-size: 14px;
        }
        .cvss-critical { color: #ff4444; }
        .cvss-high { color: #ff8c00; }
        .cvss-medium { color: #ffd700; }
        .cvss-low { color: #4ecdc4; }

        /* Threat Detail Card */
        .threat-card {
            background: #1a1a2e;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 15px;
            border-left: 4px solid #e94560;
        }
        .threat-card.card-critical { border-left-color: #ff4444; }
        .threat-card.card-high { border-left-color: #ff8c00; }
        .threat-card.card-medium { border-left-color: #ffd700; }
        .threat-card.card-low { border-left-color: #4ecdc4; }
        .threat-card h3 {
            font-size: 15px;
            color: #ffffff;
            margin-bottom: 10px;
        }
        .threat-card p {
            font-size: 13px;
            color: #b0b0b0;
            line-height: 1.6;
            margin-bottom: 8px;
        }
        .threat-meta {
            display: flex;
            gap: 20px;
            flex-wrap: wrap;
            margin-top: 10px;
            font-size: 12px;
            color: #8892b0;
        }
        .threat-meta span { display: inline-block; }
        .threat-meta strong { color: #c0c0c0; }

        /* No Threats Message */
        .no-threats {
            color: #4ecdc4;
            padding: 30px;
            text-align: center;
            background: #1a1a2e;
            border-radius: 8px;
            font-size: 16px;
        }

        /* Footer */
        .footer {
            text-align: center;
            margin-top: 50px;
            padding-top: 20px;
            border-top: 1px solid #1a1a2e;
            color: #5a6785;
            font-size: 12px;
        }

        /* Data Sources */
        .sources {
            background: #1a1a2e;
            padding: 15px 20px;
            border-radius: 8px;
            margin-top: 30px;
            font-size: 12px;
            color: #8892b0;
        }
        .sources h4 { color: #ffffff; margin-bottom: 8px; font-size: 13px; }
    </style>
</head>
<body>
    <div class="container">

        <!-- Header -->
        <div class="header">
            <h1>BorgWarner Cybersecurity Threat Report</h1>
            <p>Week {{ week_number }} &nbsp;|&nbsp; {{ week_start }} to {{ week_end }}</p>
            <p class="subtitle">Generated: {{ generated_at }} &nbsp;|&nbsp; Source: NVD + CISA KEV &nbsp;|&nbsp; Confirmed Exploits Only</p>
        </div>

        <!-- Summary Stats -->
        <div class="stats-grid">
            <div class="stat-card total">
                <div class="number">{{ stats.total }}</div>
                <div class="label">Total Threats</div>
            </div>
            <div class="stat-card critical">
                <div class="number">{{ stats.critical }}</div>
                <div class="label">Critical</div>
            </div>
            <div class="stat-card high">
                <div class="number">{{ stats.high }}</div>
                <div class="label">High</div>
            </div>
            <div class="stat-card medium">
                <div class="number">{{ stats.medium }}</div>
                <div class="label">Medium</div>
            </div>
            <div class="stat-card low">
                <div class="number">{{ stats.low }}</div>
                <div class="label">Low</div>
            </div>
        </div>

        <!-- Threats Table -->
        <h2 class="section-title">Confirmed Exploited Vulnerabilities</h2>

        {% if threats %}
        <table class="threats-table">
            <thead>
                <tr>
                    <th>Severity</th>
                    <th>CVE ID</th>
                    <th>CVSS</th>
                    <th>Component</th>
                    <th>Ransomware</th>
                    <th>Source</th>
                    <th>Date</th>
                </tr>
            </thead>
            <tbody>
                {% for threat in threats %}
                <tr>
                    <td><span class="severity-badge severity-{{ threat.severity }}">{{ threat.severity }}</span></td>
                    <td><a href="https://nvd.nist.gov/vuln/detail/{{ threat.cve_id }}" target="_blank">{{ threat.cve_id }}</a></td>
                    <td>
                        {% if threat.cvss_score >= 9.0 %}
                            <span class="cvss-score cvss-critical">{{ threat.cvss_score }}</span>
                        {% elif threat.cvss_score >= 7.0 %}
                            <span class="cvss-score cvss-high">{{ threat.cvss_score }}</span>
                        {% elif threat.cvss_score >= 4.0 %}
                            <span class="cvss-score cvss-medium">{{ threat.cvss_score }}</span>
                        {% else %}
                            <span class="cvss-score cvss-low">{{ threat.cvss_score }}</span>
                        {% endif %}
                    </td>
                    <td>{{ threat.component_affected }}</td>
                    <td>
                        {% if threat.exploiter_type == 'ransomware_group' %}
                            <span class="ransomware-badge ransomware-yes">Yes</span>
                        {% else %}
                            <span class="ransomware-badge ransomware-no">No</span>
                        {% endif %}
                    </td>
                    <td>{{ threat.source }}</td>
                    <td>{{ threat.date_published or threat.date_scraped[:10] }}</td>
                </tr>
                {% endfor %}
            </tbody>
        </table>

        <!-- Detailed Cards for Critical & High -->
        <h2 class="section-title">Critical & High Threat Details</h2>

        {% for threat in threats %}
            {% if threat.severity in ['critical', 'high'] %}
            <div class="threat-card card-{{ threat.severity }}">
                <h3>
                    <span class="severity-badge severity-{{ threat.severity }}">{{ threat.severity }}</span>
                    &nbsp; {{ threat.cve_id }}
                </h3>
                <p>{{ threat.description[:500] }}{% if threat.description|length > 500 %}...{% endif %}</p>
                <div class="threat-meta">
                    <span><strong>CVSS:</strong> {{ threat.cvss_score }}</span>
                    <span><strong>Component:</strong> {{ threat.component_affected }}</span>
                    <span><strong>Keywords:</strong> {{ threat.matched_keywords }}</span>
                    <span><strong>Published:</strong> {{ threat.date_published or 'N/A' }}</span>
                    <span>
                        <a href="https://nvd.nist.gov/vuln/detail/{{ threat.cve_id }}" target="_blank">
                            View on NVD &rarr;
                        </a>
                    </span>
                </div>
            </div>
            {% endif %}
        {% endfor %}

        {% else %}
        <div class="no-threats">
            No confirmed exploited vulnerabilities matching BorgWarner products found this week.
        </div>
        {% endif %}

        <!-- Data Sources -->
        <div class="sources">
            <h4>Data Sources</h4>
            <p>
                <strong>NVD</strong> - NIST National Vulnerability Database (nvd.nist.gov)
                &nbsp;|&nbsp;
                <strong>CISA KEV</strong> - Known Exploited Vulnerabilities Catalog (cisa.gov/known-exploited-vulnerabilities-catalog)
            </p>
            <p style="margin-top: 5px;">
                Only vulnerabilities with confirmed exploitation (listed in CISA KEV) are included in this report.
            </p>
        </div>

        <!-- Footer -->
        <div class="footer">
            <p>BorgWarner Cyber Dashboard &nbsp;|&nbsp; Fortified Solutions &nbsp;|&nbsp; Auto-Generated Report</p>
            <p style="margin-top: 5px;">University of Northumbria at Newcastle - Experiential Learning Project 2026</p>
        </div>

    </div>
</body>
</html>
"""


def generate_html_report(week_start=None, week_end=None):
    """Generate a weekly HTML report."""
    if not week_end:
        week_end = datetime.now()
    if not week_start:
        week_start = week_end - timedelta(days=365)  # Look back up to a year

    start_str = week_start.strftime("%Y-%m-%d")
    end_str = week_end.strftime("%Y-%m-%d")

    # Get data from database
    threats = get_threats_for_week(start_str, end_str)
    stats = get_weekly_stats(start_str, end_str)
    week_number = week_end.isocalendar()[1]

    # Render template
    template = Template(HTML_TEMPLATE)
    html_content = template.render(
        week_number=week_number,
        week_start=start_str,
        week_end=end_str,
        generated_at=datetime.now().strftime("%Y-%m-%d %H:%M"),
        stats=stats,
        threats=[dict(t) for t in threats],
    )

    # Save file
    os.makedirs(REPORT_OUTPUT_DIR, exist_ok=True)
    filename = f"threat_report_week{week_number}_{end_str}.html"
    filepath = os.path.join(REPORT_OUTPUT_DIR, filename)

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(html_content)

    print(f"[+] HTML report generated: {filepath}")
    return filepath


def generate_full_report(days_back=30):
    """Generate a report covering a custom date range."""
    week_end = datetime.now()
    week_start = week_end - timedelta(days=days_back)
    return generate_html_report(week_start=week_start, week_end=week_end)


if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1 and sys.argv[1] == "--full":
        print("Generating full 30-day report...")
        generate_full_report(days_back=30)
    else:
        print("Generating weekly report...")
        generate_html_report()