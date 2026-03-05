// app/api/threats/route.ts
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const SAMPLE_THREATS = [
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

export async function GET() {
  // Try shared folder first, fall back to sample data
  const filePath = path.join(process.cwd(), "..", "shared", "threats.json");
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    return NextResponse.json(JSON.parse(raw));
  } catch {
    return NextResponse.json(SAMPLE_THREATS);
  }
}