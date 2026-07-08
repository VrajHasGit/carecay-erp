import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebase';

const AuthContext = createContext(null);

// ── Role → access-level mapping (unchanged from original) ──
export const ROLE_ACCESS = {
  Admin: 'admin',
  Partner: 'admin',
  Manager: 'purchase',
  Closer: 'purchase',
  Executive: 'purchase',
  Sales: 'sales',
  Valuator: 'purchase',
  Workshop: 'purchase',
};

// ── Role → route permission groups ──
export const ROUTE_ROLES = {
  // Dashboards — everyone
  dashboard: ['Admin', 'Partner', 'Manager', 'Closer', 'Executive', 'Sales', 'Valuator', 'Workshop'],
  // Purchase pipeline
  purchase: ['Admin', 'Partner', 'Manager', 'Closer', 'Executive', 'Valuator', 'Workshop'],
  // Sales pipeline
  sales: ['Admin', 'Partner', 'Manager', 'Sales'],
  // Admin / Management
  admin: ['Admin', 'Partner', 'Manager'],
};

/**
 * Normalise a loginId to an email.
 *  - If it already contains '@', use as-is
 *  - Otherwise append '@carecay.in'
 */
export function toEmail(loginId) {
  if (!loginId) return '';
  const trimmed = loginId.trim();
  return trimmed.includes('@') ? trimmed : `${trimmed.toLowerCase()}@carecay.in`;
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);   // { id, uid, name, role, branch, lid, email }
  const [authLoading, setAuthLoading] = useState(true);

  // ── Fetch Firestore user profile by UID ──
  const fetchUserProfile = useCallback(async (firebaseUser) => {
    try {
      // First try to find user doc by UID (documents keyed by uid)
      const byUidRef = doc(db, 'users', firebaseUser.uid);
      let snap = await getDoc(byUidRef);

      // Fallback: query by email field
      if (!snap.exists()) {
        const q = query(
          collection(db, 'users'),
          where('email', '==', firebaseUser.email)
        );
        const qSnap = await getDocs(q);
        if (!qSnap.empty) {
          snap = qSnap.docs[0];
        }
      }

      // Second fallback: query by lid (loginId part of email)
      if (!snap.exists || (snap.exists && !snap.exists())) {
        const lid = firebaseUser.email?.split('@')[0] || '';
        const q2 = query(
          collection(db, 'users'),
          where('lid', '==', lid)
        );
        const qSnap2 = await getDocs(q2);
        if (!qSnap2.empty) {
          snap = qSnap2.docs[0];
        }
      }

      if (snap && ((snap.exists && snap.exists()) || snap.data)) {
        const profile = snap.data ? snap.data() : snap.data();
        // Block inactive users
        if (profile.status && profile.status !== 'Active') {
          await signOut(auth);
          return null;
        }
        return {
          id: snap.id || firebaseUser.uid,
          uid: firebaseUser.uid,
          userId: profile.userId || '',
          name: profile.name || firebaseUser.displayName || 'User',
          lid: profile.lid || firebaseUser.email?.split('@')[0] || '',
          role: profile.role || 'Sales',
          branch: profile.branch || 'Head Office',
          email: firebaseUser.email,
        };
      }

      // No profile found — use minimal data from Firebase Auth
      return {
        id: firebaseUser.uid,
        uid: firebaseUser.uid,
        name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
        lid: firebaseUser.email?.split('@')[0] || '',
        role: 'Sales',         // default role
        branch: 'Head Office', // default branch
        email: firebaseUser.email,
      };
    } catch (e) {
      console.error('fetchUserProfile error:', e);
      // Return minimal profile on error so app doesn't crash
      return {
        id: firebaseUser.uid,
        uid: firebaseUser.uid,
        name: firebaseUser.email?.split('@')[0] || 'User',
        lid: firebaseUser.email?.split('@')[0] || '',
        role: 'Sales',
        branch: 'Head Office',
        email: firebaseUser.email,
      };
    }
  }, []);

  // ── Listen for Firebase Auth state changes ──
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const profile = await fetchUserProfile(firebaseUser);
        if (profile) {
          setCurrentUser(profile);
          localStorage.setItem('cc_user', JSON.stringify(profile));
        } else {
          // Inactive user was signed out
          setCurrentUser(null);
          localStorage.removeItem('cc_user');
        }
      } else {
        setCurrentUser(null);
        localStorage.removeItem('cc_user');
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, [fetchUserProfile]);

  // ── Login with Firebase Auth ──
  const login = async (loginId, password, branch) => {
    try {
      const email = toEmail(loginId);
      const credential = await signInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged will handle profile fetch and state update
      // But we need to wait for it and also handle branch override
      const profile = await fetchUserProfile(credential.user);
      if (!profile) {
        return { success: false, error: 'Your account is inactive. Contact admin.' };
      }
      // Override branch if selected during login
      const finalUser = branch ? { ...profile, branch } : profile;
      setCurrentUser(finalUser);
      localStorage.setItem('cc_user', JSON.stringify(finalUser));
      return { success: true, user: finalUser };
    } catch (e) {
      console.error('Login error:', e);
      // Map Firebase Auth error codes to user-friendly messages
      const errorMap = {
        'auth/user-not-found': 'No account found with this Login ID.',
        'auth/wrong-password': 'Incorrect password. Please try again.',
        'auth/invalid-email': 'Invalid Login ID format.',
        'auth/user-disabled': 'This account has been disabled. Contact admin.',
        'auth/too-many-requests': 'Too many failed attempts. Please wait and try again.',
        'auth/invalid-credential': 'Invalid Login ID or Password.',
        'auth/network-request-failed': 'Network error. Check your internet connection.',
      };
      return { success: false, error: errorMap[e.code] || e.message || 'Login failed. Please try again.' };
    }
  };

  // ── Logout ──
  const logout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.error('Logout error:', e);
    }
    setCurrentUser(null);
    localStorage.removeItem('cc_user');
  };

  // ── Role check helpers ──
  const hasRole = useCallback(
    (allowedRoles) => {
      if (!currentUser) return false;
      return allowedRoles.includes(currentUser.role);
    },
    [currentUser]
  );

  const value = { currentUser, authLoading, login, logout, hasRole };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
