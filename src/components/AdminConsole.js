import React, { useState, useEffect } from 'react';

function AdminConsole({ apiService, sessionManager }) {
  const [metrics, setMetrics] = useState({
    cpuUsage: 45,
    memoryUsage: 62,
    activeSessions: 0,
    cacheHitRate: 0,
    averageLatency: 1200
  });

  const [cacheTTL, setCacheTTL] = useState(3600);
  const [cacheMaxSize, setCacheMaxSize] = useState(500);
  const [modelName, setModelName] = useState('tinyllama-1.1b');
  const [logs, setLogs] = useState([]);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    updateMetrics();
    loadLogs();

    if (autoRefresh) {
      const interval = setInterval(() => {
        updateMetrics();
      }, 5000);
      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRefresh]);

  const updateMetrics = () => {
    // Simulate real-time metrics from backend
    const sessions = sessionManager.getAllSessions();
    const activeSessions = sessions.length;
    
    setMetrics({
      cpuUsage: Math.random() * 80,
      memoryUsage: 40 + Math.random() * 40,
      activeSessions: activeSessions,
      cacheHitRate: Math.random() * 100,
      averageLatency: 800 + Math.random() * 800
    });

    // Add log entry
    const newLog = {
      timestamp: new Date().toLocaleTimeString(),
      level: 'INFO',
      message: `Metrics updated - Active sessions: ${activeSessions}`
    };
    setLogs(prev => [newLog, ...prev].slice(0, 100));
  };

  const loadLogs = () => {
    // Simulate loading system logs
    const systemLogs = [
      { timestamp: '12:34:56', level: 'INFO', message: 'System initialized' },
      { timestamp: '12:35:10', level: 'INFO', message: 'Model loaded successfully' },
      { timestamp: '12:35:45', level: 'DEBUG', message: 'Cache initialized with TTL=3600' },
      { timestamp: '12:36:20', level: 'INFO', message: 'API server started on port 5000' },
      { timestamp: '12:37:05', level: 'INFO', message: 'First user connected' }
    ];
    setLogs(systemLogs);
  };

  const handleSaveCacheConfig = () => {
    apiService.updateCacheConfig({ ttl: cacheTTL, maxSize: cacheMaxSize });
    setLogs(prev => [{
      timestamp: new Date().toLocaleTimeString(),
      level: 'INFO',
      message: `Cache configuration updated - TTL: ${cacheTTL}s, MaxSize: ${cacheMaxSize}MB`
    }, ...prev].slice(0, 100));
  };

  const handleReloadModel = () => {
    setLogs(prev => [{
      timestamp: new Date().toLocaleTimeString(),
      level: 'INFO',
      message: `Model reloading: ${modelName}`
    }, ...prev].slice(0, 100));
  };

  const handleClearCache = () => {
    apiService.clearCache();
    setLogs(prev => [{
      timestamp: new Date().toLocaleTimeString(),
      level: 'INFO',
      message: 'Cache cleared'
    }, ...prev].slice(0, 100));
  };

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1 className="admin-title">⚙️ Admin Console</h1>
        <button 
          className={autoRefresh ? 'btn-primary' : 'btn-secondary'}
          onClick={() => setAutoRefresh(!autoRefresh)}
        >
          {autoRefresh ? '🔄 Auto-refresh ON' : '⏸ Auto-refresh OFF'}
        </button>
      </div>

      {/* Metrics Section */}
      <div className="admin-section">
        <h2 className="section-title">📊 System Metrics</h2>
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-label">CPU Usage</div>
            <div className="metric-value">{metrics.cpuUsage.toFixed(1)}<span className="metric-unit">%</span></div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Memory Usage</div>
            <div className="metric-value">{metrics.memoryUsage.toFixed(1)}<span className="metric-unit">%</span></div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Active Sessions</div>
            <div className="metric-value">{metrics.activeSessions}</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Cache Hit Rate</div>
            <div className="metric-value">{metrics.cacheHitRate.toFixed(1)}<span className="metric-unit">%</span></div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Avg Latency</div>
            <div className="metric-value">{metrics.averageLatency.toFixed(0)}<span className="metric-unit">ms</span></div>
          </div>
        </div>
      </div>

      {/* Cache Configuration */}
      <div className="admin-section">
        <h2 className="section-title">💾 Cache Configuration</h2>
        <div className="config-form">
          <div className="form-group">
            <label>Cache TTL (Time-To-Live in seconds)</label>
            <input
              type="number"
              value={cacheTTL}
              onChange={(e) => setCacheTTL(parseInt(e.target.value))}
              min="60"
              max="86400"
            />
          </div>
          <div className="form-group">
            <label>Cache Max Size (MB)</label>
            <input
              type="number"
              value={cacheMaxSize}
              onChange={(e) => setCacheMaxSize(parseInt(e.target.value))}
              min="100"
              max="2000"
            />
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="btn-primary" onClick={handleSaveCacheConfig}>
              💾 Save Configuration
            </button>
            <button className="btn-danger" onClick={handleClearCache}>
              🗑️ Clear Cache
            </button>
          </div>
        </div>
      </div>

      {/* Model Management */}
      <div className="admin-section">
        <h2 className="section-title">🤖 Model Management</h2>
        <div className="config-form">
          <div className="form-group">
            <label>Current Model</label>
            <select value={modelName} onChange={(e) => setModelName(e.target.value)}>
              <option value="tinyllama-1.1b">TinyLLaMA 1.1B (Quantized)</option>
              <option value="phi-2">Phi-2 2.7B (Quantized)</option>
              <option value="mistral-7b-mini">Mistral 7B Mini (Quantized)</option>
            </select>
          </div>
          <button className="btn-primary" onClick={handleReloadModel}>
            🔄 Reload Model
          </button>
        </div>
      </div>

      {/* System Logs */}
      <div className="admin-section">
        <h2 className="section-title">📝 System Logs</h2>
        <div className="log-viewer">
          {logs.length === 0 ? (
            <div className="log-entry">No logs available</div>
          ) : (
            logs.map((log, idx) => (
              <div key={idx} className="log-entry">
                <span className="log-timestamp">[{log.timestamp}]</span>
                {' '}
                <span style={{ color: log.level === 'ERROR' ? '#ff6b6b' : '#00ff00' }}>
                  [{log.level}]
                </span>
                {' '}
                {log.message}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Health Status */}
      <div className="admin-section">
        <h2 className="section-title">💚 Health Status</h2>
        <div className="config-form">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div>
              <strong>API Server:</strong>
              <div style={{ color: '#90ee90' }}>✓ Running</div>
            </div>
            <div>
              <strong>Model:</strong>
              <div style={{ color: '#90ee90' }}>✓ Loaded</div>
            </div>
            <div>
              <strong>Cache:</strong>
              <div style={{ color: '#90ee90' }}>✓ Active</div>
            </div>
            <div>
              <strong>Database:</strong>
              <div style={{ color: '#90ee90' }}>✓ Connected</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminConsole;
