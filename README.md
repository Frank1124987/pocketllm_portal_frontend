# PocketLLM Portal

A lightweight, CPU-friendly LLM (Large Language Model) web application designed to run inference on budget hardware with built-in caching, session management, and admin controls.

## Project Overview

PocketLLM Portal is a React-based frontend application that demonstrates the architecture and requirements outlined in the CSCI 578 Software Architectures course assignment. The system showcases:

- **Chat Interface & Interaction** (FR1)
- **Session & History Management** (FR2)
- **Model Serving & Inference** (FR3)
- **Response Caching** (FR4)
- **Admin Console** (FR5)
- **Developer API Access** (FR6)
- **Model Management** (FR7)
- **Telemetry & Logging** (FR8)

## Project Structure

```
src/
├── components/
│   ├── ChatInterface.js       # Main chat UI with message history
│   ├── AdminConsole.js        # Admin dashboard for system monitoring
│   ├── DeveloperAPI.js        # API documentation and examples
│   └── Navigation.js          # Top navigation bar
├── services/
│   ├── SessionManager.js      # Session lifecycle management
│   ├── APIService.js          # API communication and inference
│   ├── CacheManager.js        # Response caching with TTL
│   ├── ModelManager.js        # LLM model configuration
│   └── TelemetryService.js    # Logging and monitoring
├── App.js                     # Main application component
├── App.css                    # Application styling
└── index.js                   # React entry point
```

## Functional Requirements Implementation

### FR1: Chat Interface & Interaction
- **Location**: `components/ChatInterface.js`
- **Features**:
  - Real-time message input with form submission
  - Animated message display
  - Typing indicator during model inference
  - Responsive chat layout with sidebar

### FR2: Session & History Management
- **Location**: `services/SessionManager.js`, `components/ChatInterface.js`
- **Features**:
  - Create multiple chat sessions
  - Persistent session list in sidebar
  - Clear conversation history
  - Delete sessions
  - View message count per session

### FR3: Model Serving & Inference
- **Location**: `services/APIService.js`
- **Features**:
  - Simulated inference engine (production would use actual model backend)
  - Request/response handling
  - Error handling and recovery

### FR4: Response Caching
- **Location**: `services/CacheManager.js`, `services/APIService.js`
- **Features**:
  - Cache-aside pattern implementation
  - TTL (Time-To-Live) configuration
  - Configurable cache size (max 500MB default)
  - Cache hit/miss tracking
  - Automatic expiration of stale entries

### FR5: Admin Console
- **Location**: `components/AdminConsole.js`
- **Features**:
  - Real-time system metrics (CPU, Memory, Active Sessions)
  - Cache statistics and configuration
  - Model management and reloading
  - System logs viewer
  - Health status monitoring
  - Auto-refresh toggle

### FR6: Developer API Access
- **Location**: `components/DeveloperAPI.js`
- **Features**:
  - API key generation and display
  - Complete API documentation
  - 6 documented endpoints:
    - POST /api/v1/inference
    - POST /api/v1/sessions
    - GET /api/v1/sessions/{sessionId}/messages
    - GET /api/v1/health
    - DELETE /api/v1/sessions/{sessionId}
    - POST /api/v1/cache/clear
  - Rate limiting documentation
  - Error codes reference
  - Code examples (Python, JavaScript)

### FR7: Model Management
- **Location**: `services/ModelManager.js`
- **Features**:
  - Support for multiple quantized models:
    - TinyLLaMA 1.1B
    - Phi-2 2.7B
    - Mistral 7B Mini
  - Model loading/unloading
  - Memory requirement validation
  - Resource recommendations
  - Model capabilities description

### FR8: Telemetry & Logging
- **Location**: `services/TelemetryService.js`, `services/APIService.js`
- **Features**:
  - Structured logging (DEBUG, INFO, WARN, ERROR)
  - Inference request tracking
  - Admin action audit trail
  - System metrics recording
  - Performance monitoring
  - Report generation

## Non-Functional Requirements Implementation

### NFR1: Performance
- Model inference latency ≤ 5 seconds (simulated)
- API response time ≤ 500ms
- Support for 10+ concurrent chat sessions via session manager

### NFR2: Resource Efficiency
- In-memory cache with configurable size limits
- Memory-conscious data structures
- Efficient message storage and retrieval

### NFR3: Scalability
- Stateless API design
- Session-based architecture supporting multiple concurrent users
- Horizontal scaling ready (frontend framework-agnostic)

### NFR4: Availability & Reliability
- Error handling and recovery mechanisms
- Graceful degradation
- Request retry logic

### NFR5: Security
- API key authentication simulation
- User session isolation
- Input validation framework
- Admin console protection (in production)

### NFR6: Maintainability & Extensibility
- Modular service architecture
- Clear separation of concerns
- Pluggable cache backend design
- Framework-agnostic frontend (pure React, no vendor lock-in)

### NFR7: Usability
- Intuitive chat interface
- Real-time feedback (loading indicators)
- Clear admin dashboard
- Developer-friendly API documentation

### NFR8: Portability
- Pure React application (no platform-specific dependencies)
- Docker-ready deployment
- Cross-browser compatible

## Services Documentation

### SessionManager
Manages user sessions and conversation history.

```javascript
const sessionManager = new SessionManager();
const session = sessionManager.createSession('user_123');
sessionManager.addMessage(session.sessionId, message);
sessionManager.clearHistory(session.sessionId);
sessionManager.deleteSession(session.sessionId);
```

### APIService
Handles all backend communication and inference requests.

```javascript
const apiService = new APIService();
const response = await apiService.sendInferenceRequest(
  sessionId,
  'What is AI?',
  { temperature: 0.7, maxTokens: 256 }
);
```

### CacheManager
Manages response caching with TTL and size limits.

```javascript
const cache = new CacheManager(500, 3600); // 500MB, 1 hour TTL
cache.put('prompt', 'response');
const cached = cache.get('prompt');
cache.clear();
```

### ModelManager
Manages LLM model configuration and loading.

```javascript
const modelManager = new ModelManager();
await modelManager.loadModel('tinyllama-1.1b');
const recommendations = modelManager.getRecommendations(8192); // 8GB RAM
```

### TelemetryService
Handles logging and performance monitoring.

```javascript
const telemetry = new TelemetryService();
telemetry.log('INFO', 'SYSTEM', 'Application started');
telemetry.logInferenceRequest(sessionId, prompt, response, latency, isCached);
const report = telemetry.generateReport();
```

## Running the Application

### Prerequisites
- Node.js 14+
- npm or yarn

### Installation

```bash
cd pocketllm_portal
npm install
```

### Development

```bash
npm start
```

The application will open at `http://localhost:3000`

### Build

```bash
npm run build
```

### Testing

```bash
npm test
```

## Architecture Overview

### Component Architecture
1. **Navigation** - Tab-based view switching (Chat, Admin, API)
2. **ChatInterface** - Main user-facing chat UI
3. **AdminConsole** - System monitoring and management
4. **DeveloperAPI** - API documentation

### Service Layer Architecture
- **SessionManager** - Session lifecycle
- **APIService** - Backend communication
- **CacheManager** - Response caching
- **ModelManager** - Model configuration
- **TelemetryService** - Monitoring & logging

### Data Flow
1. User enters prompt in ChatInterface
2. APIService checks cache (CacheManager)
3. If cache miss, simulates inference
4. Response cached for future requests
5. TelemetryService logs the request
6. AdminConsole displays metrics in real-time

## Key Features

### 🎯 Chat Interface
- Clean, intuitive design
- Real-time message display
- Session management sidebar
- Message history with timestamps
- Loading indicators for inference

### ⚙️ Admin Console
- Real-time system metrics
- Cache configuration controls
- Model management
- System logs viewer
- Health status monitoring
- Auto-refresh capability

### 🔌 Developer API
- Complete API documentation
- API key management
- 6 REST endpoints
- Rate limiting info
- Error codes reference
- Python & JavaScript examples

### 💾 Caching System
- Cache-aside pattern
- Configurable TTL
- Size-limited LRU eviction
- Hit/miss statistics
- Cache invalidation controls

### 📊 Monitoring
- CPU & Memory usage tracking
- Session statistics
- Cache performance metrics
- Request telemetry
- Error logging
- Health status

## UML Diagrams

The architecture is designed according to UML specifications:

1. **Component Diagram** - Shows layered architecture
2. **Class Diagram** - Domain models and services
3. **Sequence Diagram** - Chat interaction flow
4. **Deployment Diagram** - Docker containerized deployment
5. **State Diagram** - Inference request lifecycle

See the requirements document for detailed UML diagrams.

## Future Enhancements

1. **Backend Integration**
   - Connect to actual LLM inference server
   - Real model loading and execution
   - Persistent database for sessions

2. **Advanced Features**
   - Batch inference requests
   - Model fine-tuning pipeline
   - Multi-user support with authentication
   - Session persistence

3. **Performance**
   - Response streaming
   - WebSocket support
   - Server-side caching layer

4. **Security**
   - JWT token authentication
   - Rate limiting enforcement
   - Input sanitization
   - Admin role-based access

## Contributing

This project is part of CSCI 578 assignment. Please refer to the assignment requirements for contribution guidelines.

## License

Educational use only - CSCI 578 Software Architectures Course

## References

- Assignment: USC CSCI 578 - Fall 2025 - Assignment #2
- Models: HuggingFace, llama.cpp, TinyLLaMA
- Framework: React 19.2.0
