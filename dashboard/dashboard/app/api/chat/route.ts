// ================================================
// WHAT IS THIS FILE?
// Think of this file like a WAITER in a restaurant
//
// 1. User asks a question in the chat
// 2. This file takes that question (like a waiter)
// 3. Goes to the kitchen (database) to get the data
// 4. Sends the data + question to Gemini AI
// 5. Gemini AI makes a nice answer
// 6. This file brings the answer back to the user
// ================================================

import { NextRequest, NextResponse } from "next/server";

// ================================================
// FAKE DATABASE (like a pretend kitchen for now!)
// When your teammate pushes the real database,
// you will replace this with real data
// ================================================
const dummyDatabase = {
  threats: [
    { id: 1, type: "Malware",       severity: "High",     date: "2024-03-01", status: "Active" },
    { id: 2, type: "Phishing",      severity: "Medium",   date: "2024-03-02", status: "Resolved" },
    { id: 3, type: "DDoS",          severity: "High",     date: "2024-03-03", status: "Active" },
    { id: 4, type: "Ransomware",    severity: "Critical", date: "2024-03-04", status: "Active" },
    { id: 5, type: "SQL Injection", severity: "Medium",   date: "2024-03-05", status: "Resolved" },
  ],
  stats: {
    totalThreats: 5,
    activeThreats: 3,
    resolvedThreats: 2,
    criticalThreats: 1,
    lastUpdated: "2024-03-05",
  },
};

// ================================================
// THIS FUNCTION PREPARES THE DATA FOR GEMINI AI
// It turns the database into readable text!
// ================================================
function getDatabaseContext() {
  const threats = dummyDatabase.threats
    .map(t => `- ${t.type} | Severity: ${t.severity} | Status: ${t.status} | Date: ${t.date}`)
    .join("\n");

  return `
    You are a cybersecurity assistant for a security dashboard.
    IMPORTANT RULES:
    - Only answer questions based on the data provided below
    - If the question is not related to the data, say "I can only answer questions about the dashboard data"
    - Be clear and helpful
    - Keep answers short and simple

    === DASHBOARD DATA ===
    
    THREAT STATISTICS:
    - Total Threats: ${dummyDatabase.stats.totalThreats}
    - Active Threats: ${dummyDatabase.stats.activeThreats}
    - Resolved Threats: ${dummyDatabase.stats.resolvedThreats}
    - Critical Threats: ${dummyDatabase.stats.criticalThreats}
    - Last Updated: ${dummyDatabase.stats.lastUpdated}

    THREAT LIST:
    ${threats}
  `;
}

// ================================================
// THIS IS THE MAIN FUNCTION
// It runs every time the user sends a message!
// ================================================
export async function POST(req: NextRequest) {
  try {
    // Step 1: Get the message the user sent
    const { message, history } = await req.json();

    // Step 2: Get the Gemini API key from .env.local
    const apiKey = process.env.GEMINI_API_KEY;

    // If key is missing, stop and show error
    if (!apiKey) {
      console.log("❌ API KEY IS MISSING!");
      return NextResponse.json({ reply: "API key is missing!" }, { status: 500 });
    }

    console.log("✅ API key found! Calling Gemini...");

    // Step 3: Build conversation history
    const conversationHistory = history?.map((msg: { role: string; content: string }) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
    })) || [];

    // Step 4: Add the new user message
    conversationHistory.push({
      role: "user",
      parts: [{ text: message }],
    });

    // Step 5: Call Gemini AI
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: getDatabaseContext() }],
          },
          contents: conversationHistory,
        }),
      }
    );

    // Step 6: Read Gemini's reply
    const data = await response.json();

    // Print EVERYTHING so we can see what Gemini says in terminal
    console.log("Gemini response:", JSON.stringify(data, null, 2));

    // Get the actual text from Gemini's response
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text
      || data.error?.message
      || "Sorry, I could not get a response.";

    // Step 7: Send reply back to chatbot
    return NextResponse.json({ reply });

  } catch (error) {
    console.error("❌ Chatbot error:", error);
    return NextResponse.json({ reply: "Something went wrong!" }, { status: 500 });
  }
}