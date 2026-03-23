
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BorgWarner Cyber Dashboard",
  description: "Threat Intelligence Dashboard — BorgWarner Gateshead",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-slate-950 text-white">
          <Sidebar />
          <Topbar />
          <main className="ml-[220px] pt-14 p-6">{children}</main>
        </div>
      </body>
    </html>
  );
}