// app/threats/page.tsx
// Full threat feed page — displays all threats from the SQLite database

import path from "path";
import Database from "better-sqlite3";

export const dynamic = "force-dynamic";

interface Threat {
  id: number;
  source: string;
  source_url: string;
  title: string;
  description: string;
  date_published: string;
  date_scraped: string;
  component_affected: string;
  severity: string;
  exploit_confirmed: number;
  exploit_detail: string;
  cvss_score: number;
  cve_id: string;
  matched_keywords: string;
}

function getThreats(): Threat[] {
  const dbPath = path.join(process.cwd(), "..", "..", "shared", "borgwarner_threats.db");
  try {
    const db = new Database(dbPath, { readonly: true });
    const rows = db.prepare(
      `SELECT * FROM threats ORDER BY 
        CASE severity WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 WHEN 'low' THEN 4 ELSE 5 END,
        cvss_score DESC`
    ).all() as Threat[];
    db.close();
    return rows;
  } catch (err) {
    console.error("Failed to read database:", err);
    return [];
  }
}

export default function ThreatsPage() {
  const threats = getThreats();
  const total = threats.length;
  const critical = threats.filter((t) => t.severity === "critical").length;
  const high = threats.filter((t) => t.severity === "high").length;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-[20px] font-semibold text-white tracking-tight">Threat Feed</h1>
          <p className="text-[11px] text-gray-600 mt-0.5">
            {total} threats detected · {critical} critical · {high} high
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-gray-600 uppercase tracking-widest font-medium">Source: NVD + CISA KEV</span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#0b1023] border border-white/[0.04] rounded-xl overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[9px] uppercase tracking-widest text-gray-600 border-b border-white/[0.04]">
              <th className="px-5 py-3 font-medium">CVE</th>
              <th className="px-5 py-3 font-medium">Description</th>
              <th className="px-5 py-3 font-medium">Severity</th>
              <th className="px-5 py-3 font-medium">CVSS</th>
              <th className="px-5 py-3 font-medium">Component</th>
              <th className="px-5 py-3 font-medium">Source</th>
              <th className="px-5 py-3 font-medium">Exploit</th>
              <th className="px-5 py-3 font-medium">Published</th>
            </tr>
          </thead>
          <tbody>
            {threats.map((t) => (
              <tr key={t.id} className="border-b border-white/[0.02] hover:bg-white/[0.02] transition">
                <td className="px-5 py-3">
                  <a
                    href={t.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-violet-400 font-mono hover:underline"
                  >
                    {t.cve_id}
                  </a>
                </td>
                <td className="px-5 py-3 max-w-[300px]">
                  <p className="text-[11px] text-gray-300 truncate">{t.description}</p>
                </td>
                <td className="px-5 py-3">
                  <Pill sev={t.severity} />
                </td>
                <td className="px-5 py-3">
                  <CvssScore score={t.cvss_score} />
                </td>
                <td className="px-5 py-3">
                  <span className="text-[10px] text-gray-500">{t.component_affected}</span>
                </td>
                <td className="px-5 py-3">
                  <span className="text-[10px] text-gray-600">{t.source}</span>
                </td>
                <td className="px-5 py-3">
                  {t.exploit_confirmed ? (
                    <span className="text-[9px] text-rose-400 bg-rose-500/10 border border-rose-500/15 px-1.5 py-px rounded font-semibold uppercase tracking-wider">Confirmed</span>
                  ) : (
                    <span className="text-[9px] text-gray-600">—</span>
                  )}
                </td>
                <td className="px-5 py-3">
                  <span className="text-[10px] text-gray-600">{t.date_published}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {threats.length === 0 && (
          <div className="px-5 py-10 text-center">
            <p className="text-[12px] text-gray-600">No threats in database. Run a scan to populate.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Pill({ sev }: { sev: string }) {
  const m: Record<string, string> = {
    critical: "bg-rose-500/10 text-rose-400 border-rose-500/15",
    high: "bg-orange-500/10 text-orange-400 border-orange-500/15",
    medium: "bg-amber-500/10 text-amber-400 border-amber-500/15",
    low: "bg-emerald-500/10 text-emerald-400 border-emerald-500/15",
  };
  return (
    <span className={`${m[sev] || ""} border px-1.5 py-px rounded text-[9px] font-semibold uppercase tracking-wider`}>
      {sev}
    </span>
  );
}

function CvssScore({ score }: { score: number }) {
  const c = score >= 9 ? "#f43f5e" : score >= 7 ? "#f97316" : score >= 4 ? "#f59e0b" : "#10b981";
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-8 h-[2px] rounded-full bg-white/[0.04] overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${(score / 10) * 100}%`, backgroundColor: c }} />
      </div>
      <span className="text-[10px] font-mono font-medium" style={{ color: c }}>{score.toFixed(1)}</span>
    </div>
  );
}