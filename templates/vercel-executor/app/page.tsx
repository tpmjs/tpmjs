export default function Home() {
  return (
    <main style={{ fontFamily: 'system-ui', padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
      <h1>TPMJS Executor</h1>
      <p>This is a custom TPMJS tool executor using Vercel Sandbox.</p>

      <h2>Endpoints</h2>
      <ul>
        <li>
          <code>GET /api/health</code> - Health check
        </li>
        <li>
          <code>POST /api/execute-tool</code> - Execute a tool
        </li>
      </ul>

      <h2>Documentation</h2>
      <p>
        See the{' '}
        <a
          href="https://tpmjs.com/docs/tutorials/custom-executor"
          target="_blank"
          rel="noreferrer noopener"
        >
          Custom Executor Tutorial
        </a>{' '}
        for setup instructions.
      </p>
    </main>
  );
}
