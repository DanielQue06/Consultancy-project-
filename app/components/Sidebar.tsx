// app/components/Sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const MENU = [
  { href: "/", label: "Dashboard", icon: "⬡" },
  { href: "/threats", label: "Threat Feed", icon: "△" },
  { href: "/reports", label: "Reports", icon: "◻" },
  { href: "/chatbot", label: "AI Chatbot", icon: "◎" },
];

export default function Sidebar() {
  const path = usePathname();

  return (
    <aside className="fixed top-0 left-0 bottom-0 w-[220px] bg-[#0a0e1f] border-r border-white/[0.04] flex flex-col z-50">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/[0.04]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #7c3aed, #a78bfa)" }}>
            <span className="text-white text-[10px] font-bold">BW</span>
          </div>
          <div>
            <p className="text-[13px] font-semibold text-white tracking-tight leading-none">BorgWarner</p>
            <p className="text-[8px] text-gray-600 tracking-[0.2em] uppercase mt-0.5">Cyber Intelligence</p>
          </div>
        </div>
      </div>

      {/* Menu */}
      <div className="flex-1 px-3 py-4">
        <p className="text-[9px] text-gray-600 uppercase tracking-[0.15em] font-semibold px-2 mb-2">Menu</p>
        <div className="space-y-0.5">
          {MENU.map((item) => {
            const active = path === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] font-medium transition-all ${
                  active ? "text-white" : "text-gray-500 hover:text-gray-300 hover:bg-white/[0.03]"
                }`}
                style={active ? {
                  background: "linear-gradient(135deg, rgba(124,58,237,0.2), rgba(167,139,250,0.08))",
                  border: "1px solid rgba(124,58,237,0.15)",
                } : { border: "1px solid transparent" }}
              >
                <span className={`text-[11px] ${active ? "text-violet-400" : "text-gray-600"}`}>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="mt-6">
          <p className="text-[9px] text-gray-600 uppercase tracking-[0.15em] font-semibold px-2 mb-2">Sources</p>
          <div className="space-y-0.5">
            <SourceItem label="NVD" status="active" />
            <SourceItem label="MITRE ATT&CK" status="active" />
            <SourceItem label="AlienVault OTX" status="active" />
          </div>
        </div>
      </div>

      {/* Bottom */}
      <div className="px-3 pb-4">
        <div className="rounded-xl p-3.5" style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.12), rgba(167,139,250,0.05))", border: "1px solid rgba(124,58,237,0.1)" }}>
          <p className="text-[11px] text-violet-300 font-semibold">BorgWarner</p>
          <p className="text-[10px] text-gray-500 mt-0.5">Gateshead Plant</p>
          <p className="text-[9px] text-gray-600 mt-1">Monitoring since Jan 2026</p>
        </div>
      </div>
    </aside>
  );
}

function SourceItem({ label, status }: { label: string; status: string }) {
  return (
    <div className="flex items-center justify-between px-3 py-1.5 rounded-lg">
      <span className="text-[11px] text-gray-500">{label}</span>
      <div className={`w-1.5 h-1.5 rounded-full ${status === "active" ? "bg-emerald-400" : "bg-gray-600"}`} />
    </div>
  );
}