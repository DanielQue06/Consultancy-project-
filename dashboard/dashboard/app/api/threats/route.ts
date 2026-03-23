// app/api/threats/route.ts
// API route that reads threats from the SQLite database populated by the scraper

import { NextResponse } from "next/server";
import path from "path";
import Database from "better-sqlite3";

export const dynamic = "force-dynamic";

export async function GET() {
  const dbPath = path.join(process.cwd(), "..", "..", "shared", "borgwarner_threats.db");

  try {
    const db = new Database(dbPath, { readonly: true });
    const threats = db.prepare(
      `SELECT id, source, source_url, title, description, date_published, 
              date_scraped, component_affected, severity, exploit_confirmed,
              exploit_detail, cvss_score, cve_id
       FROM threats 
       ORDER BY 
         CASE severity WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 WHEN 'low' THEN 4 ELSE 5 END,
         date_scraped DESC`
    ).all();
    db.close();

    return NextResponse.json(threats);
  } catch (err) {
    console.error("Failed to read database:", err);
    return NextResponse.json([], { status: 500 });
  }
}