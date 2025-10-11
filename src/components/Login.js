import React, { useState } from 'react';
import '../App.css';

/**
 * Login Component
 * Handles user authentication with Google OAuth or Guest mode
 */
function Login({ authService, onLoginSuccess, isModal = false }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [rememberMe, setRememberMe] = useState(true);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await authService.signInWithGoogle(rememberMe);
      
      // Pass result to parent component
      onLoginSuccess(result);
    } catch (error) {
      console.error('Login error:', error);
      setError(error.message);
      setLoading(false);
    }
  };

  const handleGuestMode = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await authService.continueAsGuest();
      
      // Store guest info in localStorage for session recovery
      localStorage.setItem('guestUser', JSON.stringify(result.user));
      
      onLoginSuccess(result);
    } catch (error) {
      console.error('Guest mode error:', error);
      setError('Failed to enter guest mode. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className={isModal ? "" : "auth-container"}>
      <div className="login-box" style={isModal ? { margin: 0 } : {}}>
        <div className="login-header">
          <h1>🤖 PocketLLM Portal</h1>
          <p className="login-subtitle">
            Lightweight LLM Chat Interface with Firebase Authentication
          </p>
        </div>

        {error && (
          <div className="error-message" style={{
            padding: '1rem',
            marginBottom: '1.5rem',
            backgroundColor: '#fee',
            border: '1px solid #fcc',
            borderRadius: '8px',
            color: '#c33'
          }}>
            ⚠️ {error}
          </div>
        )}

        <div className="login-methods">
          {/* Google Sign In */}
          <button
            className="btn-google"
            onClick={handleGoogleSignIn}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              width: '100%',
              padding: '0.875rem 1.5rem',
              fontSize: '1rem',
              fontWeight: '500',
              backgroundColor: '#fff',
              color: '#333',
              border: '1px solid #ddd',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              marginBottom: '1rem'
            }}
          >
            {loading ? (
              <>
                <div className="spinner" style={{
                  width: '20px',
                  height: '20px',
                  border: '2px solid #f3f3f3',
                  borderTop: '2px solid #4285f4',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
                Signing in...
              </>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Sign in with Google
              </>
            )}
          </button>

          {/* Remember Me Checkbox */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '1.5rem',
            fontSize: '0.9rem',
            color: '#666'
          }}>
            <input
              type="checkbox"
              id="rememberMe"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              disabled={loading}
              style={{ cursor: 'pointer' }}
            />
            <label htmlFor="rememberMe" style={{ cursor: 'pointer' }}>
              Keep me signed in
            </label>
          </div>

          {/* Divider and Guest Mode - only show if not in modal */}
          {!isModal && (
            <>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                margin: '1.5rem 0',
                color: '#999'
              }}>
                <div style={{ flex: 1, height: '1px', backgroundColor: '#ddd' }}></div>
                <span style={{ padding: '0 1rem', fontSize: '0.875rem' }}>OR</span>
                <div style={{ flex: 1, height: '1px', backgroundColor: '#ddd' }}></div>
              </div>

              {/* Guest Mode */}
              <button
                className="btn-secondary"
                onClick={handleGuestMode}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '0.875rem 1.5rem',
                  fontSize: '1rem',
                  fontWeight: '500',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                Continue as Guest
              </button>
            </>
          )}
        </div>

        {/* Info Box */}
        <div style={{
          marginTop: '2rem',
          padding: '1rem',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          fontSize: '0.875rem',
          color: '#666'
        }}>
          <div style={{ fontWeight: '600', marginBottom: '0.5rem', color: '#333' }}>
            ℹ️ Authentication Modes
          </div>
          <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
            <li style={{ marginBottom: '0.5rem' }}>
              <strong>Signed In:</strong> Your chat history is saved to Firebase and accessible across devices
            </li>
            <li>
              <strong>Guest Mode:</strong> Chat history is stored locally in your browser and will be lost when you close the tab
            </li>
          </ul>
        </div>

        {/* Footer */}
        <div style={{
          marginTop: '2rem',
          textAlign: 'center',
          fontSize: '0.875rem',
          color: '#999'
        }}>
          By signing in, you agree to our Terms of Service and Privacy Policy
        </div>
      </div>
    </div>
  );
}

export default Login;
