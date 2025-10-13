import React from 'react';

function Navigation({ currentView, onViewChange, user, onLogout, isGuest, onShowLogin }) {
  return (
    <nav className="navbar">
      <div className="navbar-logo">
        🤖 PocketLLM Portal
      </div>
      
      <ul className="nav-links">
        <li>
          <button 
            className={currentView === 'chat' ? 'active' : ''}
            onClick={() => onViewChange('chat')}
          >
            💬 Chat
          </button>
        </li>
        <li>
          <button 
            className={currentView === 'admin' ? 'active' : ''}
            onClick={() => onViewChange('admin')}
          >
            ⚙️ Cache
          </button>
        </li>
        <li>
          <button 
            className={currentView === 'api' ? 'active' : ''}
            onClick={() => onViewChange('api')}
          >
            🔌 API
          </button>
        </li>
      </ul>
      
      <div className="nav-user">
        <div className="user-info" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {user && (
            <>
              {user.photoURL ? (
                <img 
                  src={user.photoURL} 
                  alt={user.username}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    objectFit: 'cover'
                  }}
                />
              ) : (
                <span>👤</span>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <span style={{ fontWeight: '500' }}>{user.username || user.displayName || 'Guest'}</span>
                {isGuest && (
                  <span style={{ 
                    fontSize: '0.75rem', 
                    color: '#ff9800',
                    fontWeight: '500'
                  }}>
                    🔓 Guest Mode
                  </span>
                )}
              </div>
            </>
          )}
        </div>
        
        {isGuest ? (
          <button 
            className="btn-primary" 
            onClick={onShowLogin}
            style={{ marginRight: '0.5rem' }}
          >
            Sign In
          </button>
        ) : null}
        
        <button className="btn-secondary" onClick={onLogout}>
          {isGuest ? 'Reset' : 'Logout'}
        </button>
      </div>
    </nav>
  );
}

export default Navigation;
