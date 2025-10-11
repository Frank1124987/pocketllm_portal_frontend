/**
 * Authentication Service
 * Handles all Firebase authentication operations
 */

import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence
} from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';

export class AuthService {
  constructor() {
    this.currentUser = null;
    this.authStateCallbacks = [];
  }

  /**
   * Initialize auth state listener
   */
  initialize() {
    return new Promise((resolve) => {
      onAuthStateChanged(auth, async (user) => {
        this.currentUser = user;
        
        // Notify all callbacks
        for (const callback of this.authStateCallbacks) {
          callback(user);
        }
        
        resolve(user);
      });
    });
  }

  /**
   * Subscribe to auth state changes
   */
  onAuthStateChange(callback) {
    this.authStateCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      this.authStateCallbacks = this.authStateCallbacks.filter(cb => cb !== callback);
    };
  }

  /**
   * Sign in with Google
   * @param {boolean} rememberMe - If true, persists auth state across browser sessions
   */
  async signInWithGoogle(rememberMe = true) {
    try {
      // Set persistence based on rememberMe
      await setPersistence(
        auth, 
        rememberMe ? browserLocalPersistence : browserSessionPersistence
      );
      
      // Sign in with Google popup
      const result = await signInWithPopup(auth, googleProvider);
      
      // Get ID token
      const idToken = await result.user.getIdToken();
      
      return {
        user: {
          uid: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName,
          photoURL: result.user.photoURL
        },
        idToken
      };
    } catch (error) {
      console.error('Google sign-in error:', error);
      throw this._handleAuthError(error);
    }
  }

  /**
   * Continue as guest (no authentication)
   */
  async continueAsGuest() {
    // Set session persistence for guest
    await setPersistence(auth, browserSessionPersistence);
    
    // Generate a temporary guest ID
    const guestId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      user: {
        uid: guestId,
        email: 'guest@pocketllm.local',
        displayName: 'Guest User',
        photoURL: null,
        isGuest: true
      },
      idToken: null // No token for guest users
    };
  }

  /**
   * Sign out
   */
  async signOut() {
    try {
      await signOut(auth);
      this.currentUser = null;
      
      // Clear any guest data from localStorage
      localStorage.removeItem('guestUser');
      localStorage.removeItem('guestSessions');
      
      return true;
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }

  /**
   * Get current user
   */
  getCurrentUser() {
    return this.currentUser;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return this.currentUser !== null;
  }

  /**
   * Get ID token for current user
   */
  async getIdToken(forceRefresh = false) {
    if (!this.currentUser) {
      return null;
    }
    
    try {
      return await this.currentUser.getIdToken(forceRefresh);
    } catch (error) {
      console.error('Error getting ID token:', error);
      return null;
    }
  }

  /**
   * Refresh ID token
   */
  async refreshIdToken() {
    return await this.getIdToken(true);
  }

  /**
   * Handle Firebase auth errors
   * @private
   */
  _handleAuthError(error) {
    const errorMessages = {
      'auth/popup-closed-by-user': 'Sign-in popup was closed. Please try again.',
      'auth/cancelled-popup-request': 'Sign-in was cancelled.',
      'auth/popup-blocked': 'Sign-in popup was blocked by your browser. Please allow popups for this site.',
      'auth/network-request-failed': 'Network error. Please check your internet connection.',
      'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
      'auth/user-disabled': 'This account has been disabled.',
      'auth/operation-not-allowed': 'Google sign-in is not enabled. Please contact support.'
    };

    return new Error(errorMessages[error.code] || error.message);
  }
}

export default AuthService;
