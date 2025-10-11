import React from 'react';

function Navigation({ currentView, onViewChange, user, onLogout }) {
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
            ⚙️ Admin
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
        <div className="user-info">
          {user && <span>👤 {user.username}</span>}
        </div>
        <button className="btn-secondary" onClick={onLogout}>
          Logout
        </button>
      </div>
    </nav>
  );
}

export default Navigation;
