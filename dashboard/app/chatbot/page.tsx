"use client";

// ================================================
// WHAT IS THIS FILE?
// This is the FULL PAGE chatbot that opens
// when you click "AI Chatbot" in the sidebar!
//
// It has:
// - Bot info at the top (version, status, model)
// - Full chat window in the middle
// - Input at the bottom
// ================================================

import { useState, useRef, useEffect } from "react";

const SUGGESTIONS = [
  "Show critical threats",
  "Any confirmed exploits?",
  "Latest CVE threats",
  "Which components are affected?",
  "Show threats by severity",
  "Any ECU vulnerabilities?",
];

type Message = {
  role: "user" | "bot";
  content: string;
};

export default function ChatbotPage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "bot", content: "Welcome to BorgWarner Help Chatbot. I can assist you with threat intelligence, CVEs, and security vulnerabilities across BorgWarner systems. How can I help you today?" },
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
    <div className="min-h-screen bg-[#06081a] flex flex-col">

      {/* ── TOP INFO BAR ── */}
      <div className="border-b border-white/[0.04] px-6 py-4">
        <div className="flex items-center justify-between">

          {/* Left — Bot Info */}
          <div className="flex items-center gap-4">
            <div style={{
              width: "44px", height: "44px", borderRadius: "12px",
              background: "linear-gradient(135deg, #7c3aed, #a78bfa)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "20px"
            }}>🤖</div>
            <div>
              <h1 className="text-white font-semibold text-[15px]">BorgWarner Help Chatbot</h1>
              <p className="text-gray-500 text-[11px] mt-0.5">AI-powered threat intelligence assistant</p>
            </div>
          </div>

          {/* Right — Status badges */}
          <div className="flex items-center gap-3">
            {/* Online status */}
            <div style={{
              display: "flex", alignItems: "center", gap: "6px",
              padding: "4px 10px", borderRadius: "20px",
              backgroundColor: "rgba(16,185,129,0.1)",
              border: "1px solid rgba(16,185,129,0.2)"
            }}>
              <div style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#10b981" }} />
              <span style={{ color: "#10b981", fontSize: "11px", fontWeight: "500" }}>Online</span>
            </div>

            {/* Model badge */}
            <div style={{
              padding: "4px 10px", borderRadius: "20px",
              backgroundColor: "rgba(124,58,237,0.1)",
              border: "1px solid rgba(124,58,237,0.2)"
            }}>
              <span style={{ color: "#a78bfa", fontSize: "11px", fontWeight: "500" }}>Llama 3.2 · Local</span>
            </div>

            {/* RAG badge */}
            <div style={{
              padding: "4px 10px", borderRadius: "20px",
              backgroundColor: "rgba(59,130,246,0.1)",
              border: "1px solid rgba(59,130,246,0.2)"
            }}>
              <span style={{ color: "#60a5fa", fontSize: "11px", fontWeight: "500" }}>RAG · ChromaDB</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── CHAT AREA ── */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} style={{
            display: "flex",
            justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
          }}>
            {/* Bot avatar */}
            {msg.role === "bot" && (
              <div style={{
                width: "28px", height: "28px", borderRadius: "8px",
                background: "linear-gradient(135deg, #7c3aed, #a78bfa)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "12px", marginRight: "8px", flexShrink: 0,
                alignSelf: "flex-end"
              }}>🤖</div>
            )}

            <div style={{
              maxWidth: "65%",
              padding: "10px 14px",
              borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
              background: msg.role === "user"
                ? "linear-gradient(135deg, #7c3aed, #a78bfa)"
                : "rgba(255,255,255,0.04)",
              border: msg.role === "user"
                ? "none"
                : "1px solid rgba(255,255,255,0.06)",
              color: "white",
              fontSize: "13px",
              lineHeight: "1.6",
            }}>
              {msg.content}
            </div>
          </div>
        ))}

        {/* Typing animation */}
        {isTyping && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{
              width: "28px", height: "28px", borderRadius: "8px",
              background: "linear-gradient(135deg, #7c3aed, #a78bfa)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "12px"
            }}>🤖</div>
            <div style={{
              display: "flex", gap: "4px", padding: "10px 14px",
              backgroundColor: "rgba(124,58,237,0.1)",
              border: "1px solid rgba(124,58,237,0.15)",
              borderRadius: "16px 16px 16px 4px",
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
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── SUGGESTIONS ── */}
      <div className="px-6 py-2 flex gap-2 flex-wrap border-t border-white/[0.04]">
        {SUGGESTIONS.map((s, i) => (
          <button key={i} onClick={() => sendMessage(s)} style={{
            fontSize: "11px", padding: "5px 10px",
            backgroundColor: "rgba(124,58,237,0.1)",
            color: "#a78bfa",
            border: "1px solid rgba(124,58,237,0.2)",
            borderRadius: "12px", cursor: "pointer",
          }}>{s}</button>
        ))}
      </div>

      {/* ── INPUT AREA ── */}
      <div className="px-6 py-4 border-t border-white/[0.04]">
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && sendMessage(input)}
            placeholder="Ask about threats, CVEs, exploits..."
            style={{
              flex: 1, padding: "10px 16px", borderRadius: "24px",
              border: "1px solid rgba(124,58,237,0.2)",
              backgroundColor: "rgba(124,58,237,0.05)",
              color: "white", fontSize: "13px", outline: "none",
            }}
          />
          <button onClick={() => sendMessage(input)} style={{
            width: "40px", height: "40px", borderRadius: "50%",
            background: "linear-gradient(135deg, #7c3aed, #a78bfa)",
            border: "none", color: "white", cursor: "pointer", fontSize: "16px",
            flexShrink: 0,
          }}>➤</button>
        </div>
        <p style={{ color: "#374151", fontSize: "10px", textAlign: "center", marginTop: "8px" }}>
          BorgWarner Help Chatbot · Responses based on BorgWarner threat intelligence database
        </p>
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