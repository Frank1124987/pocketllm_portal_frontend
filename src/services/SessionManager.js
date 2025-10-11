/**
 * SessionManager - Client-side session manager that communicates with backend
 * All operations now go through the backend API to sync with Firebase
 */
export class SessionManager {
  constructor(apiService) {
    this.apiService = apiService;
    this.sessions = new Map(); // Local cache for quick access
    this.currentSessionId = null;
  }

  /**
   * Initialize - Load all sessions from backend on startup
   */
  async initialize(userId) {
    try {
      const sessions = await this.apiService.getUserSessions(userId);
      // Populate local cache
      this.sessions.clear();
      sessions.forEach(session => {
        this.sessions.set(session.sessionId, session);
      });
      
      return sessions;
    } catch (error) {
      console.error('Failed to initialize sessions:', error);
      return [];
    }
  }

  /**
   * Create a new session - calls backend API
   */
  async createSession(userId) {
    try {
      this.sessions.clear();
      const session = await this.apiService.createSession(userId);
      
      // Add to local cache
      this.sessions.set(session.sessionId, session);
      console.log(this.sessions)
      return session;
    } catch (error) {
      console.error('Failed to create session:', error);
      throw error;
    }
  }

  /**
   * Get a specific session by ID
   * First checks local cache, then fetches from backend if not found
   */
  async getSession(sessionId) {
    // Check local cache first
    if (this.sessions.has(sessionId)) {
      return this.sessions.get(sessionId);
    }
    
    // Not in cache, fetch from backend
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
   * Refresh all sessions from backend
   */
  async refreshSessions() {
    try {
      const sessions = await this.apiService.getUserSessions();
      
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
   * Note: Messages are automatically saved to backend by APIService.sendInferenceRequest
   * This just updates the local cache
   */
  addMessageLocally(sessionId, message) {
    const session = this.sessions.get(sessionId);
    if (session) {
      if (!session.messages) {
        session.messages = [];
      }
      session.messages.push(message);
      session.lastAccessedAt = new Date().toISOString();
    }
  }

  /**
   * Get all messages in a session
   * First checks local cache, then fetches from backend if needed
   */
  async getMessages(userId, sessionId) {
    const session = this.sessions.get(sessionId);
    if (session && session.messages) {
      console.log(sessionId, session);
      return session.messages;
    }
    
    // Fetch from backend if not in cache
    try {
      const messages = await this.apiService.getSessionMessages(userId, sessionId);
      
      // Update local cache
      if (session) {
        session.messages = messages;
      }
      
      return messages;
    } catch (error) {
      console.error('Failed to get messages:', error);
      return [];
    }
  }

  /**
   * Clear all messages in a session - calls backend API
   */
  async clearHistory(sessionId) {
    try {
      await this.apiService.clearSessionHistory(sessionId);
      
      // Update local cache
      const session = this.sessions.get(sessionId);
      if (session) {
        session.messages = [];
        session.lastAccessedAt = new Date().toISOString();
      }
      
      return true;
    } catch (error) {
      console.error('Failed to clear history:', error);
      return false;
    }
  }

  /**
   * Delete a session - calls backend API
   */
  async deleteSession(userId, sessionId) {
    try {
      await this.apiService.deleteSession(userId, sessionId);
      
      // Remove from local cache
      this.sessions.delete(sessionId);
      
      return true;
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
      avgMessagesPerSession: sessions.length > 0 ? (totalMessages / sessions.length).toFixed(2) : 0
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
  }
}
