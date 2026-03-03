"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body style={{ background: "#08080f", color: "#e8e8f0", fontFamily: "monospace", padding: 40 }}>
        <h2 style={{ color: "#f43f5e", marginBottom: 16 }}>Client Error</h2>
        <pre style={{ background: "#0f0f1c", padding: 16, borderRadius: 8, fontSize: 12, overflowX: "auto", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
          {error?.message}
          {"\n\n"}
          {error?.stack}
        </pre>
        {error?.digest && (
          <p style={{ color: "#5a5a78", fontSize: 12, marginTop: 8 }}>digest: {error.digest}</p>
        )}
        <button
          onClick={reset}
          style={{ marginTop: 20, padding: "8px 16px", background: "#4f8ef7", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" }}
        >
          다시 시도
        </button>
      </body>
    </html>
  );
}
