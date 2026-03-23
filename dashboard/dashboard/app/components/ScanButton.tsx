// app/components/ScanButton.tsx
"use client";

import { useState } from "react";

export default function ScanButton() {
  const [scanning, setScanning] = useState(false);
  const [output, setOutput] = useState<string | null>(null);
  const [error, setError] = useState(false);

  async function runScan() {
    setScanning(true);
    setOutput(null);
    setError(false);

    try {
      const res = await fetch("/api/scan", { method: "POST" });
      const data = await res.json();

      setOutput(data.output);
      setError(!data.success);

      // Refresh the page after a successful scan so dashboard shows new data
      if (data.success) {
        setTimeout(() => window.location.reload(), 2000);
      }
    } catch (err) {
      setOutput("Failed to connect to scan API");
      setError(true);
    } finally {
      setScanning(false);
    }
  }

  return (
    <div>
      <button
        onClick={runScan}
        disabled={scanning}
        className="group relative overflow-hidden rounded-xl p-4 transition hover:scale-[1.01] w-full text-left cursor-pointer disabled:opacity-50 disabled:cursor-wait"
        style={{
          background: "linear-gradient(135deg, rgba(59,130,246,0.1), rgba(96,165,250,0.04))",
          border: "1px solid rgba(59,130,246,0.1)",
        }}
      >
        <div className="absolute top-0 right-0 w-20 h-20 rounded-full bg-blue-500/5 -translate-y-6 translate-x-6" />
        <span className="text-lg mb-2 block">{scanning ? "⏳" : "🔍"}</span>
        <p className="text-[12px] text-white font-medium">
          {scanning ? "Scanning..." : "Run Scan"}
        </p>
        <p className="text-[10px] text-gray-600 mt-0.5">
          {scanning ? "Checking NVD + CISA KEV" : "Scan for new threats now"}
        </p>
      </button>

      {/* Scan output terminal */}
      {output && (
        <div className={`mt-3 rounded-xl p-4 font-mono text-[10px] leading-relaxed max-h-[300px] overflow-y-auto ${error ? "bg-rose-950/30 border border-rose-500/10" : "bg-[#0a0e1a] border border-white/[0.04]"}`}>
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-2 h-2 rounded-full ${error ? "bg-rose-500" : "bg-emerald-500"}`} />
            <span className={`text-[9px] uppercase tracking-widest font-medium ${error ? "text-rose-400" : "text-emerald-400"}`}>
              {error ? "Scan Failed" : "Scan Complete"}
            </span>
          </div>
          <pre className="text-gray-400 whitespace-pre-wrap">{output}</pre>
        </div>
      )}
    </div>
  );
}