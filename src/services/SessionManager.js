/**
 * SessionManager - Client-side session manager that communicates with backend
 * Handles both authenticated users (Firebase) and guest users (localStorage)
 */
export class SessionManager {
  constructor(apiService) {
    this.apiService = apiService;
    this.sessions = new Map(); // Local cache for quick access
    this.currentSessionId = null;
    this.isGuestMode = false;
  }

  /**
   * Initialize - Load all sessions from backend (authenticated) or localStorage (guest)
   */
  async initialize(userId, isGuest = false) {
    this.isGuestMode = isGuest;
    
    try {
      if (isGuest) {
        // Load guest sessions from localStorage
        return this._loadGuestSessions();
      } else {
        // Load authenticated user sessions from backend
        const sessions = await this.apiService.getUserSessions(userId);
        
        // Populate local cache
        this.sessions.clear();
        sessions.forEach(session => {
          this.sessions.set(session.sessionId, session);
        });
        
        return sessions;
      }
    } catch (error) {
      console.error('Failed to initialize sessions:', error);
      return [];
    }
  }

  /**
   * Load guest sessions from localStorage
   * @private
   */
  _loadGuestSessions() {
    try {
      const stored = localStorage.getItem('guestSessions');
      if (stored) {
        const sessions = JSON.parse(stored);
        this.sessions.clear();
        sessions.forEach(session => {
          this.sessions.set(session.sessionId, session);
        });
        return sessions;
      }
    } catch (error) {
      console.error('Failed to load guest sessions:', error);
    }
    return [];
  }

  /**
   * Save guest sessions to localStorage
   * @private
   */
  _saveGuestSessions() {
    if (!this.isGuestMode) return;
    
    try {
      const sessions = Array.from(this.sessions.values());
      localStorage.setItem('guestSessions', JSON.stringify(sessions));
    } catch (error) {
      console.error('Failed to save guest sessions:', error);
    }
  }

  /**
   * Create a new session - calls backend API for authenticated users or localStorage for guests
   */
  async createSession(userId) {
    try {
      if (this.isGuestMode) {
        // Create guest session locally
        const session = {
          sessionId: `guest_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId: userId,
          messages: [],
          createdAt: new Date().toISOString(),
          lastAccessedAt: new Date().toISOString()
        };
        
        this.sessions.set(session.sessionId, session);
        this._saveGuestSessions();
        
        return session;
      } else {
        // Create session via backend
        const session = await this.apiService.createSession(userId);
        
        // Add to local cache
        this.sessions.set(session.sessionId, session);
        
        return session;
      }
    } catch (error) {
      console.error('Failed to create session:', error);
      throw error;
    }
  }

  /**
   * Get a specific session by ID
   * First checks local cache, then fetches from backend if not found (authenticated only)
   */
  async getSession(sessionId) {
    // Check local cache first
    if (this.sessions.has(sessionId)) {
      return this.sessions.get(sessionId);
    }
    
    // For guest mode, only use cache
    if (this.isGuestMode) {
      return null;
    }
    
    // Not in cache, fetch from backend (authenticated users only)
    try {
      const session = await this.apiService.getSession(sessionId);
      
      if (session) {
        // Update local cache
        this.sessions.set(sessionId, session);
      }
      
      return session;
    } catch (error) {
      console.error('Failed to get session:', error);
      return null;
    }
  }

  /**
   * Get all sessions from local cache
   */
  getAllSessions() {
    return Array.from(this.sessions.values());
  }

  /**
   * Refresh all sessions from backend (authenticated users only)
   */
  async refreshSessions(userId) {
    if (this.isGuestMode) {
      // For guest mode, just return current sessions
      return this.getAllSessions();
    }
    
    try {
      const sessions = await this.apiService.getUserSessions(userId);
      
      // Update local cache
      this.sessions.clear();
      sessions.forEach(session => {
        this.sessions.set(session.sessionId, session);
      });
      
      return sessions;
    } catch (error) {
      console.error('Failed to refresh sessions:', error);
      return this.getAllSessions(); // Return cached sessions on error
    }
  }

  /**
   * Add a message to a session locally
   * For authenticated users: messages are saved to backend by APIService.sendInferenceRequest
   * For guest users: messages are saved to localStorage
   */
  addMessageLocally(sessionId, message) {
    const session = this.sessions.get(sessionId);
    if (session) {
      if (!session.messages) {
        session.messages = [];
      }
      // Create new array to avoid mutation
      session.messages = [...session.messages, message];
      session.lastAccessedAt = new Date().toISOString();
      
      // Save to localStorage for guest users
      if (this.isGuestMode) {
        this._saveGuestSessions();
      }
    }
  }

  /**
   * Get all messages in a session
   * First checks local cache, then fetches from backend if needed (authenticated only)
   */
  async getMessages(userId, sessionId) {
    const session = this.sessions.get(sessionId);
    if (session && session.messages) {
      // Return a copy to prevent mutation issues
      return [...session.messages];
    }
    
    // For guest mode, only use cache
    if (this.isGuestMode) {
      return [];
    }
    
    // Fetch from backend if not in cache (authenticated users only)
    try {
      const messages = await this.apiService.getSessionMessages(userId, sessionId);
      
      // Update local cache
      if (session) {
        session.messages = messages;
      }
      
      return [...messages]; // Return a copy
    } catch (error) {
      console.error('Failed to get messages:', error);
      return [];
    }
  }

  /**
   * Clear all messages in a session
   * For authenticated users: calls backend API
   * For guest users: updates localStorage
   */
  async clearHistory(sessionId) {
    try {
      if (this.isGuestMode) {
        // Clear messages in guest session
        const session = this.sessions.get(sessionId);
        if (session) {
          session.messages = [];
          session.lastAccessedAt = new Date().toISOString();
          this._saveGuestSessions();
        }
        return true;
      } else {
        // Call backend API for authenticated users
        await this.apiService.clearSessionHistory(sessionId);
        
        // Update local cache
        const session = this.sessions.get(sessionId);
        if (session) {
          session.messages = [];
          session.lastAccessedAt = new Date().toISOString();
        }
        
        return true;
      }
    } catch (error) {
      console.error('Failed to clear history:', error);
      return false;
    }
  }

  /**
   * Delete a session
   * For authenticated users: calls backend API
   * For guest users: updates localStorage
   */
  async deleteSession(userId, sessionId) {
    try {
      if (this.isGuestMode) {
        // Delete from guest sessions
        this.sessions.delete(sessionId);
        this._saveGuestSessions();
        return true;
      } else {
        // Call backend API for authenticated users
        await this.apiService.deleteSession(userId, sessionId);
        
        // Remove from local cache
        this.sessions.delete(sessionId);
        
        return true;
      }
    } catch (error) {
      console.error('Failed to delete session:', error);
      return false;
    }
  }

  /**
   * Get session statistics
   */
  getSessionStats() {
    const sessions = this.getAllSessions();
    const totalMessages = sessions.reduce((sum, s) => sum + (s.messages?.length || 0), 0);
    
    return {
      totalSessions: sessions.length,
      totalMessages: totalMessages,
      avgMessagesPerSession: sessions.length > 0 ? (totalMessages / sessions.length).toFixed(2) : 0,
      isGuestMode: this.isGuestMode
    };
  }

  /**
   * Set current session
   */
  setCurrentSession(sessionId) {
    this.currentSessionId = sessionId;
  }

  /**
   * Get current session ID
   */
  getCurrentSessionId() {
    return this.currentSessionId;
  }

  /**
   * Clear local cache (use when logging out)
   */
  clearCache() {
    this.sessions.clear();
    this.currentSessionId = null;
    
    // Clear guest sessions from localStorage
    if (this.isGuestMode) {
      localStorage.removeItem('guestSessions');
    }
  }

  /**
   * Check if in guest mode
   */
  isGuest() {
    return this.isGuestMode;
  }
}
