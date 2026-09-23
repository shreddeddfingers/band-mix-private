'use client';

import {
  Band,
  BandMember,
  ChatMessage,
  InstrumentType,
  InviteCode,
  RehearsalEvent,
  UserProfile,
  UserRole,
} from '@/types';
import { isFirebaseConfigured } from './firebase';
import { FirestoreService } from './firestore-service';

const STORAGE_KEYS = {
  BANDS: 'bandmix_prod_bands',
  STUDENTS: 'bandmix_prod_students',
  DIRECTOR: 'bandmix_prod_director',
  MESSAGES: 'bandmix_prod_messages',
  REHEARSALS: 'bandmix_prod_rehearsals',
  INVITES: 'bandmix_prod_invites',
};

// Production baseline invite pass
const BASELINE_INVITE: InviteCode = {
  code: 'STUDIO-PASS',
  role: 'student',
  createdAt: new Date().toISOString(),
  expiresAt: new Date(Date.now() + 365 * 86400000).toISOString(),
  usedCount: 0,
  maxUses: 1000,
  label: 'Studio Student QR Intake Pass',
};

// Default clean Director template for production bootstrap
const BASELINE_DIRECTOR: UserProfile = {
  id: 'director-main',
  name: 'Director',
  email: 'director@musicstudio.edu',
  role: 'admin',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
  instruments: ['piano', 'guitars'],
  primaryInstrument: 'piano',
  skillLevel: 'expert',
  musicalStyles: ['Jazz', 'Rock', 'Classical'],
  ageGroup: 'adults',
  bio: 'Music School Director & Ensemble Coordinator.',
  joinedAt: new Date().toISOString(),
  bandIds: [],
};

// Event listeners for real-time reactivity
type Listener = () => void;
const listeners: Record<string, Set<Listener>> = {};

function notify(key: string) {
  if (listeners[key]) {
    listeners[key].forEach((cb) => {
      try {
        cb();
      } catch (err) {
        console.error(err);
      }
    });
  }
}

export function subscribeToStore(key: string, callback: Listener): () => void {
  if (!listeners[key]) {
    listeners[key] = new Set();
  }
  listeners[key].add(callback);
  return () => {
    listeners[key]?.delete(callback);
  };
}

function loadItem<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

function saveItem<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to save to localStorage', err);
  }
}

// --- PRODUCTION DATA STORE ---

export const DataStore = {
  // Purge all stored records and reset to clean production baseline
  purgeAllData(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEYS.BANDS);
    localStorage.removeItem(STORAGE_KEYS.STUDENTS);
    localStorage.removeItem(STORAGE_KEYS.DIRECTOR);
    localStorage.removeItem(STORAGE_KEYS.MESSAGES);
    localStorage.removeItem(STORAGE_KEYS.REHEARSALS);
    localStorage.removeItem(STORAGE_KEYS.INVITES);
    notify('all');
    notify('bands');
    notify('students');
    notify('messages');
    notify('rehearsals');
    notify('invites');
  },

  // USERS & ROSTER
  getDirector(): UserProfile {
    return loadItem<UserProfile>(STORAGE_KEYS.DIRECTOR, BASELINE_DIRECTOR);
  },

  setDirector(director: UserProfile): void {
    saveItem(STORAGE_KEYS.DIRECTOR, director);
    if (isFirebaseConfigured) {
      FirestoreService.setUser(director).catch(console.error);
    }
    notify('students');
  },

  getStudents(): UserProfile[] {
    return loadItem<UserProfile[]>(STORAGE_KEYS.STUDENTS, []);
  },

  getAllUsers(): UserProfile[] {
    return [this.getDirector(), ...this.getStudents()];
  },

  getUserById(id: string): UserProfile | undefined {
    return this.getAllUsers().find((u) => u.id === id);
  },

  createStudent(
    studentData: Omit<UserProfile, 'id' | 'role' | 'joinedAt' | 'bandIds'> & {
      bandIdToJoin?: string;
    }
  ): UserProfile {
    const students = this.getStudents();
    const newId = `student-${Date.now().toString(36)}`;
    const newStudent: UserProfile = {
      ...studentData,
      id: newId,
      role: 'student',
      joinedAt: new Date().toISOString(),
      bandIds: studentData.bandIdToJoin ? [studentData.bandIdToJoin] : [],
    };

    const updated = [newStudent, ...students];
    saveItem(STORAGE_KEYS.STUDENTS, updated);

    if (isFirebaseConfigured) {
      FirestoreService.setUser(newStudent).catch(console.error);
    }

    if (studentData.bandIdToJoin) {
      this.addMemberToBand(
        studentData.bandIdToJoin,
        newStudent,
        studentData.primaryInstrument
      );
    }

    notify('students');
    return newStudent;
  },

  // BANDS (CRUD)
  getBands(): Band[] {
    return loadItem<Band[]>(STORAGE_KEYS.BANDS, []);
  },

  getBand(id: string): Band | undefined {
    return this.getBands().find((b) => b.id === id);
  },

  createBand(data: {
    name: string;
    genre: string;
    description: string;
    rehearsalSchedule?: string;
    coverImage?: string;
    initialStudentIds?: { studentId: string; instrument: InstrumentType }[];
  }): Band {
    const bands = this.getBands();
    const director = this.getDirector();
    const newBandId = `band-${Date.now().toString(36)}`;

    // Director is ALWAYS mandated and locked into every band
    const members: BandMember[] = [
      {
        userId: director.id,
        name: director.name,
        role: 'director',
        instrument: director.primaryInstrument,
        avatar: director.avatar,
        joinedAt: new Date().toISOString(),
      },
    ];

    if (data.initialStudentIds && data.initialStudentIds.length > 0) {
      const allStudents = this.getStudents();
      data.initialStudentIds.forEach((item) => {
        const student = allStudents.find((s) => s.id === item.studentId);
        if (student) {
          members.push({
            userId: student.id,
            name: student.name,
            role: 'member',
            instrument: item.instrument,
            avatar: student.avatar,
            joinedAt: new Date().toISOString(),
          });
        }
      });
    }

    const newBand: Band = {
      id: newBandId,
      name: data.name,
      genre: data.genre,
      description: data.description,
      rehearsalSchedule: data.rehearsalSchedule || 'TBD by Director',
      coverImage:
        data.coverImage ||
        'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=800',
      createdBy: director.id,
      createdAt: new Date().toISOString(),
      status: 'active',
      members,
    };

    saveItem(STORAGE_KEYS.BANDS, [newBand, ...bands]);

    if (isFirebaseConfigured) {
      FirestoreService.setBand(newBand).catch(console.error);
    }

    // Auto-send welcome message
    this.sendMessage(
      newBandId,
      `Welcome to ${newBand.name}! I am your director. Use this channel to coordinate rehearsals and charts.`,
      director
    );

    notify('bands');
    return newBand;
  },

  updateBand(id: string, updates: Partial<Band>): Band | undefined {
    const bands = this.getBands();
    const index = bands.findIndex((b) => b.id === id);
    if (index === -1) return undefined;

    const director = this.getDirector();
    if (updates.members) {
      const hasDirector = updates.members.some(
        (m) => m.userId === director.id || m.role === 'director'
      );
      if (!hasDirector) {
        updates.members.unshift({
          userId: director.id,
          name: director.name,
          role: 'director',
          instrument: director.primaryInstrument,
          avatar: director.avatar,
          joinedAt: new Date().toISOString(),
        });
      }
    }

    bands[index] = { ...bands[index], ...updates };
    saveItem(STORAGE_KEYS.BANDS, bands);

    if (isFirebaseConfigured) {
      FirestoreService.updateBand(id, updates).catch(console.error);
    }

    notify('bands');
    return bands[index];
  },

  deleteBand(id: string): void {
    const bands = this.getBands().filter((b) => b.id !== id);
    saveItem(STORAGE_KEYS.BANDS, bands);

    if (isFirebaseConfigured) {
      FirestoreService.deleteBand(id).catch(console.error);
    }

    notify('bands');
  },

  addMemberToBand(
    bandId: string,
    student: UserProfile,
    instrument: InstrumentType
  ): void {
    const bands = this.getBands();
    const band = bands.find((b) => b.id === bandId);
    if (!band) return;

    if (band.members.some((m) => m.userId === student.id)) return;

    band.members.push({
      userId: student.id,
      name: student.name,
      role: 'member',
      instrument,
      avatar: student.avatar,
      joinedAt: new Date().toISOString(),
    });

    saveItem(STORAGE_KEYS.BANDS, bands);

    // Update student's bandIds list
    const students = this.getStudents();
    const studentObj = students.find((s) => s.id === student.id);
    if (studentObj && !studentObj.bandIds.includes(bandId)) {
      studentObj.bandIds.push(bandId);
      saveItem(STORAGE_KEYS.STUDENTS, students);
      notify('students');
    }

    if (isFirebaseConfigured) {
      FirestoreService.updateBand(bandId, { members: band.members }).catch(console.error);
      if (studentObj) {
        FirestoreService.updateUser(student.id, { bandIds: studentObj.bandIds }).catch(console.error);
      }
    }

    // System announce in chat
    const director = this.getDirector();
    this.sendMessage(
      bandId,
      `🎉 Welcome ${student.name} to ${band.name} on ${instrument.toUpperCase()}!`,
      director
    );

    notify('bands');
  },

  removeMemberFromBand(bandId: string, userId: string): void {
    const director = this.getDirector();
    if (userId === director.id) return; // Cannot remove director

    const bands = this.getBands();
    const band = bands.find((b) => b.id === bandId);
    if (!band) return;

    band.members = band.members.filter((m) => m.userId !== userId);
    saveItem(STORAGE_KEYS.BANDS, bands);

    const students = this.getStudents();
    const student = students.find((s) => s.id === userId);
    if (student) {
      student.bandIds = student.bandIds.filter((id) => id !== bandId);
      saveItem(STORAGE_KEYS.STUDENTS, students);
      notify('students');
    }

    if (isFirebaseConfigured) {
      FirestoreService.updateBand(bandId, { members: band.members }).catch(console.error);
      if (student) {
        FirestoreService.updateUser(userId, { bandIds: student.bandIds }).catch(console.error);
      }
    }

    notify('bands');
  },

  // CHAT MESSAGES
  getMessages(bandId: string): ChatMessage[] {
    const all = loadItem<Record<string, ChatMessage[]>>(
      STORAGE_KEYS.MESSAGES,
      {}
    );
    return all[bandId] || [];
  },

  sendMessage(
    bandId: string,
    text: string,
    sender: UserProfile,
    isPinnedRehearsalNotice = false
  ): ChatMessage {
    const all = loadItem<Record<string, ChatMessage[]>>(
      STORAGE_KEYS.MESSAGES,
      {}
    );
    if (!all[bandId]) all[bandId] = [];

    const newMessage: ChatMessage = {
      id: `msg-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`,
      bandId,
      senderId: sender.id,
      senderName: sender.name,
      senderRole: sender.role,
      senderInstrument: sender.primaryInstrument,
      senderAvatar: sender.avatar,
      text,
      timestamp: new Date().toISOString(),
      isPinnedRehearsalNotice,
    };

    all[bandId].push(newMessage);
    saveItem(STORAGE_KEYS.MESSAGES, all);

    if (isFirebaseConfigured) {
      FirestoreService.sendMessage(bandId, newMessage).catch(console.error);
    }

    notify(`messages:${bandId}`);
    notify('messages');
    return newMessage;
  },

  // REHEARSAL SCHEDULING (ADMIN CONTROLLED)
  getRehearsals(bandId?: string): RehearsalEvent[] {
    const rehearsals = loadItem<RehearsalEvent[]>(
      STORAGE_KEYS.REHEARSALS,
      []
    );
    if (bandId) {
      return rehearsals.filter((r) => r.bandId === bandId);
    }
    return rehearsals.sort(
      (a, b) =>
        new Date(`${a.date}T${a.startTime}`).getTime() -
        new Date(`${b.date}T${b.startTime}`).getTime()
    );
  },

  createRehearsal(data: {
    bandId: string;
    title: string;
    location: string;
    date: string;
    startTime: string;
    endTime: string;
    notes?: string;
    setlist?: string[];
  }): RehearsalEvent {
    const director = this.getDirector();
    const band = this.getBand(data.bandId);
    const rehearsals = this.getRehearsals();

    const newRehearsal: RehearsalEvent = {
      id: `reh-${Date.now().toString(36)}`,
      bandId: data.bandId,
      bandName: band?.name || 'Band Practice',
      title: data.title,
      location: data.location,
      date: data.date,
      startTime: data.startTime,
      endTime: data.endTime,
      notes: data.notes,
      setlist: data.setlist || [],
      createdBy: director.id,
      createdAt: new Date().toISOString(),
    };

    const updated = [...rehearsals, newRehearsal];
    saveItem(STORAGE_KEYS.REHEARSALS, updated);

    if (isFirebaseConfigured) {
      FirestoreService.createRehearsal(newRehearsal).catch(console.error);
    }

    // Auto-announce to chat
    this.sendMessage(
      data.bandId,
      `📅 REHEARSAL SCHEDULED: "${newRehearsal.title}" on ${newRehearsal.date} from ${newRehearsal.startTime} to ${newRehearsal.endTime} in ${newRehearsal.location}. Check Rehearsal tab for details!`,
      director,
      true
    );

    notify('rehearsals');
    return newRehearsal;
  },

  deleteRehearsal(id: string): void {
    const rehearsals = this.getRehearsals().filter((r) => r.id !== id);
    saveItem(STORAGE_KEYS.REHEARSALS, rehearsals);

    if (isFirebaseConfigured) {
      FirestoreService.deleteRehearsal(id).catch(console.error);
    }

    notify('rehearsals');
  },

  // INVITES & QR CODES
  getInvites(): InviteCode[] {
    return loadItem<InviteCode[]>(STORAGE_KEYS.INVITES, [BASELINE_INVITE]);
  },

  getInviteByCode(code: string): InviteCode | undefined {
    return this.getInvites().find(
      (i) => i.code.toUpperCase() === code.toUpperCase()
    );
  },

  createInvite(data: {
    bandId?: string;
    label: string;
    maxUses?: number;
  }): InviteCode {
    const invites = this.getInvites();
    const band = data.bandId ? this.getBand(data.bandId) : undefined;
    const prefix = band
      ? band.name.substring(0, 4).toUpperCase().replace(/[^A-Z]/g, '')
      : 'BAND';
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const code = `${prefix}-${randomSuffix}`;

    const newInvite: InviteCode = {
      code,
      bandId: data.bandId,
      bandName: band?.name,
      role: 'student',
      label: data.label,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 90 * 86400000).toISOString(),
      usedCount: 0,
      maxUses: data.maxUses || 50,
    };

    const updated = [newInvite, ...invites];
    saveItem(STORAGE_KEYS.INVITES, updated);

    if (isFirebaseConfigured) {
      FirestoreService.createInvite(newInvite).catch(console.error);
    }

    notify('invites');
    return newInvite;
  },

  incrementInviteUse(code: string): void {
    const invites = this.getInvites();
    const invite = invites.find((i) => i.code.toUpperCase() === code.toUpperCase());
    if (invite) {
      invite.usedCount += 1;
      saveItem(STORAGE_KEYS.INVITES, invites);
      notify('invites');
    }

    if (isFirebaseConfigured) {
      FirestoreService.incrementInviteUse(code).catch(console.error);
    }
  },
};
