/**
 * APIService - Handles all API communication with the backend
 * Now includes comprehensive session management methods
 */
export class APIService {
  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api/v1';
    this.idToken = null; // Firebase ID token
    this.cache = new Map();
    this.telemetry = {
      totalRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      totalLatency: 0,
      requests: []
    };
  }

  /**
   * Set Firebase ID token for authentication
   */
  setIdToken(token) {
    this.idToken = token;
  }

  /**
   * Get current ID token
   */
  getIdToken() {
    return this.idToken;
  }

  /**
   * Clear authentication token (logout)
   */
  clearAuth() {
    this.idToken = null;
    this.cache.clear();
  }

  /**
   * Make an HTTP request with proper error handling and authentication
   * @private
   */
  async _request(method, endpoint, data = null) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json'
    };

    // Add Authorization header if token is available
    if (this.idToken) {
      headers['Authorization'] = `Bearer ${this.idToken}`;
    }

    const options = {
      method,
      headers
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, options);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API Error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API Request Error:', error);
      throw error;
    }
  }

  // ============================================
  // AUTHENTICATION METHODS
  // ============================================

  /**
   * Login with Firebase ID token
   */
  async login(idToken) {
    try {
      const result = await this._request('POST', '/auth/login', { idToken });
      
      // Store token for future requests
      this.setIdToken(idToken);
      
      return result;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  /**
   * Verify token validity
   */
  async verifyToken(idToken) {
    try {
      const result = await this._request('POST', '/auth/verify', { idToken });
      return result;
    } catch (error) {
      console.error('Token verification failed:', error);
      return { valid: false };
    }
  }

  /**
   * Get user profile
   */
  async getUserProfile() {
    try {
      const result = await this._request('GET', '/auth/profile');
      return result;
    } catch (error) {
      console.error('Failed to get user profile:', error);
      throw error;
    }
  }

  /**
   * Logout
   */
  async logout() {
    try {
      await this._request('POST', '/auth/logout');
      this.clearAuth();
    } catch (error) {
      console.error('Logout failed:', error);
      this.clearAuth(); // Clear local auth even if server request fails
    }
  }

  // ============================================
  // SESSION MANAGEMENT METHODS
  // ============================================

  /**
   * Create a new session
   */
  async createSession(userId) {
    try {
      const result = await this._request('POST', '/sessions', { userId });
      this._logTelemetry('CREATE_SESSION', [], 'Session created', 0, false);
      return result;
    } catch (error) {
      console.error('Failed to create session:', error);
      throw error;
    }
  }

  /**
   * Get a specific session by ID
   */
  async getSession(sessionId) {
    try {
      const result = await this._request('GET', `/sessions/${sessionId}`);
      return result;
    } catch (error) {
      console.error('Failed to get session:', error);
      throw error;
    }
  }

  /**
   * Get all sessions for the authenticated user
   */
  async getUserSessions(userId) {
    try {
      const result = await this._request('GET', `/sessions?uid=${userId}`);
      return result.sessions || [];
    } catch (error) {
      console.error('Failed to get user sessions:', error);
      return [];
    }
  }

  /**
   * Get session messages
   */
  async getSessionMessages(userId, sessionId) {
    try {
      const result = await this._request('GET', `/sessions/${userId}/${sessionId}/messages`);
      return result.messages || [];
    } catch (error) {
      console.error('Failed to get session messages:', error);
      throw error;
    }
  }

  /**
   * Delete a session
   */
  async deleteSession(userId, sessionId) {
    try {
      await this._request('DELETE', `/sessions/${userId}/${sessionId}`);
      this._logTelemetry('DELETE_SESSION', [], 'Session deleted', 0, false);
      return true;
    } catch (error) {
      console.error('Failed to delete session:', error);
      throw error;
    }
  }

  /**
   * Clear session history
   */
  async clearSessionHistory(sessionId) {
    try {
      await this._request('POST', `/sessions/${sessionId}/clear`);
      this._logTelemetry('CLEAR_HISTORY', [], 'History cleared', 0, false);
      return true;
    } catch (error) {
      console.error('Failed to clear session history:', error);
      throw error;
    }
  }

  // ============================================
  // INFERENCE METHODS
  // ============================================

  /**
   * Generate cache key from conversation history
   * @private
   */
  _generateCacheKey(conversationHistory) {
    // Find the last user message in the conversation
    let lastUserMessage = '';
    for (let i = conversationHistory.length - 1; i >= 0; i--) {
      if (conversationHistory[i].role === 'user') {
        lastUserMessage = conversationHistory[i].content;
        break;
      }
    }

    // Create cache key from the last user message
    return `cache_${lastUserMessage.toLowerCase().trim()}`.substring(0, 100);
  }

  /**
   * Check cache for similar conversation patterns (FR4)
   * @private
   */
  _checkCache(conversationHistory) {
    const key = this._generateCacheKey(conversationHistory);
    const cached = this.cache.get(key);

    if (cached && !this._isCacheExpired(cached)) {
      this.telemetry.cacheHits++;
      this._logTelemetry('CACHE_HIT', conversationHistory, cached.response, cached.latency, true);
      return cached;
    }

    this.telemetry.cacheMisses++;
    return null;
  }

  /**
   * Store response in cache (FR4)
   * @private
   */
  _cacheResponse(conversationHistory, response, latency, ttl = 3600) {
    const key = this._generateCacheKey(conversationHistory);
    this.cache.set(key, {
      response,
      latency,
      timestamp: Date.now(),
      expiresAt: Date.now() + (ttl * 1000),
      conversationLength: conversationHistory.length
    });
  }

  /**
   * Check if cache entry has expired (FR4)
   * @private
   */
  _isCacheExpired(cacheEntry) {
    return Date.now() > cacheEntry.expiresAt;
  }

  /**
   * Log telemetry data (FR8)
   * @private
   */
  _logTelemetry(action, conversationHistory, response, latency, isCached) {
    // Get the last user message for logging
    let lastUserMessage = '';
    for (let i = conversationHistory.length - 1; i >= 0; i--) {
      if (conversationHistory[i]?.role === 'user') {
        lastUserMessage = conversationHistory[i].content;
        break;
      }
    }

    const logEntry = {
      timestamp: new Date(),
      action,
      messageCount: conversationHistory.length,
      lastUserMessage: lastUserMessage.substring(0, 100),
      responseLength: response?.length || 0,
      latency,
      isCached
    };

    this.telemetry.totalRequests++;
    this.telemetry.totalLatency += latency || 0;
    this.telemetry.requests.push(logEntry);

    // Keep only last 1000 requests
    if (this.telemetry.requests.length > 1000) {
      this.telemetry.requests.shift();
    }

    console.log('[TELEMETRY]', logEntry);
  }

  /**
   * Send inference request to backend with conversation history
   * Messages are automatically saved to Firebase by the backend
   * 
   * @param {string} sessionId - The session ID
   * @param {array} conversationHistory - Array of messages in format:
   *   [
   *     { role: 'system', content: '...' },
   *     { role: 'user', content: 'first message' },
   *     { role: 'assistant', content: 'response' },
   *     { role: 'user', content: 'second message' }
   *   ]
   * @param {object} parameters - Model parameters (temperature, maxTokens, etc)
   * @returns {Promise<object>} Response with text, latency, and cache info
   */
  async sendInferenceRequest(sessionId, conversationHistory, parameters = {}) {
    const startTime = Date.now();

    try {
      // Validate input
      if (!Array.isArray(conversationHistory) || conversationHistory.length === 0) {
        throw new Error('Invalid conversation history format');
      }

      // Check local cache first (FR4)
      // const cached = this._checkCache(conversationHistory);
      // if (cached) {
      //   return {
      //     response: cached.response,
      //     latency: cached.latency,
      //     isCached: true,
      //     tokens: cached.tokens || 0,
      //     conversationLength: cached.conversationLength
      //   };
      // }
      console.log(conversationHistory);
      // Send to backend
      const result = await this._request('POST', '/inference', {
        messages: conversationHistory,
        sessionId: sessionId,
        parameters: parameters
      });

      const latency = Date.now() - startTime;

      // Cache the response locally
      this._cacheResponse(conversationHistory, result.response, latency, parameters.ttl || 3600);

      // Log telemetry
      this._logTelemetry('INFERENCE', conversationHistory, result.response, latency, result.isCached || false);

      return {
        response: result.response,
        latency: latency,
        isCached: result.isCached || false,
        tokens: result.tokens || 0,
        conversationLength: conversationHistory.length
      };
    } catch (error) {
      this._logTelemetry('ERROR', conversationHistory, `Error: ${error.message}`, Date.now() - startTime, false);
      throw error;
    }
  }

  // ============================================
  // ADMIN METHODS
  // ============================================

  /**
   * Get system health and metrics
   */
  async getSystemHealth() {
    try {
      const result = await this._request('GET', '/health');
      return result;
    } catch (error) {
      console.error('Failed to get system health:', error);
      return {
        status: 'unknown',
        cpuUsage: 0,
        memoryUsage: 0,
        activeSessions: 0
      };
    }
  }

  /**
   * Update cache configuration
   */
  async updateCacheConfig(config) {
    try {
      await this._request('POST', '/admin/cache/config', config);
      this._logTelemetry('UPDATE_CACHE_CONFIG', [], `Config updated: TTL=${config.ttl}s`, 0, false);
    } catch (error) {
      console.error('Failed to update cache config:', error);
      throw error;
    }
  }

  /**
   * Clear cache
   */
  async clearCache() {
    try {
      const result = await this._request('POST', '/admin/cache/clear');
      this.cache.clear();
      this.telemetry.cacheHits = 0;
      this.telemetry.cacheMisses = 0;
      this._logTelemetry('CLEAR_CACHE', [], 'Cache cleared', 0, false);
      return result;
    } catch (error) {
      console.error('Failed to clear cache:', error);
      throw error;
    }
  }

  /**
   * Reload model
   */
  async reloadModel(modelName) {
    try {
      const result = await this._request('POST', '/admin/model/reload', { modelName });
      this._logTelemetry('RELOAD_MODEL', [], `Model reloaded: ${modelName}`, 0, false);
      return result;
    } catch (error) {
      console.error('Failed to reload model:', error);
      throw error;
    }
  }

  /**
   * Get system logs
   */
  async getSystemLogs(limit = 100) {
    try {
      const result = await this._request('GET', `/admin/logs?limit=${limit}`);
      return result.logs || [];
    } catch (error) {
      console.error('Failed to get system logs:', error);
      return [];
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    const totalEntries = this.cache.size;
    const cacheHitRate = this.telemetry.totalRequests > 0
      ? ((this.telemetry.cacheHits / this.telemetry.totalRequests) * 100).toFixed(2)
      : 0;

    return {
      totalEntries,
      cacheHits: this.telemetry.cacheHits,
      cacheMisses: this.telemetry.cacheMisses,
      cacheHitRate: `${cacheHitRate}%`,
      totalRequests: this.telemetry.totalRequests,
      avgLatency: this.telemetry.totalRequests > 0
        ? (this.telemetry.totalLatency / this.telemetry.totalRequests).toFixed(2)
        : 0
    };
  }

  /**
   * Get telemetry data
   */
  getTelemetry() {
    return {
      ...this.telemetry,
      avgLatency: this.telemetry.totalRequests > 0
        ? (this.telemetry.totalLatency / this.telemetry.totalRequests).toFixed(2)
        : 0
    };
  }
}
