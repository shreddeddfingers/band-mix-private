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

// Recursively strips undefined values so Firestore setDoc/updateDoc never fails on optional properties
export function stripUndefined<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) {
    return obj.map(stripUndefined) as unknown as T;
  }
  if (typeof obj === 'object') {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = stripUndefined(value);
      }
    }
    return cleaned;
  }
  return obj;
}

export const FirestoreService = {
  // --- USERS & ROSTER ---
  async getUser(uid: string): Promise<UserProfile | null> {
    const firestore = getDb();
    const snap = await getDoc(doc(firestore, 'users', uid));
    if (!snap.exists()) return null;
    const data = snap.data() as UserProfile & { isDeleted?: boolean; deleted?: boolean };
    return data.isDeleted || data.deleted ? null : data;
  },

  async getAllUsers(): Promise<UserProfile[]> {
    const firestore = getDb();
    const snap = await getDocs(collection(firestore, 'users'));
    return snap.docs
      .map((d) => d.data() as UserProfile & { isDeleted?: boolean; deleted?: boolean })
      .filter((u) => !u.isDeleted && !u.deleted);
  },

  async findStudentByEmailOrName(queryStr: string): Promise<UserProfile | null> {
    const clean = queryStr.trim().toLowerCase();
    if (!clean) return null;
    const users = await this.getAllUsers();
    return (
      users.find(
        (u) =>
          u.role === 'student' &&
          (u.email.toLowerCase() === clean ||
            u.name.toLowerCase() === clean ||
            u.name.toLowerCase().startsWith(clean) ||
            u.id.toLowerCase() === clean)
      ) || null
    );
  },

  async findDirectorByEmail(emailStr: string): Promise<UserProfile | null> {
    const clean = emailStr.trim().toLowerCase();
    if (!clean) return null;
    const users = await this.getAllUsers();
    return (
      users.find(
        (u) =>
          u.role === 'admin' &&
          (u.email.toLowerCase() === clean ||
            u.name.toLowerCase() === clean ||
            u.id.toLowerCase() === clean ||
            u.email.toLowerCase().startsWith(clean) ||
            u.name.toLowerCase().includes(clean))
      ) || null
    );
  },

  subscribeUsers(callback: (users: UserProfile[]) => void): Unsubscribe {
    const firestore = getDb();
    const col = collection(firestore, 'users');
    return onSnapshot(
      col,
      (snapshot) => {
        const users = snapshot.docs
          .map((d) => d.data() as UserProfile & { isDeleted?: boolean; deleted?: boolean })
          .filter((u) => !u.isDeleted && !u.deleted);
        callback(users);
      },
      (err) => {
        console.warn('Error subscribing to users in Firestore:', err);
      }
    );
  },

  async setUser(profile: UserProfile): Promise<void> {
    const firestore = getDb();
    const cleaned = stripUndefined(profile);
    await setDoc(doc(firestore, 'users', profile.id), cleaned, { merge: true });
  },

  async updateUser(uid: string, updates: Partial<UserProfile>): Promise<void> {
    const firestore = getDb();
    const cleaned = stripUndefined(updates);
    await updateDoc(doc(firestore, 'users', uid), cleaned);
  },

  async deleteUser(uid: string): Promise<void> {
    const firestore = getDb();
    // 1. Soft-delete tombstone first (supported under student update permissions without requiring admin auth)
    try {
      await updateDoc(doc(firestore, 'users', uid), {
        isDeleted: true,
        deleted: true,
        deletedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('Soft-delete doc marker failed:', err);
    }

    // 2. Hard delete doc (succeeds if authenticated as admin or permitted ID)
    try {
      await deleteDoc(doc(firestore, 'users', uid));
    } catch {
      // Handled by soft-delete tombstone
    }

    // 3. Delete private sensitive doc
    try {
      await deleteDoc(doc(firestore, `users/${uid}/private`, 'profile'));
    } catch {
      // ignore
    }
  },

  // Private Sensitive Profile (DOB, guardian contact) stored separately at /users/{uid}/private/profile
  async getPrivateProfile(uid: string): Promise<PrivateUserProfile | null> {
    const firestore = getDb();
    const snap = await getDoc(doc(firestore, `users/${uid}/private`, 'profile'));
    return snap.exists() ? (snap.data() as PrivateUserProfile) : null;
  },

  async setPrivateProfile(privateProfile: PrivateUserProfile): Promise<void> {
    const firestore = getDb();
    const cleaned = stripUndefined(privateProfile);
    await setDoc(
      doc(firestore, `users/${privateProfile.userId}/private`, 'profile'),
      cleaned,
      { merge: true }
    );
  },

  // --- BANDS ---
  async getBands(): Promise<Band[]> {
    const firestore = getDb();
    const snap = await getDocs(collection(firestore, 'bands'));
    return snap.docs.map((d) => d.data() as Band);
  },

  subscribeBands(callback: (bands: Band[]) => void): Unsubscribe {
    const firestore = getDb();
    const col = collection(firestore, 'bands');
    return onSnapshot(
      col,
      (snapshot) => {
        const bands = snapshot.docs
          .map((d) => d.data() as Band & { isDeleted?: boolean; deleted?: boolean })
          .filter((b) => !b.isDeleted && !b.deleted);
        callback(bands);
      },
      (err) => {
        console.warn('Error subscribing to bands in Firestore:', err);
      }
    );
  },

  subscribeBand(bandId: string, callback: (band: Band | null) => void): Unsubscribe {
    const firestore = getDb();
    return onSnapshot(
      doc(firestore, 'bands', bandId),
      (snap) => {
        if (snap.exists()) {
          callback(snap.data() as Band);
        } else {
          callback(null);
        }
      },
      (err) => {
        console.warn(`Error subscribing to band ${bandId} in Firestore:`, err);
      }
    );
  },

  async getBand(id: string): Promise<Band | null> {
    const firestore = getDb();
    const snap = await getDoc(doc(firestore, 'bands', id));
    return snap.exists() ? (snap.data() as Band) : null;
  },

  async setBand(band: Band): Promise<void> {
    const firestore = getDb();
    const cleaned = stripUndefined(band);
    await setDoc(doc(firestore, 'bands', band.id), cleaned);
  },

  async updateBand(id: string, updates: Partial<Band>): Promise<void> {
    const firestore = getDb();
    const cleaned = stripUndefined(updates);
    await updateDoc(doc(firestore, 'bands', id), cleaned);
  },

  async getStudentsByDirector(directorId: string): Promise<UserProfile[]> {
    const firestore = getDb();
    const q = query(collection(firestore, 'users'), where('directorId', '==', directorId));
    const snap = await getDocs(q);
    return snap.docs
      .map((d) => d.data() as UserProfile & { isDeleted?: boolean; deleted?: boolean })
      .filter((u) => !u.isDeleted && !u.deleted);
  },

  async deleteBand(id: string): Promise<void> {
    const firestore = getDb();
    await deleteDoc(doc(firestore, 'bands', id));
  },

  async getBandsByDirector(directorId: string): Promise<Band[]> {
    const firestore = getDb();
    const q = query(collection(firestore, 'bands'), where('directorId', '==', directorId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as Band);
  },

  // --- REAL-TIME BAND CHAT ---
  async getMessages(bandId: string): Promise<ChatMessage[]> {
    const firestore = getDb();
    const msgCol = collection(firestore, `bands/${bandId}/messages`);
    const q = query(msgCol, orderBy('timestamp', 'asc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as ChatMessage);
  },

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
    const cleaned = stripUndefined(message);
    await setDoc(msgRef, cleaned);
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
    const cleaned = stripUndefined(rehearsal);
    await setDoc(doc(firestore, 'rehearsals', rehearsal.id), cleaned);
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

  subscribeInvites(callback: (invites: InviteCode[]) => void): Unsubscribe {
    const firestore = getDb();
    const col = collection(firestore, 'invites');
    return onSnapshot(
      col,
      (snapshot) => {
        const invites = snapshot.docs
          .map((d) => d.data() as InviteCode & { isDeleted?: boolean; deleted?: boolean })
          .filter((i) => !i.isDeleted && !i.deleted && new Date(i.expiresAt).getTime() > Date.now());
        callback(invites);
      },
      (err) => {
        console.warn('Error subscribing to invites in Firestore:', err);
      }
    );
  },

  async getInvitesByDirector(directorId: string): Promise<InviteCode[]> {
    const firestore = getDb();
    const q = query(collection(firestore, 'invites'), where('directorId', '==', directorId));
    const snap = await getDocs(q);
    return snap.docs
      .map((d) => d.data() as InviteCode & { isDeleted?: boolean; deleted?: boolean })
      .filter((i) => !i.isDeleted && !i.deleted && new Date(i.expiresAt).getTime() > Date.now());
  },

  async createInvite(invite: InviteCode): Promise<void> {
    const firestore = getDb();
    const cleaned = stripUndefined(invite);
    await setDoc(doc(firestore, 'invites', invite.code.toUpperCase()), cleaned);
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
    const cleaned = stripUndefined(announcement);
    await setDoc(
      doc(firestore, `bands/${announcement.bandId}/announcements`, announcement.id),
      cleaned
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

  subscribeSongs(
    bandId: string,
    callback: (songs: BandSong[]) => void
  ): Unsubscribe {
    const firestore = getDb();
    const songsCol = collection(firestore, `bands/${bandId}/songs`);
    return onSnapshot(
      songsCol,
      (snapshot) => {
        const songs = snapshot.docs.map((d) => d.data() as BandSong);
        callback(songs);
      },
      (error) => {
        console.error(`Error listening to songs for band ${bandId}:`, error);
      }
    );
  },

  async setSong(song: BandSong): Promise<void> {
    const firestore = getDb();
    const cleaned = stripUndefined(song);
    await setDoc(doc(firestore, `bands/${song.bandId}/songs`, song.id), cleaned);
  },

  async deleteSong(bandId: string, songId: string): Promise<void> {
    const firestore = getDb();
    await deleteDoc(doc(firestore, `bands/${bandId}/songs`, songId));
  },

  // --- ANONYMOUS SONG VOTES ---
  async submitVote(bandId: string, songId: string, vote: SongVote): Promise<void> {
    const firestore = getDb();
    const cleaned = stripUndefined(vote);
    await setDoc(
      doc(firestore, `bands/${bandId}/songs/${songId}/votes`, vote.userId),
      cleaned
    );
  },

  // --- EVENT RSVP ---
  async updateEventRSVP(eventId: string, userId: string, rsvp: RSVPStatus): Promise<void> {
    const firestore = getDb();
    await updateDoc(doc(firestore, 'rehearsals', eventId), {
      [`rsvps.${userId}`]: rsvp,
    });
  },

  // --- FULL PURGE (For clean studio resets) ---
  async purgeAllRemoteData(): Promise<{ success: boolean; deletedCount: number; details: Record<string, any> }> {
    const firestore = getDb();
    const cols = ['users', 'bands', 'invites', 'rehearsals'];
    let count = 0;
    const details: Record<string, any> = {};
    for (const col of cols) {
      try {
        const snap = await getDocs(collection(firestore, col));
        details[col] = snap.docs.length;
        for (const docSnap of snap.docs) {
          // 1. Tombstone wipe
          try {
            if (col === 'users') {
              await updateDoc(doc(firestore, 'users', docSnap.id), {
                isDeleted: true,
                deleted: true,
                deletedAt: new Date().toISOString(),
                name: 'Deleted Musician',
                email: `deleted_${Date.now()}_${docSnap.id}@deleted.local`,
                bandIds: [],
              });
            } else if (col === 'invites') {
              await updateDoc(doc(firestore, 'invites', docSnap.id), {
                isDeleted: true,
                deleted: true,
                expiresAt: '2000-01-01T00:00:00.000Z',
                usedCount: 999999,
                maxUses: 0,
              });
            } else if (col === 'bands') {
              await updateDoc(doc(firestore, 'bands', docSnap.id), {
                isDeleted: true,
                deleted: true,
                status: 'archived',
                members: [],
                memberIds: [],
              });
            } else if (col === 'rehearsals') {
              await updateDoc(doc(firestore, 'rehearsals', docSnap.id), {
                isDeleted: true,
                deleted: true,
              });
            }
            count++;
          } catch (upErr: any) {
            details[`${col}_up_error_${docSnap.id}`] = upErr?.message || String(upErr);
          }

          // 2. Hard delete doc
          try {
            await deleteDoc(doc(firestore, col, docSnap.id));
          } catch (e: any) {
            // Handled cleanly by tombstone
          }
        }
      } catch (err: any) {
        details[`${col}_query_error`] = err?.message || String(err);
      }
    }
    return { success: true, deletedCount: count, details };
  },
};
