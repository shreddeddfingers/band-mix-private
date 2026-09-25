'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole, StudioBranding, BrandPresetKey } from '@/types';
import { DataStore, subscribeToStore, BRAND_PRESETS } from './data-store';
import { isFirebaseConfigured } from './firebase';
import { AuthService } from './auth-service';
import { FirestoreService } from './firestore-service';

interface AuthContextType {
  currentUser: UserProfile | null;
  role: UserRole;
  isAdmin: boolean;
  isStudent: boolean;
  directors: UserProfile[];
  activeDirectorId: string;
  activeBranding: StudioBranding;
  updateStudioBranding: (branding: StudioBranding) => void;
  createDirectorAccount: (data: {
    name: string;
    email: string;
    studioName: string;
    primaryInstrument: any;
    password?: string;
    instruments?: any[];
    musicalStyles?: string[];
    bio?: string;
    avatar?: string;
    branding?: Partial<StudioBranding>;
    presetKey?: BrandPresetKey;
  }) => Promise<UserProfile>;
  signInWithEmailPassword: (email: string, pass: string) => Promise<UserProfile>;
  switchDirector: (directorId: string) => void;
  switchUser: (userId: string) => void;
  switchRole: (role: UserRole, studentId?: string) => void;
  availableUsers: UserProfile[];
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  isFirebaseActive: boolean;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  const num = parseInt(clean, 16);
  if (isNaN(num)) return { r: 245, g: 158, b: 11 };
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

function getContrastTextColor(r: number, g: number, b: number): string {
  // ITU-R BT.709 perceived luminance
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return luminance > 0.55 ? '#020617' : '#ffffff';
}

function applyBrandCssTheme(branding?: StudioBranding) {
  if (typeof document === 'undefined') return;
  const hex = branding?.accentColor || branding?.brandColor || '#F59E0B';
  const { r, g, b } = hexToRgb(hex);

  // Darker shade for hover
  const hoverR = Math.max(0, Math.floor(r * 0.88));
  const hoverG = Math.max(0, Math.floor(g * 0.88));
  const hoverB = Math.max(0, Math.floor(b * 0.88));

  const contrastText = getContrastTextColor(r, g, b);

  const root = document.documentElement;
  root.style.setProperty('--brand-rgb', `${r} ${g} ${b}`);
  root.style.setProperty('--brand-rgb-hover', `${hoverR} ${hoverG} ${hoverB}`);
  root.style.setProperty('--brand-color', hex);
  root.style.setProperty('--brand-hover', `rgb(${hoverR}, ${hoverG}, ${hoverB})`);
  root.style.setProperty('--brand-light', `rgba(${r}, ${g}, ${b}, 0.15)`);
  root.style.setProperty('--brand-surface', `rgba(${r}, ${g}, ${b}, 0.12)`);
  root.style.setProperty('--brand-surface-hover', `rgba(${r}, ${g}, ${b}, 0.2)`);
  root.style.setProperty('--brand-border', `rgba(${r}, ${g}, ${b}, 0.35)`);
  root.style.setProperty('--brand-glow', `0 10px 25px -5px rgba(${r}, ${g}, ${b}, 0.35)`);
  root.style.setProperty('--brand-text', hex);
  root.style.setProperty('--brand-contrast-text', contrastText);
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [availableUsers, setAvailableUsers] = useState<UserProfile[]>([]);
  const [directors, setDirectors] = useState<UserProfile[]>([]);
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
      const allDirectors = DataStore.getDirectors();
      setDirectors(allDirectors);

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

  const switchDirector = (directorId: string) => {
    const director = directors.find((d) => d.id === directorId) || DataStore.getDirector(directorId);
    if (director) {
      setCurrentUser(director);
      DataStore.setDirector(director);
    }
  };

  const createDirectorAccount = async (data: {
    name: string;
    email: string;
    studioName: string;
    primaryInstrument: any;
    password?: string;
    instruments?: any[];
    musicalStyles?: string[];
    bio?: string;
    avatar?: string;
    branding?: Partial<StudioBranding>;
    presetKey?: BrandPresetKey;
  }): Promise<UserProfile> => {
    let authUid: string | undefined;
    if (isFirebaseActive && data.password) {
      try {
        const user = await AuthService.signUpWithEmail(data.email, data.password);
        authUid = user.uid;
      } catch (err: any) {
        if (err?.code === 'auth/email-already-in-use') {
          try {
            const user = await AuthService.signInWithEmail(data.email, data.password);
            authUid = user.uid;
          } catch {
            // continue with local registration
          }
        }
      }
    }

    const newDirector = DataStore.createDirector({
      ...data,
      id: authUid,
    });

    const updatedDirectors = DataStore.getDirectors();
    setDirectors(updatedDirectors);
    setCurrentUser(newDirector);
    DataStore.setDirector(newDirector);
    return newDirector;
  };

  const signInWithEmailPassword = async (email: string, pass: string): Promise<UserProfile> => {
    if (isFirebaseActive) {
      const fbUser = await AuthService.signInWithEmail(email, pass);
      const profile = await AuthService.syncUserProfile(fbUser);
      setCurrentUser(profile);
      return profile;
    } else {
      const allDirs = DataStore.getDirectors();
      const found = allDirs.find((d) => d.email.toLowerCase() === email.toLowerCase());
      if (found) {
        setCurrentUser(found);
        DataStore.setDirector(found);
        return found;
      }
      throw new Error('No director account found with this email.');
    }
  };

  const activeDirectorId =
    currentUser?.role === 'admin'
      ? currentUser.id
      : currentUser?.directorId || 'director-main';

  const [activeBranding, setActiveBranding] = useState<StudioBranding>(BRAND_PRESETS.highland);

  useEffect(() => {
    const refreshBranding = () => {
      const b = DataStore.getStudioBranding(activeDirectorId);
      setActiveBranding(b);
      applyBrandCssTheme(b);
    };
    refreshBranding();
    const unsub = subscribeToStore('branding', refreshBranding);
    return () => unsub();
  }, [activeDirectorId]);

  useEffect(() => {
    applyBrandCssTheme(activeBranding);
  }, [activeBranding]);

  const updateStudioBranding = (branding: StudioBranding) => {
    DataStore.setStudioBranding(activeDirectorId, branding);
    setActiveBranding(branding);
    applyBrandCssTheme(branding);
    if (currentUser?.role === 'admin') {
      setCurrentUser({
        ...currentUser,
        studioName: branding.studioName,
        branding,
      });
    }
  };

  const switchRole = (role: UserRole, studentId?: string) => {
    if (role === 'admin') {
      const director = DataStore.getDirector(activeDirectorId);
      setCurrentUser(director);
    } else {
      const students = DataStore.getStudents(activeDirectorId);
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
        directors,
        activeDirectorId,
        activeBranding,
        updateStudioBranding,
        createDirectorAccount,
        signInWithEmailPassword,
        switchDirector,
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
