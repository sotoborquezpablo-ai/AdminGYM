/**
 * src/context/AuthContext.tsx
 * Authentication context using React Context API and useReducer.
 */

import React, { createContext, useReducer, useContext, useEffect, useCallback } from 'react';
import { Profile } from '../types';
import { mockProfiles } from '../lib/mock-data';
import { authenticateUser } from '../lib/mock-auth';

// --- State Types ---
type AuthState = {
  currentUser: Profile | null;
  isLoading: boolean;
  error: string | null;
};

// --- Reducer ---
const authReducer = (state: AuthState, action: { type: string; payload?: any }): AuthState => {
  switch (action.type) {
    case 'LOGIN_SUCCESS':
      return {
        currentUser: action.payload.profile,
        isLoading: false,
        error: null,
      };
    case 'LOGIN_FAILURE':
      return {
        currentUser: null,
        isLoading: false,
        error: action.payload.error || 'An unknown error occurred.',
      };
    case 'LOGOUT':
      return {
        currentUser: null,
        isLoading: false,
        error: null,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
};

// --- Context Initialization ---
const AuthContext = createContext<any>(null);

const AUTH_STORAGE_KEY = 'gymmanager-auth';

// --- Provider Component ---
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Initialization: Read from localStorage on mount
  const [state, dispatch] = useReducer(authReducer, {
    currentUser: null,
    isLoading: true, // Start as loading to check storage
    error: null,
  });

  useEffect(() => {
    // Check local storage first
    const storedProfileId = localStorage.getItem(AUTH_STORAGE_KEY);
    if (storedProfileId) {
      // Simulate loading the profile data (as if it came from an API)
      const profile = mockProfiles.find(p => p.id === storedProfileId);
      if (profile) {
        // Set initial state directly if found in storage
        dispatch({ type: 'LOGIN_SUCCESS', payload: { profile } });
      } else {
        // Profile ID found, but profile data is missing/stale
        dispatch({ type: 'LOGIN_FAILURE', payload: { error: 'Profile data corrupted or missing.' } });
      }
    } else {
      // No stored session, remain in loading state until login attempt
      dispatch({ type: 'LOGIN_SUCCESS', payload: { profile: null } }); // Resetting to initial state placeholder
    }
    // In a real app, this would be coupled with fetching all necessary mock data.
  }, []);

  // --- Actions ---
  const login = useCallback((email: string, password: string) => {
    dispatch({ type: 'LOGIN_FAILURE', payload: { error: null } }); // Clear previous errors
    dispatch({ type: 'LOGIN_SUCCESS', payload: { profile: null } }); // Set loading for the purpose of setTimeout simulation

    // Simulate async API call delay
    const timeoutId = setTimeout(() => {
      const profile = authenticateUser(email, password);
      if (profile) {
        // Success: Store profileId and update state
        localStorage.setItem(AUTH_STORAGE_KEY, profile.id);
        dispatch({ type: 'LOGIN_SUCCESS', payload: { profile } });
      } else {
        // Failure
        dispatch({ type: 'LOGIN_FAILURE', payload: { error: 'Credenciales incorrectas' } });
      }
    }, 800);

    // Return a cleanup function for the timeout (good practice but not required by prompt)
    return () => clearTimeout(timeoutId);
  }, []);

  const logout = useCallback(() => {
    // 1. Clear local storage
    localStorage.removeItem(AUTH_STORAGE_KEY);
    // 2. Reset state
    dispatch({ type: 'LOGOUT' });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  const value = {
    currentUser: state.currentUser,
    isLoading: state.isLoading,
    error: state.error,
    login,
    logout,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// --- Hook ---
export const useAuth = (): { currentUser: Profile | null; isLoading: boolean; error: string | null; login: (email: string, password: string) => void; logout: () => void; clearError: () => void } => {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  // Type assertion for cleaner usage, since the context value is complex
  return context as any;
};
