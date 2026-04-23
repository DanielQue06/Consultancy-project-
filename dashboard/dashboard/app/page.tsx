// This is the start of the dahsboard
import path from "path";
import Database from "better-sqlite3";
import ThreatDonut from "./components/ThreatDonut";
import ScanButton from "./components/ScanButton";
import SeverityTrend from "./components/SeverityTrend";
import AttackRadar from "./components/AttackRadar";
import CvssDistribution from "./components/CvssDistribution";
import Link from "next/link";
// this mkaes next.js load fresh data each time 
export const dynamic = "force-dynamic";

//Defines the shape of one threat objective and all the threats should follow this structure
interface Threat {
  id: number;
  title: string;
  severity: "critical" | "high" | "medium" | "low";
  source: string;
  date_published: string;
  cve_id: string;
  cvss_score: number;
  component_affected: string;
  description: string;
  exploit_confirmed: number;
}

//This function first tries to find threats in the real database
// If that doesnt work, it will fallback onto the fake data
function getThreats(): Threat[] {
  const dbPath = path.join(process.cwd(), "..", "..", "shared", "borgwarner_threats.db");
  try {
    const db = new Database(dbPath, { readonly: true });
    const rows = db.prepare(
      `SELECT * FROM threats ORDER BY
        CASE severity WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 WHEN 'low' THEN 4 ELSE 5 END,
        date_scraped DESC`
    ).all() as Threat[];
    db.close();
    if (rows.length > 0) return rows;
  } catch (err) {
    console.error("Failed to read database:", err);
  }

  // Sample data using the key words given , the code will full back onto this if the scan doesnt work 
  return [
    { id: 1, title: "Infineon TriCore RCE", severity: "critical", source: "NVD", date_published: "2026-03-14", cve_id: "CVE-2026-2841", cvss_score: 9.8, component_affected: "ECU Firmware", description: "Remote code execution in Infineon TriCore bootloader via malformed CAN frame allows full ECU takeover", exploit_confirmed: 1 },
    { id: 2, title: "Aurix TC387 Key Extract", severity: "critical", source: "Auto-ISAC", date_published: "2026-03-12", cve_id: "CVE-2026-2798", cvss_score: 9.4, component_affected: "HSM Security Module", description: "Cryptographic key extraction from Aurix TC387 via side-channel attack on AES-128 implementation", exploit_confirmed: 1 },
    { id: 3, title: "CycurHSM Auth Bypass", severity: "critical", source: "CERT/CC", date_published: "2026-03-10", cve_id: "CVE-2026-2756", cvss_score: 9.6, component_affected: "HSM Security Module", description: "Authentication bypass in CycurHSM interface permits unsigned firmware injection on Vector MicroSAR stack", exploit_confirmed: 1 },
    { id: 4, title: "vHSM Signing Bypass", severity: "critical", source: "ICS-CERT", date_published: "2026-03-08", cve_id: "CVE-2026-2711", cvss_score: 9.1, component_affected: "OTA Update System", description: "vHSM firmware signing bypass allows installation of malicious calibration data via OTA channel", exploit_confirmed: 0 },
    { id: 5, title: "S32K14 Stack Overflow", severity: "critical", source: "NVD", date_published: "2026-03-05", cve_id: "CVE-2026-2688", cvss_score: 9.3, component_affected: "Powertrain Controller", description: "Critical stack overflow in S32K14 CAN message parser enables remote code execution on powertrain network", exploit_confirmed: 1 },
    { id: 6, title: "MPC5777 Buffer Overflow", severity: "critical", source: "MITRE", date_published: "2026-03-02", cve_id: "CVE-2026-2645", cvss_score: 9.0, component_affected: "Battery Management System", description: "Buffer overflow in MPC5777 bootloader enables arbitrary code execution during BMS firmware update", exploit_confirmed: 0 },
    { id: 7, title: "TJA1145 CAN Injection", severity: "high", source: "NVD", date_published: "2026-03-13", cve_id: "CVE-2026-2620", cvss_score: 8.6, component_affected: "CAN Bus Gateway", description: "Improper input validation in TJA1145 transceiver allows CAN frame injection on powertrain network", exploit_confirmed: 1 },
    { id: 8, title: "IDM146 AX DoS", severity: "high", source: "Auto-ISAC", date_published: "2026-03-11", cve_id: "CVE-2026-2589", cvss_score: 8.1, component_affected: "Drive Motor Controller", description: "Denial of service in IDM146 AX integrated drive module via crafted UDS diagnostic request floods CAN bus", exploit_confirmed: 0 },
    { id: 9, title: "MAX17841B Memory Corrupt", severity: "high", source: "Vendor Advisory", date_published: "2026-03-09", cve_id: "CVE-2026-2554", cvss_score: 7.8, component_affected: "Battery Management System", description: "Memory corruption in MAX17841B battery monitor HSM handler allows partial code execution", exploit_confirmed: 1 },
    { id: 10, title: "TC377 RSA Downgrade", severity: "high", source: "CERT/CC", date_published: "2026-03-07", cve_id: "CVE-2026-2521", cvss_score: 7.5, component_affected: "HSM Security Module", description: "TC377 accepts downgraded RSA-2048 cipher suites enabling man-in-the-middle attacks on secure boot", exploit_confirmed: 0 },
    { id: 11, title: "Cobra 55 Race Condition", severity: "high", source: "NVD", date_published: "2026-03-04", cve_id: "CVE-2026-2487", cvss_score: 7.9, component_affected: "ECU Firmware", description: "Race condition in Cobra 55 firmware update mechanism allows partial flash corruption", exploit_confirmed: 0 },
    { id: 12, title: "TI C2000 Key Exposure", severity: "high", source: "ICS-CERT", date_published: "2026-03-01", cve_id: "CVE-2026-2455", cvss_score: 7.4, component_affected: "Inverter Module", description: "TI C2000 exposes unencrypted AES-128 keys in diagnostic memory dump of inverter controller", exploit_confirmed: 1 },
    { id: 13, title: "SPC584B Session Hijack", severity: "high", source: "Auto-ISAC", date_published: "2026-02-27", cve_id: "CVE-2026-2418", cvss_score: 7.6, component_affected: "Telematics Control Unit", description: "Weak session management in SPC584B telematics interface enables session hijacking via replay attack", exploit_confirmed: 0 },
    { id: 14, title: "BQ7961 Integer Overflow", severity: "high", source: "NVD", date_published: "2026-02-24", cve_id: "CVE-2026-2390", cvss_score: 7.2, component_affected: "Battery Management System", description: "Integer overflow in BQ7961 battery cell signal processing leads to denial of service on BMS", exploit_confirmed: 0 },
    { id: 15, title: "Viper 4 XL Flash Corrupt", severity: "high", source: "MITRE", date_published: "2026-02-21", cve_id: "CVE-2026-2361", cvss_score: 8.3, component_affected: "ECU Firmware", description: "Race condition in Viper 4 XL firmware update mechanism allows partial flash corruption of safety ECU", exploit_confirmed: 1 },
    { id: 16, title: "IMMO5 Weak Pairing", severity: "medium", source: "NVD", date_published: "2026-03-13", cve_id: "CVE-2026-2330", cvss_score: 6.5, component_affected: "Keyless Entry System", description: "IMMO5 Bluetooth pairing uses legacy insecure mode allowing eavesdropping on immobiliser handshake", exploit_confirmed: 0 },
    { id: 17, title: "PIC16F183 Info Leak", severity: "medium", source: "Vendor Advisory", date_published: "2026-03-10", cve_id: "CVE-2026-2298", cvss_score: 5.3, component_affected: "ECU Firmware", description: "Information disclosure in PIC16F183 error messages reveals firmware version and build configuration", exploit_confirmed: 0 },
    { id: 18, title: "MCU AXEV Debug UART", severity: "medium", source: "Internal Scan", date_published: "2026-03-07", cve_id: "CVE-2026-2265", cvss_score: 5.9, component_affected: "Drive Motor Controller", description: "Insecure default configuration in MCU AXEV leaves debug UART enabled in production eMotor controller", exploit_confirmed: 0 },
    { id: 19, title: "P452 GPS Spoofing", severity: "medium", source: "CERT/CC", date_published: "2026-03-04", cve_id: "CVE-2026-2233", cvss_score: 5.4, component_affected: "Navigation Module", description: "GPS spoofing susceptibility in P452 navigation module causes incorrect positioning data", exploit_confirmed: 0 },
    { id: 20, title: "NXP MC9S12 Cert Depth", severity: "medium", source: "NVD", date_published: "2026-03-01", cve_id: "CVE-2026-2198", cvss_score: 6.1, component_affected: "OTA Update System", description: "NXP MC9S12 does not properly validate SHA-256 certificate chain depth on OTA packages", exploit_confirmed: 0 },
    { id: 21, title: "TLE9471 Path Traversal", severity: "medium", source: "Auto-ISAC", date_published: "2026-02-26", cve_id: "CVE-2026-2167", cvss_score: 5.7, component_affected: "CAN Bus Gateway", description: "Path traversal in TLE9471 gateway file system access allows reading sensitive CAN routing config", exploit_confirmed: 0 },
    { id: 22, title: "SPC5777 Weak RNG", severity: "medium", source: "MITRE", date_published: "2026-02-23", cve_id: "CVE-2026-2134", cvss_score: 4.8, component_affected: "HSM Security Module", description: "Weak random number generation in SPC5777 AES-128 implementation reduces session key entropy", exploit_confirmed: 0 },
    { id: 23, title: "P456 XSS Config Panel", severity: "medium", source: "Internal Scan", date_published: "2026-02-20", cve_id: "CVE-2026-2101", cvss_score: 4.3, component_affected: "Infotainment System", description: "Cross-site scripting in P456 web configuration interface via unsanitised diagnostic parameters", exploit_confirmed: 0 },
    { id: 24, title: "VAG AR4 Cert Validation", severity: "medium", source: "NVD", date_published: "2026-02-17", cve_id: "CVE-2026-2070", cvss_score: 5.0, component_affected: "OTA Update System", description: "VAG AR4 does not properly validate RSA-2048 certificate chain on secure boot images", exploit_confirmed: 0 },
    { id: 25, title: "Atos CardOS Weak RNG", severity: "medium", source: "CERT/CC", date_published: "2026-02-14", cve_id: "CVE-2026-2038", cvss_score: 4.5, component_affected: "HSM Security Module", description: "Weak random number generation in Atos CardOS Secure Hardware Extension reduces key entropy", exploit_confirmed: 0 },
    { id: 26, title: "C3PS Debug UART", severity: "medium", source: "Internal Scan", date_published: "2026-02-11", cve_id: "CVE-2026-2009", cvss_score: 5.5, component_affected: "Charging Interface", description: "Insecure default configuration in C3PS charging controller leaves debug UART enabled in production", exploit_confirmed: 0 },
    { id: 27, title: "VKMS Version Leak", severity: "low", source: "Internal Scan", date_published: "2026-03-12", cve_id: "CVE-2026-1980", cvss_score: 3.1, component_affected: "ECU Firmware", description: "Verbose error logging in VKMS key management system exposes internal network topology details", exploit_confirmed: 0 },
    { id: 28, title: "HSM Vector Debug EP", severity: "low", source: "Vendor Advisory", date_published: "2026-03-08", cve_id: "CVE-2026-1955", cvss_score: 2.7, component_affected: "HSM Security Module", description: "Debug HTTP endpoint left active on HSM Vector production firmware build", exploit_confirmed: 0 },
    { id: 29, title: "Inverter TLS 1.0", severity: "low", source: "NVD", date_published: "2026-03-04", cve_id: "CVE-2026-1920", cvss_score: 3.4, component_affected: "Inverter Module", description: "TLS 1.0 still supported on Inverter OTA diagnostics server allowing protocol downgrade attacks", exploit_confirmed: 0 },
    { id: 30, title: "TJA1044 FW Disclosure", severity: "low", source: "Auto-ISAC", date_published: "2026-02-28", cve_id: "CVE-2026-1888", cvss_score: 2.3, component_affected: "CAN Bus Gateway", description: "TJA1044 firmware version string disclosed in unencrypted CAN broadcast message on gateway network", exploit_confirmed: 0 },
    { id: 31, title: "YubiHSM No Rate Limit", severity: "low", source: "Internal Scan", date_published: "2026-02-22", cve_id: "CVE-2026-1856", cvss_score: 2.1, component_affected: "HSM Security Module", description: "Missing rate limiting on YubiHSM diagnostic request interface allows brute-force enumeration", exploit_confirmed: 0 },
    { id: 32, title: "Yubikey SHA-256 Compat", severity: "low", source: "MITRE", date_published: "2026-02-18", cve_id: "CVE-2026-1822", cvss_score: 1.9, component_affected: "Keyless Entry System", description: "Deprecated SHA-256 fallback algorithm still accepted by Yubikey module for backwards compatibility", exploit_confirmed: 0 },
    { id: 33, title: "SRS Open Port", severity: "low", source: "Internal Scan", date_published: "2026-02-14", cve_id: "CVE-2026-1790", cvss_score: 2.5, component_affected: "ECU Firmware", description: "Unnecessary open port on SRS safety restraint controller enables network fingerprinting of ECU type", exploit_confirmed: 0 },
    { id: 34, title: "MAX178 Log Timestamps", severity: "low", source: "Vendor Advisory", date_published: "2026-02-10", cve_id: "CVE-2026-1758", cvss_score: 1.8, component_affected: "Battery Management System", description: "MAX178 battery monitor log files contain cleartext timestamps enabling traffic analysis of BMS cycles", exploit_confirmed: 0 },
  ];
}

//Main page this function renders in the dashboard
export default function DashboardPage() {
  const threats = getThreats();
// counts how many threats exits for each level 
  const counts = {
    critical: threats.filter((t) => t.severity === "critical").length,
    high: threats.filter((t) => t.severity === "high").length,
    medium: threats.filter((t) => t.severity === "medium").length,
    low: threats.filter((t) => t.severity === "low").length,
  };
  const total = threats.length; // total threat number
// counts the threats by affected componens
//then that object into an array of [component, count] 
// then sorts it by count so the most affected components are at the top of the list
  const targets = Object.entries(
    threats.reduce((a, t) => ({ ...a, [t.component_affected || "Other"]: (a[t.component_affected || "Other"] || 0) + 1 }), {} as Record<string, number>)
  ).sort((a, b) => b[1] - a[1]);

  // Build data for the CVSS distribution chart
  const cvssBuckets = [0, 0, 0, 0, 0]; // 0-2, 2-4, 4-6, 6-8, 8-10
  threats.forEach((t) => {
    const s = t.cvss_score || 0;
    if (s < 2) cvssBuckets[0]++;
    else if (s < 4) cvssBuckets[1]++;
    else if (s < 6) cvssBuckets[2]++;
    else if (s < 8) cvssBuckets[3]++;
    else cvssBuckets[4]++;
  });

  // Build source counts for the source to see how many threats came from each source
  const sourceCounts = Object.entries(
    threats.reduce((a, t) => ({ ...a, [t.source || "Unknown"]: (a[t.source || "Unknown"] || 0) + 1 }), {} as Record<string, number>)
  ).sort((a, b) => b[1] - a[1]);

  // Build component counts for the horizontal bar chart
  const componentCounts = targets.slice(0, 6);

  // Everything belwo is visual board layout and styling
  return (
    <div>
      <h1 className="text-[20px] font-semibold text-white tracking-tight mb-5">Dashboard</h1>

      {/* Row 1: Gradient summary cards */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <GCard label="Critical" value={counts.critical} sub={`of ${total} total`} grad="from-rose-600 to-pink-600" />
        <GCard label="High" value={counts.high} sub={`of ${total} total`} grad="from-orange-500 to-red-500" />
        <GCard label="Medium" value={counts.medium} sub={`of ${total} total`} grad="from-amber-600 to-orange-500" />
        <GCard label="Low" value={counts.low} sub={`of ${total} total`} grad="from-emerald-600 to-teal-500" />
      </div>

      {/* Row 2: Donut + Recent Threats table */}
      <div className="grid grid-cols-12 gap-3 mb-3">
        <div className="col-span-4">
          <Card className="h-full">
            <CHeader title="Threat Distribution" />
            <div className="mt-2">
              <ThreatDonut counts={counts} total={total} />
            </div>
          </Card>
        </div>

        <div className="col-span-8">
          <Card className="h-full">
            <div className="flex items-center justify-between">
              <CHeader title="Recently found threats" />
              <Link href="/threats" className="text-[10px] text-violet-400/60 hover:text-violet-400 transition font-medium">View all →</Link>
            </div>
            <div className="mt-3">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[11px] uppercase tracking-widest text-gray-600 border-b border-white/[0.04]">
                    <th className="pb-2 font-medium">Threat</th>
                    <th className="pb-2 font-medium">Level</th>
                    <th className="pb-2 font-medium">CVSS</th>
                    <th className="pb-2 font-medium">Source</th>
                    <th className="pb-2 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {threats.slice(0, 4).map((t) => (
                    <tr key={t.id} className="border-b border-white/[0.02]">
                      <td className="py-3 pr-3">
                        <p className="text-[14px] text-gray-200 font-medium max-w-[500px]">{t.description}</p>
                        <p className="text-[12px] text-gray-500 font-mono mt-0.5">{t.cve_id}</p>
                      </td>
                      <td className="py-3 pr-3"><Pill sev={t.severity} /></td>
                      <td className="py-3 pr-3"><CvssBar score={t.cvss_score || 0} /></td>
                      <td className="py-3 pr-3 text-[13px] text-gray-500">{t.source}</td>
                      <td className="py-3 text-[13px] text-gray-500">{t.date_published}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>

      {/* Row 3: Severity Trend (line chart) — full width */}
      <div className="mb-3">
        <Card>
          <CHeader title="Severity Trend (Last 12 Weeks)" />
          <div className="mt-3">
            <SeverityTrend threats={threats} />
          </div>
        </Card>
      </div>

      {/* Row 4: Attack Surface Radar + CVSS Distribution */}
      <div className="grid grid-cols-12 gap-3 mb-3">
        <div className="col-span-6">
          <Card className="h-full">
            <CHeader title="Attack Surface Profile" />
            <div className="mt-3">
              <AttackRadar targets={targets} />
            </div>
          </Card>
        </div>
        <div className="col-span-6">
          <Card className="h-full">
            <CHeader title="CVSS Score Distribution" />
            <div className="mt-3">
              <CvssDistribution buckets={cvssBuckets} />
            </div>
          </Card>
        </div>
      </div>

      {/* Row 5: Threat Timeline + Affected Areas + Quick Actions */}
      <div className="grid grid-cols-12 gap-3 mb-3">
        {/* Timeline */}
        <div className="col-span-4">
          <Card className="h-full">
            <CHeader title="Threat Timeline" />
            <div className="mt-3 space-y-0">
              {threats.slice(0, 6).map((t, i) => (
                <div key={t.id} className="relative pl-5 pb-4 last:pb-0">
                  {i < Math.min(threats.length, 6) - 1 && (
                    <div className="absolute left-[5px] top-[10px] bottom-0 w-px bg-white/[0.06]" />
                  )}
                  <div
                    className="absolute left-0 top-[5px] w-[11px] h-[11px] rounded-full border-2 border-[#0b1023]"
                    style={{ backgroundColor: sevColor(t.severity) }}
                  />
                  <div className="flex items-baseline gap-2 mb-0.5">
                    <span className="text-[13px] text-gray-500">{t.date_published}</span>
                    <span className="text-[12px] font-semibold uppercase tracking-wider" style={{ color: sevColor(t.severity) }}>{t.severity}</span>
                  </div>
                  <p className="text-[14px] text-gray-200 leading-snug">{t.description}</p>
                  <p className="text-[12px] text-gray-500 font-mono mt-0.5">{t.cve_id} · {t.cvss_score?.toFixed(1)}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Affected Areas */}
        <div className="col-span-4">
          <Card className="h-full">
            <CHeader title="Affected Areas" />
            <div className="mt-3 space-y-1">
              {targets.map(([target, count]) => (
                <div key={target} className="flex items-center justify-between py-2 px-1">
                  <span className="text-[14px] text-gray-300">{target}</span>
                  <div className="flex items-center gap-2.5">
                    <div className="w-20 h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-500" style={{ width: `${(count / total) * 100}%` }} />
                    </div>
                    <span className="text-[13px] text-gray-400 font-semibold w-4 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Source Breakdown mini-list */}
            <div className="mt-5 pt-4 border-t border-white/[0.04]">
              <p className="text-[15px] font-medium text-white mb-3">Intelligence Sources</p>
              {sourceCounts.slice(0, 5).map(([source, count]) => (
                <div key={source} className="flex items-center justify-between py-1.5 px-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-violet-500" />
                    <span className="text-[14px] text-gray-300">{source}</span>
                  </div>
                  <span className="text-[13px] text-gray-400 font-semibold">{count}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="col-span-4">
          <Card className="h-full">
            <CHeader title="analyst tools" />
            <div className="grid grid-cols-1 gap-3 mt-3">
              <ScanButton />
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
                <p className="text-[12px] text-white font-medium">Threats</p>
                <p className="text-[10px] text-gray-600 mt-0.5">All identified vulnerabilities</p>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// This converts servitry levels to hex colors, used in things like the timeline,servity colours and other styles elemets
/* ── Helper: severity → hex color ── */
function sevColor(sev: string): string {
  const m: Record<string, string> = { critical: "#f43f5e", high: "#f97316", medium: "#f59e0b", low: "#10b981" };
  return m[sev] || "#6b7280";
}

/* ── Shared presentational components ── */

// card wrapper throughout the dashboard 
function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-[#0b1023] border border-white/[0.04] rounded-xl p-5 ${className}`}>{children}</div>;
}

//section titles
function CHeader({ title }: { title: string }) {
  return <p className="text-[13px] font-medium text-white">{title}</p>;
}

// Gradient summarty of the cards 
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

//colored servertiy badge
function Pill({ sev }: { sev: string }) {
  const m: Record<string, string> = {
    critical: "bg-rose-500/10 text-rose-400 border-rose-500/15",
    high: "bg-orange-500/10 text-orange-400 border-orange-500/15",
    medium: "bg-amber-500/10 text-amber-400 border-amber-500/15",
    low: "bg-emerald-500/10 text-emerald-400 border-emerald-500/15",
  };
  return <span className={`${m[sev]} border px-1.5 py-px rounded text-[9px] font-semibold uppercase tracking-wider`}>{sev}</span>;
}

//small progress bar for CVSS scores 
function CvssBar({ score }: { score: number }) {
  const c = score >= 9 ? "#f43f5e" : score >= 7 ? "#f97316" : score >= 4 ? "#f59e0b" : "#10b981";
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-10 h-[2px] rounded-full bg-white/[0.04] overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${(score / 10) * 100}%`, backgroundColor: c }} />
      </div>
      <span className="text-[10px] font-mono font-medium" style={{ color: c }}>{score.toFixed(1)}</span>
    </div>
  );
}