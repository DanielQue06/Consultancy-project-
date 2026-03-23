// app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import ChatWidget from "./components/chatbot/ChatWidget"; // 👈 ADD THIS LINE

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BorgWarner Cyber Dashboard",
  description: "Threat Intelligence Dashboard — BorgWarner Gateshead",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-[#06081a] text-white antialiased`}>
        <Sidebar />
        <div className="ml-[220px]">
          <Topbar />
          <main className="pt-16 px-6 py-5">
            {children}
          </main>
        </div>
        <ChatWidget/> {/* 👈 ADD THIS LINE — puts chatbot on every page! */}
      </body>
    </html>
  );
}