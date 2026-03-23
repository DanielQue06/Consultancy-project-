"use client"; // This tells Next.js this file runs in the BROWSER (not the server)

// ================================================
// WHAT IS THIS FILE?
// This is the little CHAT BUBBLE BUTTON 💬
// that you see at the bottom right corner
// of the dashboard!

//
// When you CLICK it → the chat window opens
// When you CLICK it again → the chat window closes
// ================================================

import { useState } from "react";
import ChatWindow from "./ChatWindow";

export default function ChatWidget() {

    // "isOpen" is like a light switch!
    // false = chat window is CLOSED (light off)
    // true  = chat window is OPEN  (light on)
    const [isOpen, setIsOpen] = useState(false);

    return (
        // This div is FIXED to the bottom right corner
        // No matter how much you scroll, it stays there!
        <div style={{position: "fixed", bottom: "24px", right: "24px", zIndex: 1000}}>

            {/* If isOpen is TRUE, show the chat window */}
            {/* If isOpen is FALSE, hide the chat window */}
            {isOpen && <ChatWindow onClose={() => setIsOpen(false)}/>}

            {/* This is the round blue button 💬 */}
            <button
                onClick={() => setIsOpen(!isOpen)} // flip the switch on/off when clicked!
                style={{
                    width: "56px",
                    height: "56px",
                    borderRadius: "50%",        // makes it a circle shape
                    backgroundColor: "#3B82F6", // blue color
                    border: "none",
                    cursor: "pointer",          // shows hand cursor when hovering
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.3)", // shadow under the button
                    fontSize: "24px",
                    marginTop: "12px",
                    marginLeft: "auto",
                }}
            >
                {/* Show ✕ when chat is open (so user can close it) */}
                {/* Show 💬 when chat is closed (so user can open it) */}
                {isOpen ? "✕" : "💬"}
            </button>
        </div>
    );
}