/**
 * Custom error page to override Next.js built-in _error
 * which fails to prerender with React 19 + Next 15.
 */
export default function Error({ statusCode }: { statusCode?: number }) {
  return (
    <div style={{
      minHeight: "100vh",
      background: "#06060c",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "column",
      fontFamily: "monospace",
      color: "#64748b"
    }}>
      <div style={{ fontSize: 64, fontWeight: 900, color: "#6366f1" }}>
        {statusCode ?? "ERR"}
      </div>
      <p style={{ marginTop: 8, fontSize: 12 }}>
        {statusCode === 404 ? "PAGE NOT FOUND" : "AN ERROR OCCURRED"}
      </p>
      <a href="/" style={{ marginTop: 24, fontSize: 11, color: "#818cf8" }}>
        ← Return to Drift Deck
      </a>
    </div>
  );
}

Error.getInitialProps = ({ res, err }: any) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};
