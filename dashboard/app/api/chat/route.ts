// ================================================
// WHAT IS THIS FILE?
// This connects our Next.js chatbot UI
// to the Python backend (app.py)
//
// app.py runs on port 8080
// Next.js runs on port 3000
//
// Flow:
// User types message
//      ↓
// This file sends it to app.py on port 8080
//      ↓
// app.py searches ChromaDB
//      ↓
// app.py asks Ollama (Llama 3.2)
//      ↓
// Answer comes back here
//      ↓
// We show it in the chatbot!
// ================================================

import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {

    // Step 1: Get the message and history from the frontend
    const { message, history } = await req.json();
    console.log("📨 Received message:", message);

    // Step 2: Send to Python backend (app.py)
    // app.py is running on port 8080
    // /chat is the endpoint that handles messages
    const response = await fetch("http://localhost:8080/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: message,
        // Send last 4 messages as history
        // so ARIA remembers the conversation!
        history: history?.slice(-4).map((m: { role: string; content: string }) => ({
          role: m.role === "bot" ? "assistant" : "user",
          content: m.content,
        })) || [],
      }),
    });

    // Step 3: Check if backend responded
    if (!response.ok) {
      console.error("❌ Backend error:", response.status);
      return NextResponse.json({
        reply: "Sorry, the AI backend is not available. Make sure app.py is running!"
      });
    }

    // Step 4: Read the streaming response from app.py
    // app.py sends the answer word by word (streaming)
    // We collect all the words and join them together
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let fullReply = "";

    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        // Decode each chunk and add to full reply
        fullReply += decoder.decode(value, { stream: true });
      }
    }

    console.log("✅ Got reply from ARIA!");

    // Step 5: Send the complete answer back to the chatbot
    return NextResponse.json({ reply: fullReply || "Sorry, I could not get a response." });

  } catch (error) {
    // If app.py is not running, show helpful message
    console.error("❌ Error:", error);
    return NextResponse.json({
      reply: "Cannot connect to AI backend. Please make sure app.py is running on port 8080!"
    });
  }
}