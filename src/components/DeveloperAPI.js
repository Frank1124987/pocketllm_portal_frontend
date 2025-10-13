import React, { useState } from 'react';

function DeveloperAPI({ apiService, user, isGuest, onShowLogin }) {
  const [apiKey] = useState(`pk_${user?.userId}_${Date.now()}`);
  const [copiedApiKey, setCopiedApiKey] = useState(false);
  const [selectedEndpoint, setSelectedEndpoint] = useState(null);

  const endpoints = [
    {
      method: 'POST',
      path: '/api/v1/inference',
      description: 'Send a prompt to the model and get a response',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer {API_KEY}'
      },
      requestBody: {
        prompt: 'What is machine learning?',
        sessionId: 'sess_123456',
        parameters: {
          temperature: 0.7,
          maxTokens: 256
        }
      },
      response: {
        responseId: 'resp_123456',
        response: 'Machine learning is a subset of artificial intelligence...',
        latency: 1250,
        isCached: false,
        tokens: 145
      }
    },
    {
      method: 'POST',
      path: '/api/v1/sessions',
      description: 'Create a new chat session',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer {API_KEY}'
      },
      requestBody: {
        userId: 'user_123'
      },
      response: {
        sessionId: 'sess_123456',
        userId: 'user_123',
        createdAt: '2025-10-09T12:34:56Z'
      }
    },
    {
      method: 'GET',
      path: '/api/v1/sessions/{sessionId}/messages',
      description: 'Get all messages in a session',
      headers: {
        'Authorization': 'Bearer {API_KEY}'
      },
      response: {
        sessionId: 'sess_123456',
        messages: [
          {
            messageId: 'msg_1',
            content: 'Hello',
            type: 'USER',
            timestamp: '2025-10-09T12:34:56Z'
          },
          {
            messageId: 'msg_2',
            content: 'Hello! How can I help?',
            type: 'ASSISTANT',
            timestamp: '2025-10-09T12:34:58Z'
          }
        ]
      }
    },
    {
      method: 'GET',
      path: '/api/v1/health',
      description: 'Check system health and metrics',
      headers: {
        'Authorization': 'Bearer {API_KEY}'
      },
      response: {
        status: 'healthy',
        uptime: 3600,
        metrics: {
          cpuUsage: 45.2,
          memoryUsage: 62.1,
          activeSessions: 5
        }
      }
    },
    {
      method: 'DELETE',
      path: '/api/v1/sessions/{sessionId}',
      description: 'Delete a session and its messages',
      headers: {
        'Authorization': 'Bearer {API_KEY}'
      },
      response: {
        success: true,
        message: 'Session deleted successfully'
      }
    },
    {
      method: 'POST',
      path: '/api/v1/cache/clear',
      description: 'Clear the inference cache',
      headers: {
        'Authorization': 'Bearer {API_KEY}'
      },
      response: {
        success: true,
        message: 'Cache cleared',
        entriesRemoved: 42
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
        <h2 className="api-section-title">🔑 Your API Key</h2>
        <p>Use this key to authenticate API requests. Keep it secure!</p>
        <div className="api-key-box">
          <code>{apiKey}</code>
          <button 
            className={copiedApiKey ? 'btn-secondary' : 'btn-primary'}
            onClick={handleCopyApiKey}
          >
            {copiedApiKey ? '✓ Copied' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Authentication Section */}
      <div className="api-section">
        <h2 className="api-section-title">🔐 Authentication</h2>
        <p>Include your API key in the Authorization header:</p>
        <div className="code-block">
          {`curl -H "Authorization: Bearer ${apiKey}" \\
  https://pocketllm.local/api/v1/health`}
        </div>
      </div>

      {/* Base URL Section */}
      <div className="api-section">
        <h2 className="api-section-title">📍 Base URL</h2>
        <div className="code-block">
          https://pocketllm.local/api/v1
        </div>
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

      {/* Rate Limiting Section */}
      <div className="api-section">
        <h2 className="api-section-title">⏱️ Rate Limiting</h2>
        <div className="config-form">
          <ul>
            <li><strong>Requests per minute:</strong> 60</li>
            <li><strong>Requests per hour:</strong> 1,000</li>
            <li><strong>Burst limit:</strong> 10 requests</li>
          </ul>
          <p style={{ fontSize: '0.9rem', color: '#666' }}>
            Rate limit status is included in response headers:
          </p>
          <div className="code-block">
            {`X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1633788896`}
          </div>
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
        
        <h3 style={{ marginTop: '1.5rem' }}>Python</h3>
        <div className="code-block">
{`import requests

API_KEY = "${apiKey}"
BASE_URL = "https://pocketllm.local/api/v1"

headers = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

# Create a session
session_data = requests.post(
    f"{BASE_URL}/sessions",
    json={"userId": "user_123"},
    headers=headers
).json()

session_id = session_data["sessionId"]

# Send inference request
response = requests.post(
    f"{BASE_URL}/inference",
    json={
        "prompt": "What is AI?",
        "sessionId": session_id,
        "parameters": {"temperature": 0.7, "maxTokens": 256}
    },
    headers=headers
).json()

print(response["response"])`}
        </div>

        <h3 style={{ marginTop: '1.5rem' }}>JavaScript/Node.js</h3>
        <div className="code-block">
{`const API_KEY = "${apiKey}";
const BASE_URL = "https://pocketllm.local/api/v1";

async function sendMessage(prompt, sessionId) {
  const response = await fetch(\`\${BASE_URL}/inference\`, {
    method: "POST",
    headers: {
      "Authorization": \`Bearer \${API_KEY}\`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      prompt: prompt,
      sessionId: sessionId,
      parameters: { temperature: 0.7, maxTokens: 256 }
    })
  });

  return await response.json();
}

const result = await sendMessage("Hello, how are you?", "sess_123");
console.log(result.response);`}
        </div>
      </div>
    </div>
  );
}

export default DeveloperAPI;
