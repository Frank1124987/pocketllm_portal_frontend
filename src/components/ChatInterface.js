import React, { useState, useEffect, useRef } from 'react';

function ChatInterface({ user, sessionManager, apiService, isGuest, onShowLogin }) {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const messagesEndRef = useRef(null);


  useEffect(() => {
    // Load initial sessions
    loadSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionManager]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadSessions = () => {
    const loadedSessions = sessionManager.getAllSessions();
    if (loadedSessions.length > 0 && !currentSessionId) {
      setSessions(loadedSessions);
      const firstSession = loadedSessions[0];
      setCurrentSessionId(firstSession.sessionId);
      loadSessionMessages(firstSession.sessionId);
    }else{
      handleNewSession();
    }
  };

  const loadSessionMessages = async (sessionId) => {
    try {
      console.log("load sessions message is being called");

      const temp = await sessionManager.getMessages(user['userId'], sessionId);
      console.log("=============",temp);
      console.log("-------------",sessionManager.sessions.get(sessionId));

      setMessages([...(temp || [])]);  // Create a new array with spread operator
    } catch (error) {
      console.error('Failed to load session messages:', error);
      setMessages([]);
    }
  };

  /**
   * Convert messages to API format (role/content)
   * Includes system message and all conversation history
   */
  const buildConversationHistory = () => {
    const conversationMessages = [];

    // Add all previous messages in API format
    messages.forEach((msg) => {
      conversationMessages.push({
        role: msg.type === 'USER' ? 'user' : 'assistant',
        content: msg.content
      });
    });

    return conversationMessages;
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    console.log("new input : ", messages);
    if (!inputValue.trim() || !currentSessionId) return;

    // Create user message object for display
    const userMessage = {
      messageId: `msg_${Math.trunc(Date.now()/1000)}`,
      content: inputValue,
      type: 'USER',
      timestamp: Date.now() / 1000,
      isCached: false
    };

    // Add user message to display immediately
    setMessages(prev => [...prev, userMessage]);
    
    // Update local cache immediately for better UX
    sessionManager.addMessageLocally(currentSessionId, userMessage);
    
    setInputValue('');
    setLoading(true);

    try {
      // Build conversation history including this new message
      const conversationHistory = buildConversationHistory();
      
      // Add the current user message to the history for API call
      conversationHistory.push({
        role: 'user',
        content: inputValue
      });

      // Send the complete conversation history to the backend
      // Backend will automatically save to Firebase
      const response = await apiService.sendInferenceRequest(
        currentSessionId,
        conversationHistory,
        { temperature: 0.7, maxTokens: 1024 }
      );

      // Create assistant message object for display
      const assistantMessage = {
        messageId: `msg_${Date.now() + 1}`,
        content: response.response,
        type: 'ASSISTANT',
        timestamp: new Date().toISOString(),
        isCached: response.isCached || false
      };

      // Add assistant message to display
      setMessages(prev => [...prev, assistantMessage]);


      // Update local cache
      sessionManager.addMessageLocally(currentSessionId, assistantMessage);
      
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        messageId: `msg_${Date.now() + 1}`,
        content: `Error: ${error.message || 'Failed to get response from model'}`,
        type: 'ASSISTANT',
        timestamp: new Date(),
        isCached: false
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleNewSession = async () => {
    try {
      setLoading(true);
      
      // Create session via backend
      const newSession = await sessionManager.createSession(user['userId']);
      
      // Update sessions list
      const updatedSessions = [newSession, ...sessions];
      setSessions(updatedSessions);
      
      // Switch to new session
      setCurrentSessionId(newSession.sessionId);
      setMessages([]);
    } catch (error) {
      console.error('Failed to create session:', error);
      alert('Failed to create new session. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (!currentSessionId) return;
    console.log("handleClearHistory is being called");
    
    try {
      setLoading(true);
      
      // Clear history via backend
      await sessionManager.clearHistory(currentSessionId);
      
      // Update display
      setMessages([]);
    } catch (error) {
      console.error('Failed to clear history:', error);
      alert('Failed to clear history. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSession = async (sessionId) => {
    try {

      // Delete session via backend
      await sessionManager.deleteSession(user["userId"], sessionId);
      
      // Update sessions list
      const updatedSessions = sessions.filter(s => s.sessionId !== sessionId);
      setSessions(updatedSessions);
      
      // If deleted session was current, switch to another
      if (currentSessionId === sessionId) {
        if (updatedSessions.length > 0) {
          setCurrentSessionId(updatedSessions[0].sessionId);
          await loadSessionMessages(updatedSessions[0].sessionId);
        } else {
          setCurrentSessionId(null);
          setMessages([]);
        }
      }
    } catch (error) {
      console.error('Failed to delete session:', error);
      alert('Failed to delete session. Please try again.');
    }
  };

  const handleSwitchSession = async (sessionId) => {
    setCurrentSessionId(sessionId);
    await loadSessionMessages(sessionId);
  };

  const handleRefreshSessions = async () => {
    try {
      console.log("handleRefreshSessions is being called");
      
      setLoading(true);
      await sessionManager.refreshSessions();
      loadSessions();
    } catch (error) {
      console.error('Failed to refresh sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chat-container">
      {/* Guest Mode Warning */}
      {isGuest && (
        <div style={{
          padding: '1rem',
          backgroundColor: '#fff3cd',
          borderBottom: '1px solid #ffc107',
          color: '#856404',
          fontSize: '0.9rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          justifyContent: 'center'
        }}>
          <span>⚠️</span>
          <span>
            <strong>Guest Mode:</strong> Your chat history is stored locally and will be lost when you close this tab.
          </span>
          <button
            onClick={onShowLogin}
            style={{
              padding: '0.4rem 0.8rem',
              backgroundColor: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: '500',
              whiteSpace: 'nowrap'
            }}
          >
            Sign In to Save
          </button>
        </div>
      )}
      <div className="chat-layout">
        {/* Sidebar */}
        <div className="chat-sidebar">
          <div className="chat-sidebar-header">
            💾 Sessions
            <button 
              className="btn-secondary" 
              onClick={handleRefreshSessions}
              style={{ 
                marginLeft: '0.5rem', 
                fontSize: '0.7rem',
                padding: '0.3rem 0.5rem'
              }}
              title="Refresh sessions from server"
            >
              🔄
            </button>
          </div>
          <div className="session-list">
            {sessions.map((session) => (
              <div
                key={session.sessionId}
                className={`session-item ${session.sessionId === currentSessionId ? 'active' : ''}`}
                onClick={() => handleSwitchSession(session.sessionId)}
              >
                <div style={{ marginBottom: '0.3rem' }}>
                  Session {session.sessionId.slice(-8)}
                </div>
                <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                  {session.messages?.length || 0} messages
                </div>
                <button
                  className="btn-secondary"
                  style={{ 
                    marginTop: '0.3rem', 
                    fontSize: '0.7rem',
                    padding: '0.3rem 0.5rem'
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteSession(session.sessionId);
                  }}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
          <button 
            className="btn-primary" 
            style={{ margin: '1rem', width: 'calc(100% - 2rem)' }}
            onClick={handleNewSession}
            disabled={loading}
          >
            ➕ New Chat
          </button>
        </div>

        {/* Main Chat Area */}
        <div className="chat-main">
          {/* Messages */}
          <div className="messages-area">
            {messages.length === 0 ? (
              <div className="empty-messages">
                👋 Start a conversation by typing a message below...
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.messageId} className={`message ${msg.type.toLowerCase()}`}>
                  <div className="message-content">
                    {msg.content}
                  </div>
                </div>
              ))
            )}
            {loading && (
              <div className="message assistant">
                <div className="message-content">
                  <div className="loading">
                    <div className="spinner"></div>
                    AI is thinking...
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="input-area">
            <div className="input-group">
              <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Type your message..."
                  disabled={loading || !currentSessionId}
                  style={{ flex: 1 }}
                />
                <div className="input-controls">
                  <button 
                    type="submit" 
                    className="btn-primary"
                    disabled={loading || !inputValue.trim() || !currentSessionId}
                  >
                    Send
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatInterface;
