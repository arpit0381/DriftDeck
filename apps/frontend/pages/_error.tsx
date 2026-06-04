// Custom error page — no hooks, no context, pure static render
function Error({ statusCode }: { statusCode?: number }) {
  return (
    <div style={{
      minHeight: '100vh', background: '#06060c',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', fontFamily: 'monospace', color: '#475569', gap: 12,
    }}>
      <div style={{ fontSize: 56, fontWeight: 900, color: '#6366f1' }}>
        {statusCode ?? 'ERR'}
      </div>
      <div style={{ fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
        {statusCode === 404 ? 'Page not found' : statusCode === 500 ? 'Server error' : 'An error occurred'}
      </div>
      <a href="/" style={{ marginTop: 16, fontSize: 11, color: '#818cf8', textDecoration: 'none' }}>
        ← Return to Drift Deck
      </a>
    </div>
  );
}

Error.getInitialProps = ({ res, err }: any) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};

export default Error;
