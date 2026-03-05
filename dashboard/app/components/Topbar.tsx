// app/components/Topbar.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

interface Threat {
  id: string;
  title: string;
  severity: string;
  cve?: string;
  target?: string;
}

export default function Topbar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Threat[]>([]);
  const [threats, setThreats] = useState<Threat[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Fetch threats on mount
  useEffect(() => {
    fetch("/api/threats")
      .then((r) => r.json())
      .then((data) => setThreats(data))
      .catch(() => {});
  }, []);

  // Filter as user types
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setOpen(false);
      return;
    }
    const q = query.toLowerCase();
    const filtered = threats.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        (t.cve && t.cve.toLowerCase().includes(q)) ||
        (t.target && t.target.toLowerCase().includes(q)) ||
        t.severity.toLowerCase().includes(q)
    );
    setResults(filtered);
    setOpen(true);
  }, [query, threats]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const sevColor: Record<string, string> = {
    critical: "#f43f5e",
    medium: "#f59e0b",
    low: "#10b981",
  };

  return (
    <div className="fixed top-0 left-[220px] right-0 h-14 bg-[#06081a]/80 backdrop-blur-2xl border-b border-white/[0.03] z-40 flex items-center justify-between px-6">
      {/* Search */}
      <div ref={ref} className="relative">
        <div className="flex items-center gap-2 bg-white/[0.03] border border-white/[0.04] rounded-lg px-3 py-1.5 w-80 focus-within:border-violet-500/20 transition">
          <span className="text-gray-600 text-[12px]">⌕</span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => query.trim() && setOpen(true)}
            placeholder="Search threats, CVEs, targets..."
            className="bg-transparent text-[11px] text-gray-300 placeholder-gray-600 outline-none w-full"
          />
          {query && (
            <button onClick={() => { setQuery(""); setOpen(false); }} className="text-gray-600 hover:text-gray-400 text-[10px] transition">✕</button>
          )}
        </div>

        {/* Dropdown */}
        {open && (
          <div className="absolute top-full left-0 mt-1 w-96 bg-[#0b1023] border border-white/[0.06] rounded-xl shadow-2xl shadow-black/40 overflow-hidden z-50">
            {results.length === 0 ? (
              <div className="px-4 py-3">
                <p className="text-[11px] text-gray-500">No results for &quot;{query}&quot;</p>
              </div>
            ) : (
              <>
                <div className="px-4 py-2 border-b border-white/[0.04]">
                  <p className="text-[9px] text-gray-600 uppercase tracking-widest font-medium">{results.length} result{results.length !== 1 ? "s" : ""}</p>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {results.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => { setOpen(false); setQuery(""); router.push(`/threats?search=${encodeURIComponent(t.cve || t.title)}`); }}
                      className="w-full text-left px-4 py-2.5 hover:bg-white/[0.03] transition flex items-center justify-between border-b border-white/[0.02] last:border-0"
                    >
                      <div>
                        <p className="text-[11px] text-gray-300 font-medium">{t.title}</p>
                        <p className="text-[9px] text-gray-600 font-mono mt-0.5">{t.cve} · {t.target}</p>
                      </div>
                      <span
                        className="px-1.5 py-px rounded text-[8px] font-semibold uppercase tracking-wider border"
                        style={{
                          color: sevColor[t.severity] || "#6b7280",
                          backgroundColor: `${sevColor[t.severity] || "#6b7280"}10`,
                          borderColor: `${sevColor[t.severity] || "#6b7280"}18`,
                        }}
                      >
                        {t.severity}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Status */}
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/5 border border-emerald-500/10">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-[10px] text-emerald-400/70 font-medium">Online</span>
      </div>
    </div>
  );
}