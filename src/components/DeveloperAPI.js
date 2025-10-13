import React, { useState, useEffect } from 'react';

function DeveloperAPI({ apiService, user, isGuest, onShowLogin }) {
  const [apiKey, setApiKey] = useState('');
  const [copiedApiKey, setCopiedApiKey] = useState(false);
  const [selectedEndpoint, setSelectedEndpoint] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadApiKey = async () => {
      if (!isGuest && user) {
        try {
          const token = apiService.getIdToken();
          if (token) {
            setApiKey(token);
          }
        } catch (error) {
          console.error('Failed to get ID token:', error);
        }
      }
      setLoading(false);
    };
    loadApiKey();
  }, [isGuest, user]);

  const backendUrl = process.env.REACT_APP_API_URL || 'https://pocketllm-backend-123456789.us-central1.run.app';

  const endpoints = [
    {
      method: 'POST',
      path: '/dev/inference',
      description: 'Direct inference for developers - No session management, no storage, just pure inference',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer {YOUR_FIREBASE_ID_TOKEN}'
      },
      requestBody: {
        messages: [
          { role: 'user', content: 'What is machine learning?' }
        ],
        parameters: {
          temperature: 0.7,
          max_tokens: 256
        }
      },
      response: {
        response: 'Machine learning is a subset of artificial intelligence...',
        latency: 1250,
        tokens: 145,
        model: 'deepseek-r1:1.5b'
      }
    }
  ];

  const handleCopyApiKey = () => {
    navigator.clipboard.writeText(apiKey);
    setCopiedApiKey(true);
    setTimeout(() => setCopiedApiKey(false), 2000);
  };

  // Check if user is authenticated (not a guest)
  if (isGuest || !user) {
    return (
      <div className="developer-container" style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        textAlign: 'center'
      }}>
        <div style={{
          maxWidth: '500px',
          padding: '2rem',
          backgroundColor: '#f9f9f9',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ color: '#333', marginBottom: '1rem' }}>🔒 Authentication Required</h2>
          <p style={{ color: '#666', marginBottom: '1.5rem', lineHeight: '1.6' }}>
            The Developer API documentation and API keys are only available to authenticated users. 
            Please sign in with your Google account to access your unique API key, 
            endpoint documentation, and code examples.
          </p>
          <button 
            className="btn-primary" 
            onClick={onShowLogin}
            style={{ fontSize: '1rem', padding: '0.75rem 2rem' }}
          >
            🔐 Sign In to Continue
          </button>
          <p style={{ color: '#999', fontSize: '0.85rem', marginTop: '1rem' }}>
            Guest users cannot generate API keys for security reasons.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="developer-container">
      <h1 style={{ margin: '0 0 2rem 0', color: '#333' }}>🔌 Developer API Documentation</h1>

      {/* API Key Section */}
      <div className="api-section">
        <h2 className="api-section-title">🔑 Your Firebase ID Token</h2>
        <p>This is your Firebase authentication token. Use it to authenticate API requests.</p>
        {loading ? (
          <div style={{ padding: '1rem', textAlign: 'center' }}>
            <p>Loading token...</p>
          </div>
        ) : (
          <div className="api-key-box">
            <code style={{ fontSize: '0.75rem', wordBreak: 'break-all' }}>{apiKey}</code>
            <button 
              className={copiedApiKey ? 'btn-secondary' : 'btn-primary'}
              onClick={handleCopyApiKey}
            >
              {copiedApiKey ? '✓ Copied' : 'Copy'}
            </button>
          </div>
        )}
        <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: '#fff3cd', borderRadius: '4px', fontSize: '0.85rem' }}>
          <strong>⚠️ Security Notice:</strong>
          <ul style={{ marginTop: '0.5rem', marginBottom: 0, paddingLeft: '1.5rem' }}>
            <li>This token expires after 1 hour</li>
            <li>Never share your token publicly or commit it to version control</li>
            <li>The app automatically refreshes this token for you</li>
            <li>If compromised, simply log out and log back in to get a new token</li>
          </ul>
        </div>
      </div>

      {/* Authentication Section */}
      <div className="api-section">
        <h2 className="api-section-title">🔐 Authentication</h2>
        <p>Your Firebase ID Token is used for authentication. Include it in the Authorization header:</p>
        <div className="code-block">
          {`curl -H "Authorization: Bearer ${apiKey.substring(0, 50)}..." \\
  ${backendUrl}`}
        </div>
        <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '1rem' }}>
          <strong>Note:</strong> This is your Firebase ID token. It expires after 1 hour and is automatically refreshed by the app.
        </p>
      </div>

      {/* Base URL Section */}
      <div className="api-section">
        <h2 className="api-section-title">📍 Base URL</h2>
        <div className="code-block">
          {backendUrl}
        </div>
        <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.5rem' }}>
          Production backend endpoint for PocketLLM
        </p>
      </div>

      {/* Endpoints Section */}
      <div className="api-section">
        <h2 className="api-section-title">📚 Endpoints</h2>
        <div className="endpoint-list">
          {endpoints.map((endpoint, idx) => (
            <div key={idx} className="endpoint">
              <div>
                <span className={`endpoint-method ${endpoint.method.toLowerCase()}`}>
                  {endpoint.method}
                </span>
                <span className="endpoint-path">{endpoint.path}</span>
              </div>
              <div className="endpoint-description">
                {endpoint.description}
              </div>
              <button
                className="btn-secondary"
                onClick={() => setSelectedEndpoint(selectedEndpoint === idx ? null : idx)}
                style={{ marginTop: '0.5rem' }}
              >
                {selectedEndpoint === idx ? '▼ Hide Details' : '▶ Show Details'}
              </button>

              {selectedEndpoint === idx && (
                <div style={{ marginTop: '1rem', borderTop: '1px solid #ddd', paddingTop: '1rem' }}>
                  {/* Headers */}
                  <div style={{ marginBottom: '1rem' }}>
                    <h4 style={{ marginTop: 0 }}>Headers:</h4>
                    <div className="code-block">
                      {Object.entries(endpoint.headers).map(([key, value]) => (
                        <div key={key}>{key}: {value}</div>
                      ))}
                    </div>
                  </div>

                  {/* Request Body */}
                  {endpoint.requestBody && (
                    <div style={{ marginBottom: '1rem' }}>
                      <h4>Request Body:</h4>
                      <div className="code-block">
                        {JSON.stringify(endpoint.requestBody, null, 2)}
                      </div>
                    </div>
                  )}

                  {/* Response */}
                  <div>
                    <h4>Response:</h4>
                    <div className="code-block">
                      {JSON.stringify(endpoint.response, null, 2)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>


      {/* Error Codes Section */}
      <div className="api-section">
        <h2 className="api-section-title">❌ Error Codes</h2>
        <div className="config-form">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #ddd' }}>
                <th style={{ textAlign: 'left', padding: '0.5rem' }}>Code</th>
                <th style={{ textAlign: 'left', padding: '0.5rem' }}>Message</th>
                <th style={{ textAlign: 'left', padding: '0.5rem' }}>Description</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '0.5rem' }}><code>400</code></td>
                <td style={{ padding: '0.5rem' }}>Bad Request</td>
                <td style={{ padding: '0.5rem' }}>Invalid request parameters</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '0.5rem' }}><code>401</code></td>
                <td style={{ padding: '0.5rem' }}>Unauthorized</td>
                <td style={{ padding: '0.5rem' }}>Invalid or missing API key</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '0.5rem' }}><code>429</code></td>
                <td style={{ padding: '0.5rem' }}>Too Many Requests</td>
                <td style={{ padding: '0.5rem' }}>Rate limit exceeded</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '0.5rem' }}><code>500</code></td>
                <td style={{ padding: '0.5rem' }}>Server Error</td>
                <td style={{ padding: '0.5rem' }}>Internal server error</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '0.5rem' }}><code>503</code></td>
                <td style={{ padding: '0.5rem' }}>Service Unavailable</td>
                <td style={{ padding: '0.5rem' }}>Model or service temporarily unavailable</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Example Code Section */}
      <div className="api-section">
        <h2 className="api-section-title">💻 Example Code</h2>
        
        <h3 style={{ marginTop: '1.5rem' }}>Python - Direct Inference (Recommended for Developers)</h3>
        <div className="code-block">
{`import requests 

# Your Firebase ID Token (get from Developer API page)
FIREBASE_TOKEN = "${apiKey ? apiKey.substring(0, 50) + '...' : 'your_token_here'}"
BASE_URL = "${backendUrl}"

headers = {
    "Authorization": f"Bearer {FIREBASE_TOKEN}",
    "Content-Type": "application/json"
}

# Direct inference - No session management needed
response = requests.post(
    f"{BASE_URL}/dev/inference",
    json={
        "messages": [
            {"role": "user", "content": "What is machine learning?"}
        ],
        "parameters": {
            "temperature": 0.7,
            "max_tokens": 256
        }
    },
    headers=headers
).json()

print(response["response"])
print(f"Latency: {response['latency']}ms")
print(f"Model: {response['model']}")`}
        </div>


      </div>
    </div>
  );
}

export default DeveloperAPI;
