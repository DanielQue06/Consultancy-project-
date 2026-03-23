// ================================================
// WHAT IS THIS FILE?
// This file styles ONE single message bubble
//
// If the USER sent it → bubble appears on the RIGHT (blue)
// If the BOT sent it  → bubble appears on the LEFT  (dark)
//
// Like WhatsApp! Your messages are on one side,
// the other person's messages are on the other side!
// ================================================

// "Props" tells TypeScript what information this file needs
// It needs to know:
// 1. WHO sent the message (user or bot)
// 2. WHAT the message says
type Props = {
  role: "user" | "bot";
  content: string;
};

export default function ChatMessage({ role, content }: Props) {

  // Simple check: is this message from the user?
  // true  = user sent it (show on RIGHT, blue bubble)
  // false = bot sent it  (show on LEFT, dark bubble)
  const isUser = role === "user";

  return (
    // This div controls LEFT or RIGHT alignment
    <div style={{
      display: "flex",
      justifyContent: isUser ? "flex-end" : "flex-start",
      // flex-end   = push to the RIGHT side (user messages)
      // flex-start = push to the LEFT side  (bot messages)
    }}>

      {/* The actual message bubble */}
      <div style={{
        maxWidth: "75%",   // bubble can't be wider than 75% of the chat

        padding: "8px 12px",

        // Different corner shapes for user vs bot
        // User bubble: pointy bottom-right corner (like WhatsApp sent messages)
        // Bot bubble:  pointy bottom-left corner  (like WhatsApp received messages)
        borderRadius: isUser ? "16px 16px 4px 16px" : "16px 16px 16px 4px",

        // User = blue background, Bot = dark grey background
        backgroundColor: isUser ? "#3B82F6" : "#2e2e3e",

        color: "white",       // white text on both
        fontSize: "13px",
        lineHeight: "1.5",    // space between lines of text
      }}>
        {/* The actual text of the message */}
        {content}
      </div>
    </div>
  );
}