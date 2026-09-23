import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Unsubscribe,
  increment,
} from 'firebase/firestore';
import { db } from './firebase';
import {
  Band,
  ChatMessage,
  InstrumentType,
  InviteCode,
  RehearsalEvent,
  UserProfile,
} from '@/types';

// Ensure Firestore is initialized
function getDb() {
  if (!db) {
    throw new Error('Firestore is not initialized. Please configure your Firebase environment variables.');
  }
  return db;
}

export const FirestoreService = {
  // --- USERS & ROSTER ---
  async getUser(uid: string): Promise<UserProfile | null> {
    const firestore = getDb();
    const snap = await getDoc(doc(firestore, 'users', uid));
    return snap.exists() ? (snap.data() as UserProfile) : null;
  },

  async getAllUsers(): Promise<UserProfile[]> {
    const firestore = getDb();
    const snap = await getDocs(collection(firestore, 'users'));
    return snap.docs.map((d) => d.data() as UserProfile);
  },

  async setUser(profile: UserProfile): Promise<void> {
    const firestore = getDb();
    await setDoc(doc(firestore, 'users', profile.id), profile, { merge: true });
  },

  async updateUser(uid: string, updates: Partial<UserProfile>): Promise<void> {
    const firestore = getDb();
    await updateDoc(doc(firestore, 'users', uid), updates);
  },

  // --- BANDS ---
  async getBands(): Promise<Band[]> {
    const firestore = getDb();
    const snap = await getDocs(collection(firestore, 'bands'));
    return snap.docs.map((d) => d.data() as Band);
  },

  async getBand(id: string): Promise<Band | null> {
    const firestore = getDb();
    const snap = await getDoc(doc(firestore, 'bands', id));
    return snap.exists() ? (snap.data() as Band) : null;
  },

  async setBand(band: Band): Promise<void> {
    const firestore = getDb();
    await setDoc(doc(firestore, 'bands', band.id), band);
  },

  async updateBand(id: string, updates: Partial<Band>): Promise<void> {
    const firestore = getDb();
    await updateDoc(doc(firestore, 'bands', id), updates);
  },

  async deleteBand(id: string): Promise<void> {
    const firestore = getDb();
    await deleteDoc(doc(firestore, 'bands', id));
  },

  // --- REAL-TIME BAND CHAT ---
  subscribeMessages(
    bandId: string,
    callback: (messages: ChatMessage[]) => void
  ): Unsubscribe {
    const firestore = getDb();
    const msgCol = collection(firestore, `bands/${bandId}/messages`);
    const q = query(msgCol, orderBy('timestamp', 'asc'));

    return onSnapshot(
      q,
      (snapshot) => {
        const msgs = snapshot.docs.map((d) => d.data() as ChatMessage);
        callback(msgs);
      },
      (error) => {
        console.error(`Error listening to messages for band ${bandId}:`, error);
      }
    );
  },

  async sendMessage(bandId: string, message: ChatMessage): Promise<void> {
    const firestore = getDb();
    const msgRef = doc(firestore, `bands/${bandId}/messages`, message.id);
    await setDoc(msgRef, message);
  },

  // --- REHEARSAL SCHEDULING (ADMIN CONTROLLED) ---
  async getRehearsals(bandId?: string): Promise<RehearsalEvent[]> {
    const firestore = getDb();
    const rehCol = collection(firestore, 'rehearsals');
    const q = bandId
      ? query(rehCol, where('bandId', '==', bandId), orderBy('date', 'asc'))
      : query(rehCol, orderBy('date', 'asc'));

    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as RehearsalEvent);
  },

  async createRehearsal(rehearsal: RehearsalEvent): Promise<void> {
    const firestore = getDb();
    await setDoc(doc(firestore, 'rehearsals', rehearsal.id), rehearsal);
  },

  async deleteRehearsal(id: string): Promise<void> {
    const firestore = getDb();
    await deleteDoc(doc(firestore, 'rehearsals', id));
  },

  // --- INVITES & QR PASSES ---
  async getInvite(code: string): Promise<InviteCode | null> {
    const firestore = getDb();
    const snap = await getDoc(doc(firestore, 'invites', code.toUpperCase()));
    return snap.exists() ? (snap.data() as InviteCode) : null;
  },

  async getInvites(): Promise<InviteCode[]> {
    const firestore = getDb();
    const snap = await getDocs(collection(firestore, 'invites'));
    return snap.docs.map((d) => d.data() as InviteCode);
  },

  async createInvite(invite: InviteCode): Promise<void> {
    const firestore = getDb();
    await setDoc(doc(firestore, 'invites', invite.code.toUpperCase()), invite);
  },

  async incrementInviteUse(code: string): Promise<void> {
    const firestore = getDb();
    await updateDoc(doc(firestore, 'invites', code.toUpperCase()), {
      usedCount: increment(1),
    });
  },
};
