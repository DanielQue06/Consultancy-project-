// app/components/Navbar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", label: "Dashboard" },
  { href: "/threats", label: "Threats" },
  { href: "/reports", label: "Reports" },
  { href: "/chatbot", label: "AI Chatbot" },
];

export default function Navbar() {
  const path = usePathname();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-14 bg-[#080c14]/80 backdrop-blur-2xl border-b border-white/[0.03]">
      <div className="max-w-[1360px] mx-auto h-full px-6 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
            <span className="text-white text-[10px] font-bold tracking-tight">BW</span>
          </div>
          <div>
            <p className="text-[13px] font-semibold text-white tracking-tight leading-none">BorgWarner</p>
            <p className="text-[8px] text-gray-600 tracking-[0.2em] uppercase mt-0.5">Cyber Intelligence</p>
          </div>
        </div>

        {/* Nav */}
        <div className="flex items-center gap-1">
          {NAV.map((item) => {
            const active = path === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3.5 py-1.5 rounded-lg text-[12px] font-medium transition-all ${
                  active
                    ? "text-white"
                    : "text-gray-500 hover:text-gray-300 hover:bg-white/[0.03]"
                }`}
                style={active ? {
                  background: "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.08))",
                  border: "1px solid rgba(99,102,241,0.15)",
                } : { border: "1px solid transparent" }}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-500/5 border border-emerald-500/10">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] text-emerald-400/70 font-medium">Online</span>
          </div>
        </div>
      </div>
    </nav>
  );
}