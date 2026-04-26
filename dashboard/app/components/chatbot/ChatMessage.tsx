// ================================================
// Message bubbles styled to match dashboard theme
// User = purple gradient (matches dashboard accent)
// Bot = dark navy (matches dashboard background)
// ================================================

type Props = {
  role: "user" | "bot";
  content: string;
};

export default function ChatMessage({ role, content }: Props) {
  const isUser = role === "user";

  return (
    <div style={{
      display: "flex",
      justifyContent: isUser ? "flex-end" : "flex-start",
    }}>
      <div style={{
        maxWidth: "80%",
        padding: "8px 12px",
        borderRadius: isUser ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
        // User = purple gradient like dashboard buttons
        // Bot = dark card like dashboard panels
        background: isUser
          ? "linear-gradient(135deg, #7c3aed, #a78bfa)"
          : "rgba(255,255,255,0.04)",
        border: isUser
          ? "none"
          : "1px solid rgba(255,255,255,0.06)",
        color: "white",
        fontSize: "12px",
        lineHeight: "1.6",
      }}>
        {content}
      </div>
    </div>
  );
}