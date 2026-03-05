// app/components/ThreatDonut.tsx
"use client";

import { useState } from "react";

interface Props {
  counts: { critical: number; medium: number; low: number };
  total: number;
}

const SEV = {
  critical: { label: "Critical", color: "#f43f5e" },
  medium:   { label: "Medium",   color: "#f59e0b" },
  low:      { label: "Low",      color: "#10b981" },
};

export default function ThreatDonut({ counts, total }: Props) {
  const [hovered, setHovered] = useState<string | null>(null);

  const segments: { key: string; start: number; end: number; color: string; count: number; label: string }[] = [];
  let angle = 0;
  for (const [key, config] of Object.entries(SEV)) {
    const count = counts[key as keyof typeof counts];
    if (count === 0) continue;
    const sweep = (count / total) * 360;
    segments.push({ key, start: angle, end: angle + sweep, color: config.color, count, label: config.label });
    angle += sweep;
  }

  const cx = 80, cy = 80, r = 58, stroke = 14;
  const hoveredSeg = segments.find((s) => s.key === hovered);

  return (
    <div>
      <div className="flex justify-center mb-4">
        <svg width={160} height={160} style={{ overflow: "visible" }}>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth={stroke} />
          {segments.map((seg) => {
            const active = hovered === seg.key;
            const cr = active ? r + 2 : r;
            const circ = 2 * Math.PI * cr;
            const arc = ((seg.end - seg.start) / 360) * circ;
            const off = ((90 - seg.start) / 360) * circ;
            return (
              <circle
                key={seg.key}
                cx={cx} cy={cy} r={cr}
                fill="none" stroke={seg.color}
                strokeWidth={active ? stroke + 2 : stroke}
                strokeDasharray={`${arc} ${circ - arc}`}
                strokeDashoffset={off}
                strokeLinecap="round"
                style={{
                  transition: "all 0.2s ease",
                  cursor: "pointer",
                  filter: active ? `drop-shadow(0 0 8px ${seg.color}40)` : "none",
                  opacity: hovered && !active ? 0.3 : 1,
                }}
                onMouseEnter={() => setHovered(seg.key)}
                onMouseLeave={() => setHovered(null)}
              />
            );
          })}
          <text x={cx} y={cy - 3} textAnchor="middle" fill="#fff" fontSize={hoveredSeg ? 18 : 22} fontWeight={600} style={{ transition: "all 0.2s" }}>
            {hoveredSeg ? hoveredSeg.count : total}
          </text>
          <text x={cx} y={cy + 11} textAnchor="middle" fill="#4b5563" fontSize={8} fontWeight={500} letterSpacing="0.1em">
            {hoveredSeg ? hoveredSeg.label.toUpperCase() : "TOTAL"}
          </text>
        </svg>
      </div>

      <div className="space-y-1">
        {segments.map((seg) => {
          const pct = ((seg.count / total) * 100).toFixed(0);
          const active = hovered === seg.key;
          return (
            <div
              key={seg.key}
              className="flex items-center justify-between px-2.5 py-[7px] rounded-lg transition-all cursor-pointer"
              style={{
                backgroundColor: active ? `${seg.color}0a` : "transparent",
                border: `1px solid ${active ? `${seg.color}15` : "transparent"}`,
              }}
              onMouseEnter={() => setHovered(seg.key)}
              onMouseLeave={() => setHovered(null)}
            >
              <div className="flex items-center gap-2">
                <div className="w-[6px] h-[6px] rounded-full" style={{ backgroundColor: seg.color, boxShadow: active ? `0 0 6px ${seg.color}40` : "none" }} />
                <span className="text-[11px] text-gray-500 font-medium">{seg.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[12px] font-semibold text-white">{seg.count}</span>
                <span className="text-[9px] text-gray-600 w-6 text-right font-medium">{pct}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}