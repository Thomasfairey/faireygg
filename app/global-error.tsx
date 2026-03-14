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
      <body
        style={{
          background: "#030014",
          color: "#ededed",
          fontFamily: "monospace",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          margin: 0,
          padding: "2rem",
        }}
      >
        <div style={{ textAlign: "center", maxWidth: 400 }}>
          <h2 style={{ color: "#ff3355", marginBottom: "1rem" }}>Something went wrong</h2>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, marginBottom: "1.5rem" }}>
            {error.message}
          </p>
          <button
            onClick={reset}
            style={{
              background: "rgba(0,240,255,0.1)",
              border: "1px solid rgba(0,240,255,0.3)",
              color: "#00f0ff",
              padding: "0.75rem 1.5rem",
              borderRadius: 12,
              fontFamily: "monospace",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
