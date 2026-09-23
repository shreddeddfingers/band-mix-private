'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '@/types';
import { DataStore, subscribeToStore } from './data-store';
import { isFirebaseConfigured } from './firebase';
import { AuthService } from './auth-service';
import { FirestoreService } from './firestore-service';

interface AuthContextType {
  currentUser: UserProfile | null;
  role: UserRole;
  isAdmin: boolean;
  isStudent: boolean;
  switchUser: (userId: string) => void;
  switchRole: (role: UserRole, studentId?: string) => void;
  availableUsers: UserProfile[];
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  isFirebaseActive: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [availableUsers, setAvailableUsers] = useState<UserProfile[]>([]);
  const isFirebaseActive = isFirebaseConfigured;

  useEffect(() => {
    // If Firebase Auth is configured, subscribe to live auth changes
    let unsubAuth: (() => void) | undefined;

    if (isFirebaseActive) {
      unsubAuth = AuthService.onAuthStateChanged(async (firebaseUser) => {
        if (firebaseUser) {
          const profile = await AuthService.syncUserProfile(firebaseUser);
          setCurrentUser(profile);
        } else {
          // If logged out from Firebase, default to local director
          const director = DataStore.getDirector();
          setCurrentUser(director);
        }
      });
    }

    // Refresh available users from store
    const refreshUsers = async () => {
      if (isFirebaseActive) {
        try {
          const remoteUsers = await FirestoreService.getAllUsers();
          if (remoteUsers.length > 0) {
            setAvailableUsers(remoteUsers);
            return;
          }
        } catch {
          // Fall back to local store
        }
      }

      const all = DataStore.getAllUsers();
      setAvailableUsers(all);
      if (!currentUser) {
        const director = DataStore.getDirector();
        setCurrentUser(director);
      } else {
        const updated = all.find((u) => u.id === currentUser.id);
        if (updated) setCurrentUser(updated);
      }
    };

    refreshUsers();
    const unsubStudents = subscribeToStore('students', refreshUsers);
    const unsubBands = subscribeToStore('bands', refreshUsers);

    return () => {
      unsubAuth?.();
      unsubStudents();
      unsubBands();
    };
  }, [isFirebaseActive]);

  const switchUser = (userId: string) => {
    const user = availableUsers.find((u) => u.id === userId);
    if (user) {
      setCurrentUser(user);
    }
  };

  const switchRole = (role: UserRole, studentId?: string) => {
    if (role === 'admin') {
      const director = DataStore.getDirector();
      setCurrentUser(director);
    } else {
      const students = DataStore.getStudents();
      if (studentId) {
        const found = students.find((s) => s.id === studentId);
        if (found) {
          setCurrentUser(found);
          return;
        }
      }
      if (students.length > 0) {
        setCurrentUser(students[0]);
      }
    }
  };

  const signInWithGoogle = async () => {
    if (isFirebaseActive) {
      const fbUser = await AuthService.signInWithGoogle();
      const profile = await AuthService.syncUserProfile(fbUser);
      setCurrentUser(profile);
    }
  };

  const signOut = async () => {
    if (isFirebaseActive) {
      await AuthService.signOut();
    }
    const director = DataStore.getDirector();
    setCurrentUser(director);
  };

  const role = currentUser?.role || 'admin';
  const isAdmin = role === 'admin';
  const isStudent = role === 'student';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        role,
        isAdmin,
        isStudent,
        switchUser,
        switchRole,
        availableUsers,
        signInWithGoogle,
        signOut,
        isFirebaseActive,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
