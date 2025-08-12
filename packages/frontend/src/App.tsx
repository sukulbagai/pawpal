import { useState, useEffect } from 'react';
import axios from 'axios';
import { env } from './lib/env';
import './App.css';

interface HealthStatus {
  ok: boolean;
  service: string;
}

function App() {
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        setLoading(true);
        const response = await axios.get<HealthStatus>(`${env.API_BASE}/health`);
        setHealthStatus(response.data);
        setHealthError(null);
      } catch (error) {
        setHealthError(error instanceof Error ? error.message : 'Unknown error');
        setHealthStatus(null);
      } finally {
        setLoading(false);
      }
    };

    checkHealth();
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <h1>🐕 PawPal</h1>
        <p>Connecting street dogs with loving homes</p>
      </header>

      <main className="app-main">
        <div className="status-card">
          <h2>Frontend Status</h2>
          <div className="status-badge success">✅ Frontend running</div>
          <p>Environment: {import.meta.env.MODE}</p>
          <p>API Base: {env.API_BASE}</p>
        </div>

        <div className="status-card">
          <h2>Backend API Status</h2>
          {loading ? (
            <div className="status-badge loading">🔄 Checking...</div>
          ) : healthStatus ? (
            <div className="status-badge success">
              ✅ {healthStatus.service} - OK
            </div>
          ) : (
            <div className="status-badge error">
              ❌ API Error: {healthError}
            </div>
          )}
        </div>

        <div className="info-card">
          <h3>Development Info</h3>
          <ul>
            <li>Frontend: React + Vite + TypeScript</li>
            <li>Backend: Express + TypeScript</li>
            <li>Database: Supabase (PostgreSQL)</li>
            <li>Package Manager: pnpm workspaces</li>
          </ul>
        </div>
      </main>

      <footer className="app-footer">
        <p>PawPal MVP - Built with ❤️ for street dogs</p>
      </footer>
    </div>
  );
}

export default App;
