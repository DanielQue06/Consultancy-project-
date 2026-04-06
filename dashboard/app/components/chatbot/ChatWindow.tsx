"use client"; // This file runs in the BROWSER

// ================================================
// WHAT IS THIS FILE?
// This is the actual CHAT BOX that pops up
// when you click the 💬 button!
//
// It has:
// - A header (title at the top)
// - A messages area (where chat bubbles appear)
// - Typing animation (3 bouncing dots while AI thinks)
// - Quick suggestion buttons (shortcuts for common questions)
// - An input box (where user types their message)
// ================================================

import { useState, useRef, useEffect } from "react";
import ChatMessage from "./ChatMessage";

// These are the quick shortcut buttons
// User can click these instead of typing!
const SUGGESTIONS = [
  "How many active threats?",
  "Show critical threats",
  "Latest threat detected",
  "Total resolved threats",
];

// This tells TypeScript what a "message" looks like
// Every message has a role (who sent it) and content (what they said)
type Message = {
  role: "user" | "bot"; // either the user sent it OR the bot sent it
  content: string;      // the actual text of the message
};

// "onClose" is a function passed from ChatWidget
// When called, it closes this chat window
export default function ChatWindow({ onClose }: { onClose: () => void }) {

  // "messages" is the list of ALL chat messages so far
  // We start with one welcome message from the bot!
  const [messages, setMessages] = useState<Message[]>([
    { role: "bot", content: "Hi! 👋 I'm your cybersecurity assistant. Ask me anything about the dashboard data!" },
  ]);

  // "input" is whatever the user is currently typing
  const [input, setInput] = useState("");

  // "isTyping" controls the bouncing dots animation
  // true  = show the dots (bot is thinking)
  // false = hide the dots (bot finished replying)
  const [isTyping, setIsTyping] = useState(false);

  // "bottomRef" is an invisible marker at the bottom of the chat
  // We use it to automatically scroll down when new messages arrive
  const bottomRef = useRef<HTMLDivElement>(null);

  // This runs every time a new message is added
  // It scrolls the chat to the bottom automatically!
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);


  // ================================================
  // THIS FUNCTION RUNS WHEN USER SENDS A MESSAGE
  // It does 4 things:
  // 1. Adds user message to the chat
  // 2. Shows the typing animation (dots)
  // 3. Sends message to our API (route.ts)
  // 4. Shows bot reply and hides the dots
  // ================================================
  async function sendMessage(text: string) {

    // Don't send empty messages!
    if (!text.trim()) return;

    // Step 1: Add the user's message to the chat right away
    const userMessage: Message = { role: "user", content: text };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput(""); // clear the input box

    // Step 2: Show the bouncing dots (bot is thinking...)
    setIsTyping(true);

    try {
      // Step 3: Send the message to our waiter (route.ts)
      // route.ts will talk to Gemini AI and the database
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text, // the question the user just asked
          // We also send ALL previous messages so Gemini
          // remembers the full conversation!
          history: updatedMessages.map(m => ({
            role: m.role === "user" ? "user" : "assistant",
            content: m.content,
          })),
        }),
      });

      // Step 4: Get the reply from Gemini and add it to the chat
      const data = await response.json();
      setMessages(prev => [...prev, { role: "bot", content: data.reply }]);

    } catch {
      // If something goes wrong, show an error message in the chat
      setMessages(prev => [...prev, { role: "bot", content: "Sorry, something went wrong!" }]);

    } finally {
      // Always hide the typing dots when done
      // (whether it worked or failed!)
      setIsTyping(false);
    }
  }

  // ================================================
  // WHAT THE USER ACTUALLY SEES ON SCREEN
  // ================================================
  return (
    // The main chat box container
    <div style={{
      width: "340px",
      height: "480px",
      backgroundColor: "#1e1e2e", // dark background
      borderRadius: "16px",
      display: "flex",
      flexDirection: "column",   // stack things top to bottom
      boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
      overflow: "hidden",
      border: "1px solid #2e2e3e",
    }}>

      {/* ── TOP HEADER BAR ── */}
      {/* The blue bar at the top with the title and close button */}
      <div style={{
        backgroundColor: "#3B82F6",
        padding: "12px 16px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <div>
          {/* Title */}
          <div style={{ color: "white", fontWeight: "bold", fontSize: "14px" }}>🛡️ Security Assistant</div>
          {/* Subtitle */}
          <div style={{ color: "#bfdbfe", fontSize: "11px" }}>Powered by Gemini AI</div>
        </div>
        {/* Close button — calls onClose when clicked */}
        <button onClick={onClose} style={{
          background: "none", border: "none", color: "white",
          cursor: "pointer", fontSize: "18px",
        }}>✕</button>
      </div>

      {/* ── MESSAGES AREA ── */}
      {/* This is where all the chat bubbles appear */}
      {/* overflow: auto means it scrolls when there are too many messages */}
      <div style={{
        flex: 1, overflowY: "auto", padding: "12px",
        display: "flex", flexDirection: "column", gap: "8px",
      }}>
        {/* Loop through ALL messages and show each one */}
        {messages.map((msg, i) => (
          <ChatMessage key={i} role={msg.role} content={msg.content} />
        ))}

        {/* TYPING ANIMATION — only shows when isTyping is true */}
        {/* These are the 3 bouncing dots that mean "bot is thinking" */}
        {isTyping && (
          <div style={{
            display: "flex", gap: "4px", padding: "8px 12px",
            backgroundColor: "#2e2e3e", borderRadius: "12px", width: "fit-content"
          }}>
            {/* Make 3 dots using a loop */}
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                width: "7px", height: "7px", borderRadius: "50%",
                backgroundColor: "#3B82F6",
                animation: "bounce 1s infinite",
                animationDelay: `${i * 0.2}s`, // each dot bounces a little later
              }} />
            ))}
          </div>
        )}

        {/* Invisible marker at the bottom for auto-scrolling */}
        <div ref={bottomRef} />
      </div>

      {/* ── QUICK SUGGESTION BUTTONS ── */}
      {/* These are the small shortcut buttons above the input */}
      <div style={{
        padding: "6px 12px", display: "flex",
        gap: "6px", flexWrap: "wrap",
        borderTop: "1px solid #2e2e3e",
      }}>
        {/* Loop through SUGGESTIONS list and make a button for each one */}
        {SUGGESTIONS.map((s, i) => (
          <button
            key={i}
            onClick={() => sendMessage(s)} // clicking sends that question directly!
            style={{
              fontSize: "10px", padding: "4px 8px",
              backgroundColor: "#2e2e3e", color: "#93c5fd",
              border: "1px solid #3B82F6", borderRadius: "12px",
              cursor: "pointer",
            }}
          >{s}</button>
        ))}
      </div>

      {/* ── INPUT AREA ── */}
      {/* Where the user types their message */}
      <div style={{
        padding: "10px 12px", display: "flex", gap: "8px",
        borderTop: "1px solid #2e2e3e",
      }}>
        {/* The text input box */}
        <input
          value={input}                              // shows what user typed
          onChange={e => setInput(e.target.value)}   // updates as user types
          onKeyDown={e => e.key === "Enter" && sendMessage(input)} // send on Enter key
          placeholder="Ask about threats..."
          style={{
            flex: 1, padding: "8px 12px", borderRadius: "20px",
            border: "1px solid #3e3e4e", backgroundColor: "#2e2e3e",
            color: "white", fontSize: "13px", outline: "none",
          }}
        />
        {/* The send button ➤ */}
        <button onClick={() => sendMessage(input)} style={{
          width: "36px", height: "36px", borderRadius: "50%",
          backgroundColor: "#3B82F6", border: "none",
          color: "white", cursor: "pointer", fontSize: "16px",
        }}>➤</button>
      </div>

      {/* The CSS animation for the bouncing typing dots */}
      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }    /* start and end at normal position */
          50%       { transform: translateY(-4px); } /* go up in the middle */
        }
      `}</style>
    </div>
  );
}