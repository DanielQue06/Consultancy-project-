"use client";

// ================================================
// WHAT IS THIS FILE?
// The chat box styled to match the dashboard theme
// Dark navy colors, purple accents — same as sidebar!
// ================================================

import { useState, useRef, useEffect } from "react";
import ChatMessage from "./ChatMessage";

const SUGGESTIONS = [
  "Show critical threats",
  "Any confirmed exploits?",
  "Latest CVE threats",
  "Which components are affected?",
];

type Message = {
  role: "user" | "bot";
  content: string;
};

export default function ChatWindow({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<Message[]>([
    { role: "bot", content: "Welcome to BorgWarner Help Chatbot. I can assist you with threat intelligence, CVEs, and security vulnerabilities across BorgWarner systems." },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  async function sendMessage(text: string) {
    if (!text.trim()) return;

    const userMessage: Message = { role: "user", content: text };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setIsTyping(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: updatedMessages.map(m => ({
            role: m.role === "user" ? "user" : "assistant",
            content: m.content,
          })),
        }),
      });

      const data = await response.json();
      setMessages(prev => [...prev, { role: "bot", content: data.reply }]);
    } catch {
      setMessages(prev => [...prev, { role: "bot", content: "Unable to connect to the intelligence backend. Please ensure all services are running." }]);
    } finally {
      setIsTyping(false);
    }
  }

  return (
    <div style={{
      width: "360px",
      height: "500px",
      backgroundColor: "#0a0e1f",
      borderRadius: "16px",
      display: "flex",
      flexDirection: "column",
      boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
      overflow: "hidden",
      border: "1px solid rgba(124,58,237,0.15)",
    }}>

      {/* ── HEADER — matches dashboard purple theme ── */}
      <div style={{
        background: "linear-gradient(135deg, rgba(124,58,237,0.3), rgba(167,139,250,0.1))",
        borderBottom: "1px solid rgba(124,58,237,0.15)",
        padding: "12px 16px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {/* Bot icon — matches dashboard BW logo style */}
          <div style={{
            width: "32px", height: "32px", borderRadius: "8px",
            background: "linear-gradient(135deg, #7c3aed, #a78bfa)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "14px"
          }}>🤖</div>
          <div>
            <div style={{ color: "white", fontWeight: "600", fontSize: "13px" }}>BorgWarner Help Chatbot</div>
            <div style={{ color: "#a78bfa", fontSize: "10px", letterSpacing: "0.1em" }}>POWERED BY OLLAMA AI</div>
          </div>
        </div>
        <button onClick={onClose} style={{
          background: "none", border: "none", color: "#6b7280",
          cursor: "pointer", fontSize: "16px",
          transition: "color 0.2s"
        }}>✕</button>
      </div>

      {/* ── MESSAGES AREA ── */}
      <div style={{
        flex: 1, overflowY: "auto", padding: "12px",
        display: "flex", flexDirection: "column", gap: "8px",
        scrollbarWidth: "thin",
        scrollbarColor: "rgba(124,58,237,0.3) transparent",
      }}>
        {messages.map((msg, i) => (
          <ChatMessage key={i} role={msg.role} content={msg.content} />
        ))}

        {/* Typing animation */}
        {isTyping && (
          <div style={{
            display: "flex", gap: "4px", padding: "8px 12px",
            backgroundColor: "rgba(124,58,237,0.1)",
            border: "1px solid rgba(124,58,237,0.15)",
            borderRadius: "12px", width: "fit-content"
          }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                width: "7px", height: "7px", borderRadius: "50%",
                backgroundColor: "#a78bfa",
                animation: "bounce 1s infinite",
                animationDelay: `${i * 0.2}s`,
              }} />
            ))}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── SUGGESTION BUTTONS ── */}
      <div style={{
        padding: "6px 12px", display: "flex",
        gap: "6px", flexWrap: "wrap",
        borderTop: "1px solid rgba(255,255,255,0.04)",
      }}>
        {SUGGESTIONS.map((s, i) => (
          <button key={i} onClick={() => sendMessage(s)} style={{
            fontSize: "10px", padding: "4px 8px",
            backgroundColor: "rgba(124,58,237,0.1)",
            color: "#a78bfa",
            border: "1px solid rgba(124,58,237,0.2)",
            borderRadius: "12px", cursor: "pointer",
          }}>{s}</button>
        ))}
      </div>

      {/* ── INPUT AREA ── */}
      <div style={{
        padding: "10px 12px", display: "flex", gap: "8px",
        borderTop: "1px solid rgba(255,255,255,0.04)",
      }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && sendMessage(input)}
          placeholder="Ask about threats, CVEs, exploits..."
          style={{
            flex: 1, padding: "8px 12px", borderRadius: "20px",
            border: "1px solid rgba(124,58,237,0.2)",
            backgroundColor: "rgba(124,58,237,0.05)",
            color: "white", fontSize: "12px", outline: "none",
          }}
        />
        <button onClick={() => sendMessage(input)} style={{
          width: "36px", height: "36px", borderRadius: "50%",
          background: "linear-gradient(135deg, #7c3aed, #a78bfa)",
          border: "none", color: "white", cursor: "pointer", fontSize: "14px",
        }}>➤</button>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
      `}</style>
    </div>
  );
}