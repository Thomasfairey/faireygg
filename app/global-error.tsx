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
      <body style={{ background: "#030014", color: "#ededed", fontFamily: "monospace" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", gap: "1.5rem", padding: "2rem" }}>
          <div style={{ fontSize: "3rem" }}>⚠️</div>
          <div style={{ fontWeight: "bold", fontSize: "1.1rem" }}>Critical Error</div>
          <div style={{ fontSize: "0.75rem", opacity: 0.4, textAlign: "center" }}>
            Neural Pulse encountered an unrecoverable error.
          </div>
          <button
            onClick={reset}
            style={{
              padding: "0.75rem 1.5rem", borderRadius: "0.75rem", fontWeight: "bold", fontSize: "0.85rem",
              textTransform: "uppercase", letterSpacing: "0.1em", cursor: "pointer",
              background: "rgba(0, 240, 255, 0.1)", border: "1px solid rgba(0, 240, 255, 0.3)",
              color: "#00f0ff",
            }}
          >
            Restart
          </button>
        </div>
      </body>
    </html>
  );
}
