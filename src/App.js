import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import ChatInterface from './components/ChatInterface';
import AdminConsole from './components/AdminConsole';
import DeveloperAPI from './components/DeveloperAPI';
import Navigation from './components/Navigation';
import Login from './components/Login';
import { SessionManager } from './services/SessionManager';
import { APIService } from './services/APIService';
import AuthService from './services/AuthService';

function App() {
  const [currentView, setCurrentView] = useState('chat'); // 'chat', 'admin', 'api'
  const [user, setUser] = useState(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(true); // Default to guest mode
  const [showLoginModal, setShowLoginModal] = useState(false);
  
  // Initialize services once
  const [apiService] = useState(() => new APIService());
  const [sessionManager] = useState(() => new SessionManager(apiService));
  const [authService] = useState(() => new AuthService());

  const initializeGuestMode = useCallback(async () => {
    // Generate or retrieve guest user
    let guestUser = localStorage.getItem('guestUser');
    
    if (!guestUser) {
      // Create new guest user
      const guestId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      guestUser = JSON.stringify({
        uid: guestId,
        email: 'guest@pocketllm.local',
        displayName: 'Guest User',
        photoURL: null,
        isGuest: true
      });
      localStorage.setItem('guestUser', guestUser);
    }
    
    const parsedGuest = JSON.parse(guestUser);
    setUser(parsedGuest);
    
    // Initialize session manager in guest mode
    await sessionManager.initialize(parsedGuest.uid, true);
    
    setAuthenticated(true);
    setIsGuest(true);
  }, [sessionManager]);

  const initializeApp = useCallback(async () => {
    try {
      setLoading(true);
      
      // Check if there's a persisted Firebase auth session
      const firebaseUser = await authService.initialize();
      
      if (firebaseUser) {
        // User is already signed in with Firebase
        const idToken = await authService.getIdToken();
        
        // Login to backend
        try {
          await apiService.login(idToken);
          
          setUser({
            userId: firebaseUser.uid,
            username: firebaseUser.displayName || firebaseUser.email,
            email: firebaseUser.email,
            photoURL: firebaseUser.photoURL
          });
          
          // Initialize session manager with authenticated user
          await sessionManager.initialize(firebaseUser.uid, false);
          
          setAuthenticated(true);
          setIsGuest(false);
        } catch (error) {
          console.error('Backend login failed:', error);
          // Sign out from Firebase if backend login fails and fall back to guest
          await authService.signOut();
          await initializeGuestMode();
        }
      } else {
        // No Firebase session - start as guest
        await initializeGuestMode();
      }
    } catch (error) {
      console.error('App initialization error:', error);
      // Fall back to guest mode on any error
      await initializeGuestMode();
    } finally {
      setLoading(false);
    }
  }, [authService, apiService, sessionManager, initializeGuestMode]);

  useEffect(() => {
    // Initialize app on mount
    initializeApp();
  }, [initializeApp]);

  const handleLoginSuccess = async (loginResult) => {
    try {
      setLoading(true);
      
      const { user: authUser, idToken } = loginResult;
      const isGuestUser = authUser.isGuest || !idToken;
      
      if (!isGuestUser) {
        // Authenticated user - login to backend
        try {
          await apiService.login(idToken);
          
          setUser({
            userId: authUser.uid,
            username: authUser.displayName || authUser.email,
            email: authUser.email,
            photoURL: authUser.photoURL || null
          });
          
          // Initialize session manager with backend sessions
          await sessionManager.initialize(authUser.uid, false);
          
          setIsGuest(false);
          setAuthenticated(true);
          setShowLoginModal(false); // Close the login modal
        } catch (error) {
          console.error('Backend login failed:', error);
          alert('Failed to connect to backend. Please try again.');
          await authService.signOut();
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleShowLogin = () => {
    setShowLoginModal(true);
  };

  const handleCloseLogin = () => {
    setShowLoginModal(false);
  };

  const handleLogout = async () => {
    try {
      setLoading(true);
      
      if (!isGuest) {
        // Sign out from Firebase and backend for authenticated users
        await apiService.logout();
        await authService.signOut();
        
        // Switch to guest mode after logout
        await initializeGuestMode();
      } else {
        // Already in guest mode, just clear and reinitialize
        localStorage.removeItem('guestUser');
        localStorage.removeItem('guestSessions');
        await initializeGuestMode();
      }
      
      // Clear session manager cache
      sessionManager.clearCache();
      
      setCurrentView('chat');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh ID token periodically for authenticated users
  useEffect(() => {
    if (!authenticated || isGuest) return;
    
    // Refresh token every 50 minutes (tokens expire after 1 hour)
    const refreshInterval = setInterval(async () => {
      try {
        const newToken = await authService.refreshIdToken();
        if (newToken) {
          apiService.setIdToken(newToken);
        }
      } catch (error) {
        console.error('Token refresh failed:', error);
      }
    }, 50 * 60 * 1000);
    
    return () => clearInterval(refreshInterval);
  }, [authenticated, isGuest, authService, apiService]);

  if (loading) {
    return (
      <div className="App auth-container">
        <div className="login-box">
          <h1>🤖 PocketLLM Portal</h1>
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            gap: '1rem',
            padding: '2rem'
          }}>
            <div className="spinner" style={{
              width: '40px',
              height: '40px',
              border: '4px solid #f3f3f3',
              borderTop: '4px solid #4285f4',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
            <p>Loading...</p>
          </div>
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
        isGuest={isGuest}
        onShowLogin={handleShowLogin}
      />
      
      <main className="main-content">
        {currentView === 'chat' && (
          <ChatInterface 
            user={user}
            sessionManager={sessionManager}
            apiService={apiService}
            isGuest={isGuest}
            onShowLogin={handleShowLogin}
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

      {/* Login Modal */}
      {showLoginModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{ position: 'relative' }}>
            <button
              onClick={handleCloseLogin}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'transparent',
                border: 'none',
                fontSize: '1.5rem',
                cursor: 'pointer',
                color: '#999',
                zIndex: 1001
              }}
            >
              ×
            </button>
            <Login 
              authService={authService}
              onLoginSuccess={handleLoginSuccess}
              isModal={true}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
