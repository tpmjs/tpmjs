export default function Home() {
  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
      <h1>TPMJS Executor</h1>
      <p>This is a TPMJS tool executor service.</p>
      <h2>Endpoints</h2>
      <ul>
        <li>
          <code>GET /api/health</code> - Health check
        </li>
        <li>
          <code>POST /api/execute-tool</code> - Execute a tool
        </li>
      </ul>
      <p>
        <a href="https://tpmjs.com/docs/executors">Documentation</a>
      </p>
    </div>
  );
}
