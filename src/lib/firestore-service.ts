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
  BandAnnouncement,
  BandSong,
  ChatMessage,
  InstrumentType,
  InviteCode,
  PrivateUserProfile,
  RehearsalEvent,
  RSVPStatus,
  SongVote,
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

  // Private Sensitive Profile (DOB, guardian contact) stored separately at /users/{uid}/private/profile
  async getPrivateProfile(uid: string): Promise<PrivateUserProfile | null> {
    const firestore = getDb();
    const snap = await getDoc(doc(firestore, `users/${uid}/private`, 'profile'));
    return snap.exists() ? (snap.data() as PrivateUserProfile) : null;
  },

  async setPrivateProfile(privateProfile: PrivateUserProfile): Promise<void> {
    const firestore = getDb();
    await setDoc(
      doc(firestore, `users/${privateProfile.userId}/private`, 'profile'),
      privateProfile,
      { merge: true }
    );
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

  // --- ANNOUNCEMENTS ---
  async getAnnouncements(bandId: string): Promise<BandAnnouncement[]> {
    const firestore = getDb();
    const annCol = collection(firestore, `bands/${bandId}/announcements`);
    const q = query(annCol, orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as BandAnnouncement);
  },

  async setAnnouncement(announcement: BandAnnouncement): Promise<void> {
    const firestore = getDb();
    await setDoc(
      doc(firestore, `bands/${announcement.bandId}/announcements`, announcement.id),
      announcement
    );
  },

  async deleteAnnouncement(bandId: string, annId: string): Promise<void> {
    const firestore = getDb();
    await deleteDoc(doc(firestore, `bands/${bandId}/announcements`, annId));
  },

  // --- SONGS & REPERTOIRE ---
  async getSongs(bandId: string): Promise<BandSong[]> {
    const firestore = getDb();
    const songsCol = collection(firestore, `bands/${bandId}/songs`);
    const snap = await getDocs(songsCol);
    return snap.docs.map((d) => d.data() as BandSong);
  },

  async setSong(song: BandSong): Promise<void> {
    const firestore = getDb();
    await setDoc(doc(firestore, `bands/${song.bandId}/songs`, song.id), song);
  },

  async deleteSong(bandId: string, songId: string): Promise<void> {
    const firestore = getDb();
    await deleteDoc(doc(firestore, `bands/${bandId}/songs`, songId));
  },

  // --- ANONYMOUS SONG VOTES ---
  async submitVote(bandId: string, songId: string, vote: SongVote): Promise<void> {
    const firestore = getDb();
    await setDoc(
      doc(firestore, `bands/${bandId}/songs/${songId}/votes`, vote.userId),
      vote
    );
  },

  // --- EVENT RSVP ---
  async updateEventRSVP(eventId: string, userId: string, rsvp: RSVPStatus): Promise<void> {
    const firestore = getDb();
    await updateDoc(doc(firestore, 'rehearsals', eventId), {
      [`rsvps.${userId}`]: rsvp,
    });
  },
};
