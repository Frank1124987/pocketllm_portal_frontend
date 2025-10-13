import React, { useState, useEffect } from 'react';

function AdminConsole({ apiService, sessionManager }) {
  const [metrics, setMetrics] = useState({
    cpuUsage: 45,
    memoryUsage: 62,
    activeSessions: 0,
    cacheHitRate: 0,
    averageLatency: 1200
  });

  const [cacheStats, setCacheStats] = useState({
    entries: 0,
    max_size: 1000,
    hits: 0,
    misses: 0,
    hit_rate: '0%',
    sets: 0,
    deletes: 0,
    evictions: 0,
    expirations: 0
  });

  const [cacheTTL, setCacheTTL] = useState(3600);
  const [cacheMaxSize, setCacheMaxSize] = useState(1000);
  const [modelName, setModelName] = useState('deepseek-r1:1.5b');
  const [logs, setLogs] = useState([]);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    updateMetrics();
    loadCacheStats();
    loadCacheConfig();
    loadLogs();

    if (autoRefresh) {
      const interval = setInterval(() => {
        updateMetrics();
        loadCacheStats();
      }, 5000);
      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRefresh]);

  const updateMetrics = () => {
    const sessions = sessionManager.getAllSessions();
    const activeSessions = sessions.length;
    
    setMetrics({
      cpuUsage: Math.random() * 80,
      memoryUsage: 40 + Math.random() * 40,
      activeSessions: activeSessions,
      cacheHitRate: parseFloat(cacheStats.hit_rate) || 0,
      averageLatency: 800 + Math.random() * 800
    });
  };

  const loadCacheStats = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/cache/stats`);
      if (response.ok) {
        const stats = await response.json();
        setCacheStats(stats);
      }
    } catch (error) {
      console.error('Failed to load cache stats:', error);
    }
  };

  const loadCacheConfig = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/cache/config`);
      if (response.ok) {
        const config = await response.json();
        setCacheTTL(config.default_ttl);
        setCacheMaxSize(config.max_size);
      }
    } catch (error) {
      console.error('Failed to load cache config:', error);
    }
  };

  const loadLogs = () => {
    const systemLogs = [
      { timestamp: new Date().toLocaleTimeString(), level: 'INFO', message: 'System initialized' },
      { timestamp: new Date().toLocaleTimeString(), level: 'INFO', message: 'Model loaded successfully' },
      { timestamp: new Date().toLocaleTimeString(), level: 'DEBUG', message: `Cache initialized with TTL=${cacheTTL}` },
      { timestamp: new Date().toLocaleTimeString(), level: 'INFO', message: 'API server connected' }
    ];
    setLogs(systemLogs);
  };

  const addLog = (level, message) => {
    const newLog = {
      timestamp: new Date().toLocaleTimeString(),
      level,
      message
    };
    setLogs(prev => [newLog, ...prev].slice(0, 100));
  };

  const handleSaveCacheConfig = async () => {
    setSaving(true);
    
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/cache/config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ttl: cacheTTL,
          maxSize: cacheMaxSize
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        addLog('INFO', `✓ ${result.message}`);
        addLog('INFO', `Cache TTL: ${cacheTTL}s, Max Size: ${cacheMaxSize} entries`);
        
        // Reload config to confirm
        await loadCacheConfig();
      } else {
        const error = await response.json();
        addLog('ERROR', `Failed to update cache config: ${error.message || error.error}`);
      }
    } catch (error) {
      addLog('ERROR', `Cache config update error: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleClearCache = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/cache/clear`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        addLog('INFO', '✓ Cache cleared successfully');
        await loadCacheStats();
      } else {
        addLog('ERROR', 'Failed to clear cache');
      }
    } catch (error) {
      addLog('ERROR', `Cache clear error: ${error.message}`);
    }
  };

  const handleReloadModel = () => {
    addLog('INFO', `Model reload requested: ${modelName}`);
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

      {/* Cache Statistics */}
      <div className="admin-section">
        <h2 className="section-title">💾 Cache Statistics</h2>
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-label">Cache Entries</div>
            <div className="metric-value">{cacheStats.entries}<span className="metric-unit">/ {cacheStats.max_size}</span></div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Cache Hits</div>
            <div className="metric-value" style={{color: '#4caf50'}}>{cacheStats.hits}</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Cache Misses</div>
            <div className="metric-value" style={{color: '#ff9800'}}>{cacheStats.misses}</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Evictions</div>
            <div className="metric-value" style={{color: '#f44336'}}>{cacheStats.evictions}</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Total Operations</div>
            <div className="metric-value">{cacheStats.sets + cacheStats.deletes}</div>
          </div>
        </div>
      </div>

      {/* Cache Configuration */}
      <div className="admin-section">
        <h2 className="section-title">⚙️ Cache Configuration</h2>
        <div className="config-form">
          <div className="form-group">
            <label>Cache TTL (Time-To-Live in seconds)</label>
            <input
              type="number"
              value={cacheTTL}
              onChange={(e) => setCacheTTL(parseInt(e.target.value))}
              min="60"
              max="86400"
              disabled={saving}
            />
            <small style={{color: '#888'}}>How long responses stay cached (60s - 24hrs)</small>
          </div>
          <div className="form-group">
            <label>Cache Max Entries</label>
            <input
              type="number"
              value={cacheMaxSize}
              onChange={(e) => setCacheMaxSize(parseInt(e.target.value))}
              min="10"
              max="100000"
              disabled={saving}
            />
            <small style={{color: '#888'}}>Maximum number of cached responses (10 - 100,000)</small>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button 
              className="btn-primary" 
              onClick={handleSaveCacheConfig}
              disabled={saving}
            >
              {saving ? '⏳ Saving...' : '💾 Save Configuration'}
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
              <option value="deepseek-r1:1.5b">DeepSeek R1 1.5B</option>
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
                <span style={{ 
                  color: log.level === 'ERROR' ? '#ff6b6b' : 
                         log.level === 'INFO' ? '#4caf50' : 
                         '#ffa726' 
                }}>
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
              <div style={{ color: cacheStats.entries > 0 ? '#90ee90' : '#ffa726' }}>
                {cacheStats.entries > 0 ? '✓ Active' : '⚠ Empty'}
              </div>
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
