import React, { useState, useEffect } from 'react';
import './App.css';
import ChatInterface from './components/ChatInterface';
import AdminConsole from './components/AdminConsole';
import DeveloperAPI from './components/DeveloperAPI';
import Navigation from './components/Navigation';
import { SessionManager } from './services/SessionManager';
import { APIService } from './services/APIService';

function App() {
  const [currentView, setCurrentView] = useState('chat'); // 'chat', 'admin', 'api'
  const [user, setUser] = useState(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Initialize services once
  const [apiService] = useState(() => new APIService());
  const [sessionManager] = useState(() => new SessionManager(apiService));

  useEffect(() => {
    // Initialize app on mount
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // TODO: Check for existing Firebase auth token
      // For now, simulate guest user
      const userId = "temp-userId-01";
      const guestUser = { 
        userId, 
        username: 'Guest User',
        email: 'guest@example.com'
      };
      
      setUser(guestUser);
      
      // Initialize session manager (loads sessions from backend if authenticated)
      try {
        await sessionManager.initialize(userId);
      } catch (error) {
        console.log('Session initialization failed (expected without auth):', error);
      }
      
      setAuthenticated(true);
    } catch (error) {
      console.error('App initialization error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (loginResult) => {
    try {
      // loginResult should contain: {user, sessions, stats}
      setUser({
        userId: loginResult.user.uid,
        username: loginResult.user.name || loginResult.user.email,
        email: loginResult.user.email
      });
      
      // Set token in API service
      apiService.setIdToken(loginResult.idToken);
      
      // Initialize sessions from login result
      if (loginResult.sessions) {
        sessionManager.sessions.clear();
        loginResult.sessions.forEach(session => {
          sessionManager.sessions.set(session.sessionId, session);
        });
      }
      
      setAuthenticated(true);
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const handleLogout = async () => {
    try {
      // Call logout API
      await apiService.logout();
      
      // Clear session manager cache
      sessionManager.clearCache();
      
      // Reset state
      setAuthenticated(false);
      setUser(null);
      setCurrentView('chat');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading) {
    return (
      <div className="App auth-container">
        <div className="login-box">
          <h1>PocketLLM Portal</h1>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="App auth-container">
        <div className="login-box">
          <h1>PocketLLM Portal</h1>
          <p>Lightweight LLM Chat Interface</p>
          <button 
            className="btn-primary"
            onClick={() => setAuthenticated(true)}
          >
            Enter as Guest
          </button>
          <p style={{marginTop: '1rem', fontSize: '0.9rem', color: '#666'}}>
            Note: Guest mode uses simulated sessions. 
            For persistent chat history, implement Firebase Authentication.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <Navigation 
        currentView={currentView} 
        onViewChange={setCurrentView}
        user={user}
        onLogout={handleLogout}
      />
      
      <main className="main-content">
        {currentView === 'chat' && (
          <ChatInterface 
            user={user}
            sessionManager={sessionManager}
            apiService={apiService}
          />
        )}
        {currentView === 'admin' && (
          <AdminConsole 
            apiService={apiService}
            sessionManager={sessionManager}
          />
        )}
        {currentView === 'api' && (
          <DeveloperAPI 
            apiService={apiService}
            user={user}
          />
        )}
      </main>
    </div>
  );
}

export default App;
