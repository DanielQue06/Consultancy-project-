import fs from "fs";
import path from "path";
import ThreatDonut from "./components/ThreatDonut";
import Link from "next/link";

export const dynamic = "force-dynamic";

// this creates the structure of the threats 
interface Threat {
  id: string;
  title: string;
  severity: "critical" | "medium" | "low";
  source: string;
  date: string;
  cve?: string;
  cvss?: number;
  target?: string;
}

// Reads threat data from the shared folder 
function getThreats(): Threat[] {
  const filePath = path.join(process.cwd(), "..", "shared", "threats.json");
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw);
  } catch {
    // Sample data modelled on BorgWarner products
    return [
      { id: "1", title: "RCE in ECU Firmware Update", severity: "critical", source: "NVD", date: "2026-03-01", cve: "CVE-2026-21001", cvss: 9.8, target: "ECU Controllers" },
      { id: "2", title: "CAN Bus Message Injection", severity: "critical", source: "MITRE", date: "2026-03-01", cve: "CVE-2026-18842", cvss: 8.8, target: "Turbo Systems" },
      { id: "3", title: "SQL Injection in Plant SCADA", severity: "critical", source: "NVD", date: "2026-02-28", cve: "CVE-2026-15523", cvss: 7.5, target: "Plant Infrastructure" },
      { id: "4", title: "Auth Bypass in OBD-II Diagnostics", severity: "medium", source: "MITRE", date: "2026-02-28", cve: "CVE-2026-14201", cvss: 5.8, target: "Diagnostic Tools" },
      { id: "5", title: "Buffer Overflow in EV Inverter", severity: "medium", source: "NVD", date: "2026-02-27", cve: "CVE-2026-13987", cvss: 5.3, target: "Electrification" },
      { id: "6", title: "Info Disclosure in Supplier API", severity: "medium", source: "NVD", date: "2026-02-27", cve: "CVE-2026-12750", cvss: 4.8, target: "Web Services" },
      { id: "7", title: "CSRF in Plant Monitoring", severity: "medium", source: "MITRE", date: "2026-02-26", cve: "CVE-2026-11504", cvss: 4.5, target: "Plant Infrastructure" },
      { id: "8", title: "Missing Rate Limiting on Auth", severity: "low", source: "AlienVault", date: "2026-02-25", cve: "CVE-2026-09881", cvss: 3.1, target: "Web Services" },
      { id: "9", title: "Outdated OpenSSL on Build Servers", severity: "low", source: "AlienVault", date: "2026-02-25", cve: "CVE-2026-08445", cvss: 2.5, target: "Plant Infrastructure" },
      { id: "10", title: "Weak Ciphers on Legacy Service", severity: "low", source: "AlienVault", date: "2026-02-24", cve: "CVE-2026-07102", cvss: 2.0, target: "Web Services" },
    ];
  }
}

// Main dashboard component 
export default function DashboardPage() {
  const threats = getThreats();

  // This will count the filtered data and put them into the sections 
  const counts = {
    critical: threats.filter((t) => t.severity === "critical").length,
    medium: threats.filter((t) => t.severity === "medium").length,
    low: threats.filter((t) => t.severity === "low").length,
  };
  const total = threats.length;

  // Groups up the threats by target area
  const targets = Object.entries(
    threats.reduce((a, t) => ({ ...a, [t.target || "Other"]: (a[t.target || "Other"] || 0) + 1 }), {} as Record<string, number>)
  ).sort((a, b) => b[1] - a[1]);

  return (
    <div>
      <h1 className="text-[20px] font-semibold text-white tracking-tight mb-5">Dashboard</h1>

      {/* Row 1: Gradient summary cards showing total and per-severity threat counts */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        <GCard label="Total Threats" value={total} sub={`${total} identified`} grad="from-indigo-600 to-violet-600" />
        <GCard label="Critical" value={counts.critical} sub={`of ${total} total`} grad="from-rose-600 to-pink-600" />
        <GCard label="Medium" value={counts.medium} sub={`of ${total} total`} grad="from-amber-600 to-orange-500" />
        <GCard label="Low" value={counts.low} sub={`of ${total} total`} grad="from-emerald-600 to-teal-500" />
      </div>

      {/* Row 2: Donut chart on the left, recent threats table on the right */}
      <div className="grid grid-cols-12 gap-4 mb-4">
        <div className="col-span-5">
          <Card className="h-full">
            <CHeader title="Threat Distribution" />
            <div className="mt-2">
              <ThreatDonut counts={counts} total={total} />
            </div>
          </Card>
        </div>

        {/* Table showing the 4 most recent threats with severity pill and CVSS score bar */}
        <div className="col-span-7">
          <Card className="h-full">
            <div className="flex items-center justify-between">
              <CHeader title="Recent Threats" />
              <Link href="/threats" className="text-[10px] text-violet-400/60 hover:text-violet-400 transition font-medium">View all →</Link>
            </div>
            <div className="mt-3">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[9px] uppercase tracking-widest text-gray-600 border-b border-white/[0.04]">
                    <th className="pb-2 font-medium">Threat</th>
                    <th className="pb-2 font-medium">Level</th>
                    <th className="pb-2 font-medium">CVSS</th>
                    <th className="pb-2 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {threats.slice(0, 4).map((t) => (
                    <tr key={t.id} className="border-b border-white/[0.02]">
                      <td className="py-2 pr-3">
                        <p className="text-[11px] text-gray-300 font-medium">{t.title}</p>
                        <p className="text-[9px] text-gray-600 font-mono">{t.cve}</p>
                      </td>
                      <td className="py-2 pr-3"><Pill sev={t.severity} /></td>
                      <td className="py-2 pr-3"><CvssBar score={t.cvss || 0} /></td>
                      <td className="py-2 text-[10px] text-gray-600">{t.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>

      {/* Row 3: Affected areas with progress bars on the left, quick action cards on the right */}
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-5">
          <Card className="h-full">
            <CHeader title="Affected Areas" />
            <div className="mt-3 space-y-1">
              {targets.map(([target, count]) => (
                <div key={target} className="flex items-center justify-between py-1.5 px-1">
                  <span className="text-[11px] text-gray-400">{target}</span>
                  <div className="flex items-center gap-2.5">
                    <div className="w-16 h-1 rounded-full bg-white/[0.04] overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-500" style={{ width: `${(count / total) * 100}%` }} />
                    </div>
                    <span className="text-[10px] text-gray-500 font-semibold w-3 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Navigation cards linking to other sections of the dashboard */}
        <div className="col-span-7">
          <Card>
            <CHeader title="Quick Actions" />
            <div className="grid grid-cols-2 gap-3 mt-3">
              <Link href="/reports" className="group relative overflow-hidden rounded-xl p-4 transition hover:scale-[1.01]" style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.1), rgba(167,139,250,0.04))", border: "1px solid rgba(124,58,237,0.1)" }}>
                <div className="absolute top-0 right-0 w-20 h-20 rounded-full bg-violet-500/5 -translate-y-6 translate-x-6" />
                <span className="text-lg mb-2 block">📄</span>
                <p className="text-[12px] text-white font-medium">Generate Report</p>
                <p className="text-[10px] text-gray-600 mt-0.5">Weekly intelligence report</p>
              </Link>
              <Link href="/chatbot" className="group relative overflow-hidden rounded-xl p-4 transition hover:scale-[1.01]" style={{ background: "linear-gradient(135deg, rgba(6,182,212,0.08), rgba(34,211,238,0.03))", border: "1px solid rgba(6,182,212,0.08)" }}>
                <div className="absolute top-0 right-0 w-20 h-20 rounded-full bg-cyan-500/5 -translate-y-6 translate-x-6" />
                <span className="text-lg mb-2 block">🤖</span>
                <p className="text-[12px] text-white font-medium">AI Chatbot</p>
                <p className="text-[10px] text-gray-600 mt-0.5">Ask about vulnerabilities</p>
              </Link>
              <Link href="/threats" className="group relative overflow-hidden rounded-xl p-4 transition hover:scale-[1.01]" style={{ background: "linear-gradient(135deg, rgba(244,63,94,0.08), rgba(251,113,133,0.03))", border: "1px solid rgba(244,63,94,0.08)" }}>
                <div className="absolute top-0 right-0 w-20 h-20 rounded-full bg-rose-500/5 -translate-y-6 translate-x-6" />
                <span className="text-lg mb-2 block">⚠️</span>
                <p className="text-[12px] text-white font-medium">Full Threat Feed</p>
                <p className="text-[10px] text-gray-600 mt-0.5">All identified vulnerabilities</p>
              </Link>
              <div className="relative overflow-hidden rounded-xl p-4" style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.08), rgba(52,211,153,0.03))", border: "1px solid rgba(16,185,129,0.08)" }}>
                <div className="absolute top-0 right-0 w-20 h-20 rounded-full bg-emerald-500/5 -translate-y-6 translate-x-6" />
                <span className="text-lg mb-2 block">🛡️</span>
                <p className="text-[12px] text-white font-medium">Risk Posture</p>
                <p className="text-[10px] text-gray-600 mt-0.5">{counts.critical > 0 ? "HIGH — Critical threats active" : "LOW — No critical threats"}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}


function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-[#0b1023] border border-white/[0.04] rounded-xl p-5 ${className}`}>{children}</div>;
}

function CHeader({ title }: { title: string }) {
  return <p className="text-[13px] font-medium text-white">{title}</p>;
}


function GCard({ label, value, sub, grad }: { label: string; value: number; sub: string; grad: string }) {
  return (
    <div className={`relative overflow-hidden rounded-xl p-4 bg-gradient-to-br ${grad}`}>
      <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-white/[0.06] -translate-y-10 translate-x-10" />
      <div className="absolute bottom-0 left-0 w-16 h-16 rounded-full bg-black/10 translate-y-8 -translate-x-6" />
      <div className="relative">
        <p className="text-[10px] text-white/60 uppercase tracking-widest font-medium">{label}</p>
        <p className="text-3xl font-bold text-white mt-1 tracking-tight">{value}</p>
        <p className="text-[10px] text-white/40 mt-0.5">{sub}</p>
      </div>
    </div>
  );
}

// this is the colours for the servarity 
function Pill({ sev }: { sev: string }) {
  const m: Record<string, string> = {
    critical: "bg-rose-500/10 text-rose-400 border-rose-500/15",
    medium: "bg-amber-500/10 text-amber-400 border-amber-500/15",
    low: "bg-emerald-500/10 text-emerald-400 border-emerald-500/15",
  };
  return <span className={`${m[sev]} border px-1.5 py-px rounded text-[9px] font-semibold uppercase tracking-wider`}>{sev}</span>;
}

// Red (7+), Amber (4-6.9), Green (below 4)
function CvssBar({ score }: { score: number }) {
  const c = score >= 7 ? "#f43f5e" : score >= 4 ? "#f59e0b" : "#10b981";
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-10 h-[2px] rounded-full bg-white/[0.04] overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${(score / 10) * 100}%`, backgroundColor: c }} />
      </div>
      <span className="text-[10px] font-mono font-medium" style={{ color: c }}>{score.toFixed(1)}</span>
    </div>
  );
}