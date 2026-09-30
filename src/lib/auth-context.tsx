'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole, StudioBranding, BrandPresetKey } from '@/types';
import { DataStore, subscribeToStore, BRAND_PRESETS } from './data-store';
import { isFirebaseConfigured } from './firebase';
import { AuthService } from './auth-service';
import { FirestoreService } from './firestore-service';

interface AuthContextType {
  currentUser: UserProfile | null;
  isAuthLoading: boolean;
  role: UserRole | 'guest';
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
  loginStudent: (query: string) => Promise<UserProfile>;
  loginDirector: (email: string, password?: string) => Promise<UserProfile>;
  switchDirector: (directorId: string) => void;
  switchUser: (userId: string) => void;
  switchRole: (role: UserRole, studentId?: string) => void;
  availableUsers: UserProfile[];
  updateUserAvatar: (avatarUrl: string, targetUserId?: string) => void;
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
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [availableUsers, setAvailableUsers] = useState<UserProfile[]>([]);
  const [directors, setDirectors] = useState<UserProfile[]>([]);
  const isFirebaseActive = isFirebaseConfigured;

  useEffect(() => {
    // 1. Immediate Session Restoration from persistent storage & cloud fallback
    const restoreSession = async () => {
      try {
        // Priority 1: Instant restoration from cached active profile in localStorage
        const cached = DataStore.getActiveUserProfile();
        if (cached) {
          setCurrentUser(cached);
          setIsAuthLoading(false);
          return;
        }

        // Priority 2: Active user ID lookup
        const activeUserId = DataStore.getActiveUserId();
        if (activeUserId) {
          const localUser = DataStore.getUserById(activeUserId);
          if (localUser) {
            DataStore.setActiveUserProfile(localUser);
            setCurrentUser(localUser);
            setIsAuthLoading(false);
            return;
          }

          // If not cached locally yet, fetch directly from cloud Firestore
          if (isFirebaseActive) {
            try {
              const remoteUser = await FirestoreService.getUser(activeUserId);
              if (remoteUser) {
                DataStore.setActiveUserProfile(remoteUser);
                if (remoteUser.role === 'student') {
                  DataStore.mergeRemoteStudents([remoteUser]);
                } else {
                  DataStore.mergeRemoteDirectors([remoteUser]);
                }
                setCurrentUser(remoteUser);
                setIsAuthLoading(false);
                return;
              }
            } catch (err) {
              console.warn('Failed to fetch active user from Firestore:', err);
            }
          }
        }

        // Priority 3: Studio director fallback for fresh visitors or remembered devices
        const directors = DataStore.getDirectors();
        if (directors.length > 0) {
          const defaultDirector = directors[0];
          DataStore.setActiveUserProfile(defaultDirector);
          setCurrentUser(defaultDirector);
          setIsAuthLoading(false);
          return;
        }
      } catch (err) {
        console.warn('Session restoration error:', err);
      } finally {
        setIsAuthLoading(false);
      }
    };

    restoreSession();

    // If Firebase Auth is configured, subscribe to live auth changes
    let unsubAuth: (() => void) | undefined;
    let unsubRemoteUsers: (() => void) | undefined;
    let unsubRemoteBands: (() => void) | undefined;
    let unsubRemoteInvites: (() => void) | undefined;

    if (isFirebaseActive) {
      unsubAuth = AuthService.onAuthStateChanged(async (firebaseUser) => {
        if (firebaseUser) {
          const profile = await AuthService.syncUserProfile(firebaseUser);
          DataStore.setActiveUserProfile(profile);
          setCurrentUser(profile);
        }
      });

      // Real-time Firestore sync across devices
      try {
        unsubRemoteUsers = FirestoreService.subscribeUsers((remoteUsers) => {
          const remoteStudents = remoteUsers.filter((u) => u.role === 'student');
          const remoteDirectors = remoteUsers.filter((u) => u.role === 'admin');
          DataStore.mergeRemoteStudents(remoteStudents);
          DataStore.mergeRemoteDirectors(remoteDirectors);
        });

        unsubRemoteBands = FirestoreService.subscribeBands((remoteBands) => {
          DataStore.mergeRemoteBands(remoteBands);
        });

        unsubRemoteInvites = FirestoreService.subscribeInvites((remoteInvites) => {
          DataStore.mergeRemoteInvites(remoteInvites);
        });

        // Backfill any offline/unsynced messages, student avatars, and band members from this device to cloud
        DataStore.syncAllPendingMessagesToFirestore().catch(console.warn);
        DataStore.syncLocalStudentsToFirestore().catch(console.warn);
        DataStore.syncLocalBandsToFirestore().catch(console.warn);
      } catch (err) {
        console.warn('Real-time cloud sync subscription failed:', err);
      }
    }

    // Refresh available users from store and keep active session in sync
    const refreshUsers = () => {
      const allDirectors = DataStore.getDirectors();
      setDirectors(allDirectors);
      const all = DataStore.getAllUsers();
      setAvailableUsers(all);

      const activeUserId = DataStore.getActiveUserId();
      if (activeUserId) {
        const found = all.find((u) => u.id === activeUserId);
        if (found) {
          setCurrentUser((prev) => {
            if (
              !prev ||
              prev.id !== found.id ||
              prev.avatar !== found.avatar ||
              prev.name !== found.name ||
              prev.role !== found.role
            ) {
              DataStore.setActiveUserProfile(found);
              return found;
            }
            return prev;
          });
          return;
        }
      } else if (allDirectors.length > 0) {
        // Fallback for clean browser sessions: automatically activate primary studio director
        const primaryDirector = allDirectors[0];
        DataStore.setActiveUserProfile(primaryDirector);
        setCurrentUser(primaryDirector);
        return;
      }

      setCurrentUser((prev) => {
        if (!prev) return null;
        const updated = all.find((u) => u.id === prev.id);
        if (
          updated &&
          (updated.id !== prev.id ||
            updated.avatar !== prev.avatar ||
            updated.name !== prev.name ||
            updated.role !== prev.role)
        ) {
          DataStore.setActiveUserProfile(updated);
          return updated;
        }
        return prev;
      });
    };

    refreshUsers();
    const unsubStudents = subscribeToStore('students', refreshUsers);
    const unsubBands = subscribeToStore('bands', refreshUsers);

    // Re-verify session when tab re-opens or device wakes up from sleep
    const handleVisibilityChange = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        refreshUsers();
        const activeUserId = DataStore.getActiveUserId();
        if (activeUserId && !currentUser) {
          restoreSession();
        }
      }
    };

    window.addEventListener('focus', handleVisibilityChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      unsubAuth?.();
      unsubRemoteUsers?.();
      unsubRemoteBands?.();
      unsubRemoteInvites?.();
      unsubStudents();
      unsubBands();
      window.removeEventListener('focus', handleVisibilityChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isFirebaseActive]);

  const switchUser = (userId: string) => {
    const user = availableUsers.find((u) => u.id === userId) || DataStore.getUserById(userId);
    if (user) {
      DataStore.setActiveUserProfile(user);
      setCurrentUser(user);
    }
  };

  const switchDirector = (directorId: string) => {
    const director = directors.find((d) => d.id === directorId) || DataStore.getDirector(directorId);
    if (director) {
      DataStore.setActiveUserProfile(director);
      setCurrentUser(director);
      DataStore.setDirector(director);
    }
  };

  const loginStudent = async (query: string): Promise<UserProfile> => {
    // 1. Try local data store first
    let student = DataStore.findStudentByEmailOrName(query);

    // 2. If not found locally, query remote Firestore
    if (!student && isFirebaseConfigured) {
      try {
        student = await FirestoreService.findStudentByEmailOrName(query);
        if (student) {
          DataStore.mergeRemoteStudents([student]);
        }
      } catch (fsErr) {
        console.warn('Firestore student lookup error:', fsErr);
      }
    }

    if (!student) {
      throw new Error(
        `No student musician profile found for "${query}". Please check your spelling or register via a student intake pass.`
      );
    }

    // 3. Immediately pull all bands from Firestore so the student has their assigned bands on this device
    if (isFirebaseConfigured) {
      try {
        const remoteBands = await FirestoreService.getBands();
        if (remoteBands && remoteBands.length > 0) {
          DataStore.mergeRemoteBands(remoteBands);
        }
      } catch (err) {
        console.warn('Error fetching remote bands during student login:', err);
      }
    }

    DataStore.setActiveUserProfile(student);
    setCurrentUser(student);
    return student;
  };

  const loginDirector = async (
    email: string,
    password?: string
  ): Promise<UserProfile> => {
    // 1. If Firebase Auth is configured and password provided, try Firebase Auth first
    if (isFirebaseActive && password) {
      try {
        const fbUser = await AuthService.signInWithEmail(email, password);
        const profile = await AuthService.syncUserProfile(fbUser);
        DataStore.setActiveUserProfile(profile);
        DataStore.setDirector(profile);
        setCurrentUser(profile);
        return profile;
      } catch (authErr: any) {
        console.warn(
          'Firebase Auth sign-in failed or Email/Password provider unconfigured, falling back to direct studio profile lookup:',
          authErr?.code || authErr?.message || authErr
        );
      }
    }

    // 2. Query local DataStore
    let director = DataStore.findDirectorByEmail(email);

    // 3. Query remote Firestore
    if (!director && isFirebaseConfigured) {
      try {
        director = await FirestoreService.findDirectorByEmail(email);
        if (director) {
          DataStore.mergeRemoteDirectors([director]);
        }
      } catch (fsErr) {
        console.warn('Firestore director lookup error:', fsErr);
      }
    }

    // 4. Default director fallback
    if (!director) {
      const defaultDir = DataStore.getDirector();
      if (
        defaultDir.email.toLowerCase() === email.trim().toLowerCase() ||
        defaultDir.name.toLowerCase() === email.trim().toLowerCase()
      ) {
        director = defaultDir;
      }
    }

    // 5. Partial match or case-insensitive match on all directors
    if (!director) {
      const allDirs = DataStore.getDirectors();
      const match = allDirs.find(
        (d) =>
          d.email.toLowerCase().includes(email.trim().toLowerCase()) ||
          d.name.toLowerCase().includes(email.trim().toLowerCase()) ||
          email.trim().toLowerCase().includes(d.name.toLowerCase())
      );
      if (match) {
        director = match;
      }
    }

    if (!director) {
      throw new Error(
        `No Band Director account found for "${email}". Please verify your email or register a new director profile.`
      );
    }

    DataStore.setActiveUserProfile(director);
    DataStore.setDirector(director);
    setCurrentUser(director);
    return director;
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
        console.warn(
          'Firebase Auth signUp skipped/failed (continuing with Firestore & local):',
          err?.code || err?.message || err
        );
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
    DataStore.setActiveUserProfile(newDirector);
    setCurrentUser(newDirector);
    DataStore.setDirector(newDirector);
    return newDirector;
  };

  const signInWithEmailPassword = async (email: string, pass: string): Promise<UserProfile> => {
    return loginDirector(email, pass);
  };

  const activeDirectorId =
    currentUser?.role === 'admin'
      ? currentUser.id
      : currentUser?.directorId || (directors.length > 0 ? directors[0].id : 'director-main');

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
      const updated = {
        ...currentUser,
        studioName: branding.studioName,
        branding,
      };
      DataStore.setActiveUserProfile(updated);
      setCurrentUser(updated);
    }
  };

  const switchRole = (role: UserRole, studentId?: string) => {
    if (role === 'admin') {
      const director = DataStore.getDirector(activeDirectorId);
      DataStore.setActiveUserProfile(director);
      setCurrentUser(director);
    } else {
      const students = DataStore.getStudents(activeDirectorId);
      if (studentId) {
        const found = students.find((s) => s.id === studentId);
        if (found) {
          DataStore.setActiveUserProfile(found);
          setCurrentUser(found);
          return;
        }
      }
      if (students.length > 0) {
        DataStore.setActiveUserProfile(students[0]);
        setCurrentUser(students[0]);
      }
    }
  };

  const signInWithGoogle = async () => {
    if (isFirebaseActive) {
      const fbUser = await AuthService.signInWithGoogle();
      const profile = await AuthService.syncUserProfile(fbUser);
      DataStore.setActiveUserProfile(profile);
      setCurrentUser(profile);
    }
  };

  const signOut = async () => {
    if (isFirebaseActive) {
      try {
        await AuthService.signOut();
      } catch (err) {
        console.warn('Firebase signOut error:', err);
      }
    }
    DataStore.setActiveUserProfile(null);
    setCurrentUser(null);
  };

  const updateUserAvatar = (avatarUrl: string, targetUserId?: string) => {
    const uid = currentUser?.id;
    if (!uid) return;
    if (targetUserId && targetUserId !== uid) {
      console.warn('[Security] Unauthorized: Users may only change their own profile picture.');
      return;
    }
    DataStore.updateUserAvatar(uid, avatarUrl);
    setCurrentUser((prev) => (prev ? { ...prev, avatar: avatarUrl } : prev));
  };

  const role: UserRole | 'guest' = currentUser?.role || 'guest';
  const isAdmin = currentUser?.role === 'admin';
  const isStudent = currentUser?.role === 'student';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthLoading,
        role,
        isAdmin,
        isStudent,
        directors,
        activeDirectorId,
        activeBranding,
        updateStudioBranding,
        createDirectorAccount,
        signInWithEmailPassword,
        loginStudent,
        loginDirector,
        switchDirector,
        switchUser,
        switchRole,
        availableUsers,
        updateUserAvatar,
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
