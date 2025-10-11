# Firebase OAuth Authentication Setup Guide

This guide will help you set up Firebase Authentication with Google OAuth for the PocketLLM Portal.

## Overview

The application now supports two authentication modes:
- **Authenticated Users**: Login with Google via Firebase Auth. Chat history is saved to Firebase and persists across devices.
- **Guest Users**: Use the app without authentication. Chat history is stored in browser localStorage and is lost on page refresh.

## Prerequisites

- A Google account
- Node.js and npm installed
- Firebase CLI (optional, but recommended)

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Add project" or select an existing project
3. Enter a project name (e.g., "pocketllm-portal")
4. (Optional) Enable Google Analytics
5. Click "Create project"

## Step 2: Enable Google Authentication

1. In your Firebase project, navigate to **Build** > **Authentication**
2. Click "Get started" if this is your first time
3. Go to the **Sign-in method** tab
4. Click on **Google** in the providers list
5. Toggle the **Enable** switch
6. Set a public-facing name for your project (e.g., "PocketLLM Portal")
7. Choose a support email (your email)
8. Click **Save**

## Step 3: Register Your Web App

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Scroll down to "Your apps" section
3. Click the **</>** (Web) icon to add a web app
4. Enter an app nickname (e.g., "PocketLLM Web")
5. (Optional) Check "Also set up Firebase Hosting" if you plan to deploy with Firebase
6. Click **Register app**
7. You'll see a `firebaseConfig` object - keep this page open!

## Step 4: Configure Environment Variables

1. In the project root, copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Open `.env` and fill in your Firebase configuration values:
   ```env
   # From the firebaseConfig object:
   REACT_APP_FIREBASE_API_KEY=AIza...
   REACT_APP_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
   REACT_APP_FIREBASE_PROJECT_ID=your-project-id
   REACT_APP_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
   REACT_APP_FIREBASE_APP_ID=1:123456789:web:abc123
   
   # Backend API URL
   REACT_APP_API_URL=http://localhost:5001/api/v1
   ```

3. **Important**: Never commit `.env` to version control! It's already in `.gitignore`.

## Step 5: Install Dependencies

```bash
npm install
```

This will install the Firebase SDK and all other required dependencies.

## Step 6: Configure Authorized Domains

For Google OAuth to work in development and production:

1. In Firebase Console, go to **Authentication** > **Settings** > **Authorized domains**
2. By default, `localhost` is already authorized for development
3. For production, add your deployed domain (e.g., `your-app.web.app` or your custom domain)

## Step 7: Test Authentication

1. Start your development server:
   ```bash
   npm start
   ```

2. Navigate to `http://localhost:3000`

3. You should see the login page with two options:
   - **Sign in with Google** - Opens Google OAuth popup
   - **Continue as Guest** - Enter without authentication

4. Try signing in with Google:
   - Click "Sign in with Google"
   - Select your Google account
   - Grant permissions
   - You should be redirected to the chat interface

## Architecture Overview

### Frontend Components

1. **AuthService** (`src/services/AuthService.js`)
   - Handles Firebase Authentication
   - Manages Google OAuth flow
   - Provides guest mode functionality
   - Manages auth state persistence

2. **Login Component** (`src/components/Login.js`)
   - UI for Google sign-in and guest mode
   - Handles authentication errors
   - Manages "Remember Me" functionality

3. **APIService** (`src/services/APIService.js`)
   - Includes ID token in all backend requests
   - Automatically refreshes tokens
   - Handles authentication headers

4. **SessionManager** (`src/services/SessionManager.js`)
   - Manages chat sessions for both authenticated and guest users
   - Authenticated: Sessions stored in Firebase via backend
   - Guest: Sessions stored in browser localStorage

### Authentication Flow

#### Authenticated User Flow:
```
1. User clicks "Sign in with Google"
2. Firebase OAuth popup opens
3. User authenticates with Google
4. Firebase returns user info + ID token
5. Frontend sends ID token to backend /auth/login
6. Backend verifies token with Firebase Admin SDK
7. Backend returns user profile and sessions
8. Frontend stores token and initializes SessionManager
9. All subsequent API requests include token in Authorization header
```

#### Guest User Flow:
```
1. User clicks "Continue as Guest"
2. Generate temporary guest ID
3. Store guest info in localStorage
4. Initialize SessionManager in guest mode
5. Sessions stored locally (not sent to backend)
6. Data lost on browser tab close
```

### Token Management

- ID tokens are automatically included in all API requests via the `Authorization` header
- Tokens are refreshed every 50 minutes (expire after 1 hour)
- On token refresh failure, user is prompted to re-authenticate

## Backend Integration

Your backend must implement these endpoints:

### Required Endpoints:

1. **POST /api/v1/auth/login**
   ```json
   Request: { "idToken": "firebase-id-token" }
   Response: { "user": {...}, "sessions": [...] }
   ```
   - Verify token using Firebase Admin SDK
   - Create/update user in your database
   - Return user profile and sessions

2. **POST /api/v1/auth/verify**
   ```json
   Request: { "idToken": "firebase-id-token" }
   Response: { "valid": true, "user": {...} }
   ```
   - Verify token is still valid

3. **GET /api/v1/auth/profile**
   ```
   Headers: { "Authorization": "Bearer <token>" }
   Response: { "user": {...} }
   ```
   - Return current user profile

4. **POST /api/v1/auth/logout**
   ```
   Headers: { "Authorization": "Bearer <token>" }
   Response: { "success": true }
   ```
   - Clean up any server-side session data

### Backend Token Verification (Python Example):

```python
from firebase_admin import auth, initialize_app

# Initialize Firebase Admin SDK
initialize_app()

def verify_firebase_token(id_token):
    try:
        # Verify the token
        decoded_token = auth.verify_id_token(id_token)
        uid = decoded_token['uid']
        email = decoded_token.get('email')
        
        return {
            'valid': True,
            'uid': uid,
            'email': email
        }
    except Exception as e:
        return {'valid': False, 'error': str(e)}
```

## Security Best Practices

1. **Never expose Firebase config in client code** - It's safe to include in frontend as it's protected by Firebase security rules
2. **Always verify tokens on the backend** - Never trust client-provided user IDs
3. **Use Firebase Admin SDK** on backend to verify tokens
4. **Set up Firestore security rules** to protect user data
5. **Implement rate limiting** on authentication endpoints
6. **Use HTTPS** in production

## Troubleshooting

### "Firebase: Error (auth/unauthorized-domain)"
- Add your domain to authorized domains in Firebase Console

### "Popup blocked by browser"
- Allow popups for your site
- Or use `signInWithRedirect()` instead of `signInWithPopup()`

### "Token expired or invalid"
- Tokens expire after 1 hour
- Frontend auto-refreshes, but ensure your backend handles 401 errors gracefully

### "Cannot read properties of undefined (reading 'getIdToken')"
- Wait for Firebase to initialize before making auth calls
- Use the `initialize()` method in AuthService

### Guest mode data lost unexpectedly
- Guest sessions are stored in localStorage (sessionStorage would be more appropriate for "lost on tab close")
- Browser privacy settings may clear localStorage
- Consider updating to use sessionStorage for true ephemeral storage

## Testing

### Test Authenticated Login:
1. Clear browser cache and localStorage
2. Start fresh on login page
3. Sign in with Google
4. Verify sessions load from backend
5. Create a new chat session
6. Refresh page - sessions should persist

### Test Guest Mode:
1. Log out if authenticated
2. Click "Continue as Guest"
3. Create a chat session
4. Messages should appear immediately
5. Refresh page - data should be gone (or persist if using localStorage)

### Test Token Refresh:
1. Sign in with Google
2. Wait 50+ minutes (or modify refresh interval for testing)
3. Token should refresh automatically
4. API requests should continue working

## Production Deployment

Before deploying to production:

1. Update `.env` with production values
2. Add production domain to Firebase authorized domains
3. Enable Firebase Security Rules in Firestore
4. Set up proper error monitoring (Sentry, LogRocket, etc.)
5. Implement rate limiting on backend
6. Use environment-specific Firebase projects (dev/staging/prod)

## Additional Resources

- [Firebase Authentication Docs](https://firebase.google.com/docs/auth)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)
- [React Firebase Hooks](https://github.com/CSFrequency/react-firebase-hooks)

## Support

If you encounter issues:
1. Check Firebase Console for errors
2. Check browser console for error messages
3. Verify all environment variables are set correctly
4. Ensure backend is running and accessible
5. Check Firebase project settings match your configuration
