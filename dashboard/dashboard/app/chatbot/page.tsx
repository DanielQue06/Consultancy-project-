'use client';
import ChatWindow from '../components/chatbot/ChatWindow';

export default function ChatbotPage() {
  return (
    <div className="p-6 min-h-screen" style={{ background: '#0B0E14' }}>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div
          className="flex items-center justify-center w-12 h-12 rounded-xl"
          style={{
            background: 'linear-gradient(135deg, #3B82F622, #3B82F608)',
            border: '1px solid #3B82F630',
          }}
        >
          <span style={{ fontSize: '20px' }}>🛡️</span>
        </div>
        <div>
          <h1
            className="text-2xl font-bold tracking-tight"
            style={{ color: '#F0F0F0', fontFamily: "'Segoe UI', system-ui, sans-serif" }}
          >
            AI Threat Assistant
          </h1>
          <p className="text-sm mt-0.5" style={{ color: '#5a6785' }}>
            Ask questions about your dashboard threat data — powered by Gemini AI
          </p>
        </div>
      </div>

      {/* Full-size Chat Window */}
      <div
        className="rounded-xl overflow-hidden"
        style={{
          height: 'calc(100vh - 180px)',
          border: '1px solid #1e2338',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        }}
      >
        <ChatWindowFull />
      </div>
    </div>
  );
}

// Full-page version of ChatWindow (no close button, fills container)
function ChatWindowFull() {
  return (
    <div style={{ height: '100%' }}>
      <ChatWindowInner />
    </div>
  );
}

// Reuses ChatWindow logic but adapted for full page
import { useState, useRef, useEffect } from 'react';
import ChatMessage from '../components/chatbot/ChatMessage';

const SUGGESTIONS = [
  "How many active threats?",
  "Show critical threats",
  "Latest threat detected",
  "Total resolved threats",
  "What are the high severity CVEs?",
  "Summarise the dashboard data",
];

type Message = {
  role: "user" | "bot";
  content: string;
};

function ChatWindowInner() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "bot",
      content:
        "Hi! 👋 I'm your cybersecurity assistant for the BorgWarner dashboard. Ask me anything about the current threat data — active threats, severity breakdowns, specific CVEs, and more.",
    },
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
          history: updatedMessages.map((m) => ({
            role: m.role === "user" ? "user" : "assistant",
            content: m.content,
          })),
        }),
      });

      const data = await response.json();
      setMessages((prev) => [...prev, { role: "bot", content: data.reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "bot", content: "Sorry, something went wrong. Please try again." },
      ]);
    } finally {
      setIsTyping(false);
    }
  }

  return (
    <div
      style={{
        height: "100%",
        backgroundColor: "#0d1017",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header Bar */}
      <div
        style={{
          background: "linear-gradient(135deg, #1a1a2e, #16213e)",
          padding: "16px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid #2a2a4e",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              backgroundColor: "#4ecdc4",
              boxShadow: "0 0 8px #4ecdc4",
            }}
          />
          <div>
            <div style={{ color: "white", fontWeight: "bold", fontSize: "15px" }}>
              🛡️ Security Assistant
            </div>
            <div style={{ color: "#5a6785", fontSize: "12px" }}>
              Powered by Gemini AI &middot; Connected to threat database
            </div>
          </div>
        </div>
        <div
          style={{
            padding: "4px 10px",
            borderRadius: "12px",
            backgroundColor: "#4ecdc420",
            border: "1px solid #4ecdc430",
            color: "#4ecdc4",
            fontSize: "11px",
            fontWeight: "bold",
          }}
        >
          ONLINE
        </div>
      </div>

      {/* Messages Area */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "20px 24px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        {messages.map((msg, i) => (
          <ChatMessage key={i} role={msg.role} content={msg.content} />
        ))}

        {isTyping && (
          <div
            style={{
              display: "flex",
              gap: "5px",
              padding: "10px 14px",
              backgroundColor: "#1a1a2e",
              borderRadius: "16px",
              width: "fit-content",
              border: "1px solid #2a2a4e",
            }}
          >
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  backgroundColor: "#e94560",
                  animation: "bounce 1s infinite",
                  animationDelay: `${i * 0.2}s`,
                }}
              />
            ))}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggestion Chips */}
      {messages.length <= 2 && (
        <div
          style={{
            padding: "8px 24px 4px",
            display: "flex",
            gap: "8px",
            flexWrap: "wrap",
            borderTop: "1px solid #1e2338",
          }}
        >
          {SUGGESTIONS.map((s, i) => (
            <button
              key={i}
              onClick={() => sendMessage(s)}
              style={{
                fontSize: "12px",
                padding: "6px 14px",
                backgroundColor: "#1a1a2e",
                color: "#8892b0",
                border: "1px solid #2a2a4e",
                borderRadius: "20px",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseOver={(e) => {
                (e.target as HTMLElement).style.borderColor = "#e94560";
                (e.target as HTMLElement).style.color = "#e94560";
              }}
              onMouseOut={(e) => {
                (e.target as HTMLElement).style.borderColor = "#2a2a4e";
                (e.target as HTMLElement).style.color = "#8892b0";
              }}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div
        style={{
          padding: "16px 24px",
          display: "flex",
          gap: "12px",
          borderTop: "1px solid #1e2338",
          background: "linear-gradient(135deg, #0d1017, #111520)",
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
          placeholder="Ask about threats, CVEs, severity levels..."
          style={{
            flex: 1,
            padding: "12px 18px",
            borderRadius: "24px",
            border: "1px solid #2a2a4e",
            backgroundColor: "#1a1a2e",
            color: "white",
            fontSize: "14px",
            outline: "none",
          }}
        />
        <button
          onClick={() => sendMessage(input)}
          style={{
            width: "44px",
            height: "44px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #e94560, #c23152)",
            border: "none",
            color: "white",
            cursor: "pointer",
            fontSize: "18px",
            boxShadow: "0 4px 16px #e9456040",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          ➤
        </button>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
      `}</style>
    </div>
  );
}