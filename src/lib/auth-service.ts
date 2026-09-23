import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  User,
} from 'firebase/auth';
import { auth } from './firebase';
import { FirestoreService } from './firestore-service';
import { UserProfile, UserRole } from '@/types';

const googleProvider = new GoogleAuthProvider();

export const AuthService = {
  // Sign in with Google
  async signInWithGoogle(): Promise<User> {
    if (!auth) throw new Error('Firebase Auth is not initialized');
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  },

  // Sign up with Email/Password
  async signUpWithEmail(email: string, pass: string): Promise<User> {
    if (!auth) throw new Error('Firebase Auth is not initialized');
    const result = await createUserWithEmailAndPassword(auth, email, pass);
    return result.user;
  },

  // Sign in with Email/Password
  async signInWithEmail(email: string, pass: string): Promise<User> {
    if (!auth) throw new Error('Firebase Auth is not initialized');
    const result = await signInWithEmailAndPassword(auth, email, pass);
    return result.user;
  },

  // Sign out
  async signOut(): Promise<void> {
    if (!auth) return;
    await firebaseSignOut(auth);
  },

  // Auth state observer
  onAuthStateChanged(callback: (user: User | null) => void) {
    if (!auth) {
      callback(null);
      return () => {};
    }
    return firebaseOnAuthStateChanged(auth, callback);
  },

  // Sync / create profile in Firestore upon sign in
  async syncUserProfile(
    firebaseUser: User,
    defaults?: Partial<UserProfile>
  ): Promise<UserProfile> {
    let profile = await FirestoreService.getUser(firebaseUser.uid);
    if (!profile) {
      // Check if this is the first user in the system to bootstrap as Admin (Director)
      const allUsers = await FirestoreService.getAllUsers();
      const isFirstUser = allUsers.length === 0;

      profile = {
        id: firebaseUser.uid,
        name: firebaseUser.displayName || defaults?.name || 'Musician',
        email: firebaseUser.email || '',
        role: isFirstUser ? 'admin' : (defaults?.role || 'student'),
        avatar:
          firebaseUser.photoURL ||
          defaults?.avatar ||
          `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(
            firebaseUser.uid
          )}`,
        instruments: defaults?.instruments || ['guitars'],
        primaryInstrument: defaults?.primaryInstrument || 'guitars',
        skillLevel: defaults?.skillLevel || 'intermediate',
        musicalStyles: defaults?.musicalStyles || ['Rock'],
        ageGroup: defaults?.ageGroup || 'teens',
        bio: defaults?.bio || '',
        joinedAt: new Date().toISOString(),
        bandIds: defaults?.bandIds || [],
      };

      await FirestoreService.setUser(profile);
    }
    return profile;
  },
};
