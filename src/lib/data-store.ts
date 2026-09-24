'use client';

import {
  Band,
  BandAnnouncement,
  BandEvent,
  BandEventType,
  BandHistoryRecord,
  BandMember,
  BandSong,
  ChatMessage,
  InstrumentType,
  InviteCode,
  PrivateUserProfile,
  RehearsalEvent,
  RSVPStatus,
  SongSentiment,
  SongSentimentSummary,
  SongStatus,
  SongVote,
  UserProfile,
  UserRole,
} from '@/types';
import { isFirebaseConfigured } from './firebase';
import { FirestoreService } from './firestore-service';
import { calculateExactAge, ageToAgeGroup } from './age-utils';

const STORAGE_KEYS = {
  BANDS: 'bandmix_prod_bands',
  STUDENTS: 'bandmix_prod_students',
  DIRECTOR: 'bandmix_prod_director',
  DIRECTORS: 'bandmix_prod_directors',
  MESSAGES: 'bandmix_prod_messages',
  REHEARSALS: 'bandmix_prod_rehearsals',
  INVITES: 'bandmix_prod_invites',
  PRIVATE_PROFILES: 'bandmix_prod_private_profiles',
  SONGS: 'bandmix_prod_songs',
  VOTES: 'bandmix_prod_song_votes',
  ANNOUNCEMENTS: 'bandmix_prod_announcements',
};

// Production baseline invite pass
const BASELINE_INVITE: InviteCode = {
  code: 'STUDIO-PASS',
  directorId: 'director-main',
  directorName: 'Director',
  studioName: 'Music Studio',
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
  studioName: 'Music Studio',
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
    localStorage.removeItem(STORAGE_KEYS.DIRECTORS);
    localStorage.removeItem(STORAGE_KEYS.MESSAGES);
    localStorage.removeItem(STORAGE_KEYS.REHEARSALS);
    localStorage.removeItem(STORAGE_KEYS.INVITES);
    localStorage.removeItem(STORAGE_KEYS.PRIVATE_PROFILES);
    localStorage.removeItem(STORAGE_KEYS.SONGS);
    localStorage.removeItem(STORAGE_KEYS.VOTES);
    localStorage.removeItem(STORAGE_KEYS.ANNOUNCEMENTS);
    notify('all');
    notify('bands');
    notify('students');
    notify('messages');
    notify('rehearsals');
    notify('invites');
    notify('songs');
    notify('announcements');
  },

  // USERS & ROSTER
  getDirectors(): UserProfile[] {
    const list = loadItem<UserProfile[]>(STORAGE_KEYS.DIRECTORS, []);
    if (!list.some((d) => d.id === BASELINE_DIRECTOR.id)) {
      list.unshift(BASELINE_DIRECTOR);
    }
    return list;
  },

  getDirector(id?: string): UserProfile {
    if (id) {
      const directors = this.getDirectors();
      const found = directors.find((d) => d.id === id);
      if (found) return found;
    }
    return loadItem<UserProfile>(STORAGE_KEYS.DIRECTOR, BASELINE_DIRECTOR);
  },

  setDirector(director: UserProfile): void {
    saveItem(STORAGE_KEYS.DIRECTOR, director);
    const directors = this.getDirectors();
    const idx = directors.findIndex((d) => d.id === director.id);
    if (idx >= 0) {
      directors[idx] = director;
    } else {
      directors.push(director);
    }
    saveItem(STORAGE_KEYS.DIRECTORS, directors);
    if (isFirebaseConfigured) {
      FirestoreService.setUser(director).catch(console.error);
    }
    notify('students');
  },

  createDirector(data: {
    name: string;
    email: string;
    studioName: string;
    primaryInstrument: InstrumentType;
    instruments?: InstrumentType[];
    musicalStyles?: string[];
    bio?: string;
    avatar?: string;
  }): UserProfile {
    const newId = `director-${Date.now().toString(36)}`;
    const newDirector: UserProfile = {
      id: newId,
      name: data.name,
      email: data.email,
      role: 'admin',
      directorId: newId,
      studioName: data.studioName,
      primaryInstrument: data.primaryInstrument,
      instruments:
        data.instruments && data.instruments.length > 0
          ? data.instruments
          : [data.primaryInstrument],
      musicalStyles: data.musicalStyles || ['Rock', 'Jazz', 'Pop'],
      skillLevel: 'expert',
      ageGroup: 'adults',
      bio:
        data.bio ||
        `Band Director & Ensemble Coordinator at ${data.studioName}.`,
      avatar:
        data.avatar ||
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
      joinedAt: new Date().toISOString(),
      bandIds: [],
    };

    const directors = this.getDirectors();
    directors.push(newDirector);
    saveItem(STORAGE_KEYS.DIRECTORS, directors);
    saveItem(STORAGE_KEYS.DIRECTOR, newDirector);

    // Auto-create a studio invite pass for this director
    const cleanPrefix =
      data.studioName
        .substring(0, 4)
        .toUpperCase()
        .replace(/[^A-Z]/g, '') || 'STUDIO';
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const studioInvite: InviteCode = {
      code: `${cleanPrefix}-${randomSuffix}`,
      role: 'student',
      label: `${data.studioName} Student QR Intake Pass`,
      directorId: newId,
      directorName: data.name,
      studioName: data.studioName,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 365 * 86400000).toISOString(),
      usedCount: 0,
      maxUses: 500,
    };

    const invites = loadItem<InviteCode[]>(STORAGE_KEYS.INVITES, [BASELINE_INVITE]);
    saveItem(STORAGE_KEYS.INVITES, [studioInvite, ...invites]);

    if (isFirebaseConfigured) {
      FirestoreService.setUser(newDirector).catch(console.error);
      FirestoreService.createInvite(studioInvite).catch(console.error);
    }

    notify('students');
    notify('invites');
    return newDirector;
  },

  getStudents(directorId?: string): UserProfile[] {
    const students = loadItem<UserProfile[]>(STORAGE_KEYS.STUDENTS, []);
    if (!directorId) return students;
    return students.filter(
      (s) =>
        s.directorId === directorId ||
        (directorId === 'director-main' && (!s.directorId || s.directorId === 'director-main'))
    );
  },

  getAllUsers(directorId?: string): UserProfile[] {
    return [...this.getDirectors(), ...this.getStudents(directorId)];
  },

  getUserById(id: string): UserProfile | undefined {
    return this.getAllUsers().find((u) => u.id === id);
  },

  // Private Sensitive Profiles (DOB, guardian contact)
  getPrivateProfiles(): Record<string, PrivateUserProfile> {
    return loadItem<Record<string, PrivateUserProfile>>(
      STORAGE_KEYS.PRIVATE_PROFILES,
      {}
    );
  },

  getPrivateProfile(userId: string): PrivateUserProfile | undefined {
    return this.getPrivateProfiles()[userId];
  },

  setPrivateProfile(profile: PrivateUserProfile): void {
    const all = this.getPrivateProfiles();
    all[profile.userId] = profile;
    saveItem(STORAGE_KEYS.PRIVATE_PROFILES, all);
    if (isFirebaseConfigured) {
      FirestoreService.setPrivateProfile(profile).catch(console.error);
    }
  },

  createStudent(
    studentData: Omit<UserProfile, 'id' | 'role' | 'joinedAt' | 'bandIds'> & {
      bandIdToJoin?: string;
      dateOfBirth?: string;
      guardianName?: string;
      guardianEmail?: string;
      guardianPhone?: string;
      directorId?: string;
    }
  ): UserProfile {
    const students = loadItem<UserProfile[]>(STORAGE_KEYS.STUDENTS, []);
    const newId = `student-${Date.now().toString(36)}`;

    // Resolve directorId:
    let resolvedDirectorId = studentData.directorId;
    if (!resolvedDirectorId && studentData.bandIdToJoin) {
      const targetBand = this.getBand(studentData.bandIdToJoin);
      if (targetBand) {
        resolvedDirectorId = targetBand.directorId || targetBand.createdBy;
      }
    }
    if (!resolvedDirectorId) {
      resolvedDirectorId = this.getDirector().id || 'director-main';
    }

    // Calculate exact age from DOB if supplied; DOB is NEVER stored on the public UserProfile
    let exactAge = studentData.exactAge;
    let ageGroup = studentData.ageGroup;
    if (studentData.dateOfBirth) {
      exactAge = calculateExactAge(studentData.dateOfBirth);
      if (!ageGroup) {
        ageGroup = ageToAgeGroup(exactAge);
      }
    }

    const {
      dateOfBirth,
      guardianName,
      guardianEmail,
      guardianPhone,
      ...publicData
    } = studentData;

    const newStudent: UserProfile = {
      ...publicData,
      id: newId,
      directorId: resolvedDirectorId,
      role: 'student',
      exactAge,
      ageGroup: ageGroup || 'teens',
      joinedAt: new Date().toISOString(),
      bandIds: studentData.bandIdToJoin ? [studentData.bandIdToJoin] : [],
    };

    const updated = [newStudent, ...students];
    saveItem(STORAGE_KEYS.STUDENTS, updated);

    // Store private sensitive profile separately
    if (dateOfBirth || guardianEmail || guardianName) {
      const privateProfile: PrivateUserProfile = {
        userId: newId,
        dateOfBirth,
        guardianName,
        guardianEmail,
        guardianPhone,
        updatedAt: new Date().toISOString(),
      };
      this.setPrivateProfile(privateProfile);
    }

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
  getBands(directorId?: string): Band[] {
    const bands = loadItem<Band[]>(STORAGE_KEYS.BANDS, []);
    if (!directorId) return bands;
    return bands.filter(
      (b) =>
        b.directorId === directorId ||
        b.createdBy === directorId ||
        (directorId === 'director-main' &&
          (!b.directorId && (!b.createdBy || b.createdBy === 'director-main')))
    );
  },

  getBand(id: string): Band | undefined {
    return loadItem<Band[]>(STORAGE_KEYS.BANDS, []).find((b) => b.id === id);
  },

  createBand(data: {
    name: string;
    genre: string;
    description: string;
    rehearsalSchedule?: string;
    coverImage?: string;
    directorId?: string;
    initialStudentIds?: { studentId: string; instrument: InstrumentType }[];
  }): Band {
    const bands = loadItem<Band[]>(STORAGE_KEYS.BANDS, []);
    const director = data.directorId
      ? this.getDirector(data.directorId)
      : this.getDirector();
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
      directorId: director.id,
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
    eventType?: BandEventType;
    callTime?: string;
    performanceTime?: string;
    notes?: string;
    setlist?: string[];
    repertoireSongIds?: string[];
  }): BandEvent {
    const director = this.getDirector();
    const band = this.getBand(data.bandId);
    const rehearsals = this.getRehearsals();
    const eventType = data.eventType || 'rehearsal';

    const newEvent: BandEvent = {
      id: `evt-${Date.now().toString(36)}`,
      bandId: data.bandId,
      bandName: band?.name || 'Band Practice',
      eventType,
      title: data.title,
      location: data.location,
      date: data.date,
      startTime: data.startTime,
      endTime: data.endTime,
      callTime: data.callTime,
      performanceTime: data.performanceTime,
      notes: data.notes,
      setlist: data.setlist || [],
      repertoireSongIds: data.repertoireSongIds || [],
      rsvps: {},
      createdBy: director.id,
      createdAt: new Date().toISOString(),
    };

    const updated = [...rehearsals, newEvent];
    saveItem(STORAGE_KEYS.REHEARSALS, updated);

    if (isFirebaseConfigured) {
      FirestoreService.createRehearsal(newEvent).catch(console.error);
    }

    // Auto-announce to chat with appropriate event label
    const eventLabel =
      eventType === 'gig'
        ? '🎤 LIVE GIG / CONCERT'
        : eventType === 'showcase'
        ? '🌟 STUDIO SHOWCASE'
        : eventType === 'recording'
        ? '🎙️ RECORDING SESSION'
        : eventType === 'audition'
        ? '📋 AUDITION'
        : '📅 REHEARSAL';

    this.sendMessage(
      data.bandId,
      `${eventLabel} SCHEDULED: "${newEvent.title}" on ${newEvent.date} from ${newEvent.startTime} to ${newEvent.endTime} at ${newEvent.location}. Check Schedule tab for details!`,
      director,
      true
    );

    notify('rehearsals');
    return newEvent;
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
  getInvites(directorId?: string): InviteCode[] {
    const all = loadItem<InviteCode[]>(STORAGE_KEYS.INVITES, [BASELINE_INVITE]);
    if (!directorId) return all;
    return all.filter(
      (i) =>
        i.directorId === directorId ||
        (directorId === 'director-main' && (!i.directorId || i.directorId === 'director-main'))
    );
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
    directorId?: string;
    directorName?: string;
    studioName?: string;
  }): InviteCode {
    const invites = loadItem<InviteCode[]>(STORAGE_KEYS.INVITES, [BASELINE_INVITE]);
    const band = data.bandId ? this.getBand(data.bandId) : undefined;
    const director = data.directorId ? this.getDirector(data.directorId) : this.getDirector();
    const studioPrefix = (data.studioName || director.studioName || 'BAND')
      .substring(0, 4)
      .toUpperCase()
      .replace(/[^A-Z]/g, '');
    const prefix = band
      ? band.name.substring(0, 4).toUpperCase().replace(/[^A-Z]/g, '')
      : (studioPrefix || 'BAND');
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const code = `${prefix}-${randomSuffix}`;

    const newInvite: InviteCode = {
      code,
      bandId: data.bandId,
      bandName: band?.name,
      role: 'student',
      label: data.label,
      directorId: director.id,
      directorName: director.name,
      studioName: data.studioName || director.studioName || 'Music Studio',
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

  // --- MASTER BAND REPERTOIRE & SET LIST ---
  getSongs(bandId?: string): BandSong[] {
    const all = loadItem<BandSong[]>(STORAGE_KEYS.SONGS, []);
    return bandId ? all.filter((s) => s.bandId === bandId) : all;
  },

  getSong(id: string): BandSong | undefined {
    return this.getSongs().find((s) => s.id === id);
  },

  createSong(data: {
    bandId: string;
    title: string;
    artist: string;
    key?: string;
    tempoBpm?: number;
    vocalistAssignments?: string[];
    directorNotes?: string;
    status: SongStatus;
    suggestedBy?: string;
  }): BandSong {
    const songs = this.getSongs();
    const newSong: BandSong = {
      ...data,
      id: `song-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sentimentSummary: {
        reallyWant: 0,
        wouldPlay: 0,
        neutral: 0,
        notInterested: 0,
        totalVotes: 0,
      },
    };

    saveItem(STORAGE_KEYS.SONGS, [newSong, ...songs]);
    notify(`songs:${data.bandId}`);
    notify('songs');

    if (isFirebaseConfigured) {
      FirestoreService.setSong(newSong).catch(console.error);
    }

    return newSong;
  },

  updateSong(id: string, updates: Partial<BandSong>): BandSong | undefined {
    const songs = this.getSongs();
    const idx = songs.findIndex((s) => s.id === id);
    if (idx === -1) return undefined;

    songs[idx] = {
      ...songs[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    saveItem(STORAGE_KEYS.SONGS, songs);
    notify(`songs:${songs[idx].bandId}`);
    notify('songs');

    if (isFirebaseConfigured) {
      FirestoreService.setSong(songs[idx]).catch(console.error);
    }

    return songs[idx];
  },

  deleteSong(id: string): void {
    const songs = this.getSongs();
    const target = songs.find((s) => s.id === id);
    if (!target) return;

    saveItem(
      STORAGE_KEYS.SONGS,
      songs.filter((s) => s.id !== id)
    );
    notify(`songs:${target.bandId}`);
    notify('songs');

    if (isFirebaseConfigured) {
      FirestoreService.deleteSong(target.bandId, id).catch(console.error);
    }
  },

  // --- ANONYMOUS SONG SENTIMENT VOTING ---
  getVotes(songId?: string): SongVote[] {
    const all = loadItem<SongVote[]>(STORAGE_KEYS.VOTES, []);
    return songId ? all.filter((v) => v.songId === songId) : all;
  },

  getUserVote(songId: string, userId: string): SongVote | undefined {
    return this.getVotes(songId).find((v) => v.userId === userId);
  },

  castSongVote(
    songId: string,
    bandId: string,
    userId: string,
    sentiment: SongSentiment
  ): void {
    const allVotes = loadItem<SongVote[]>(STORAGE_KEYS.VOTES, []);
    const existingIdx = allVotes.findIndex(
      (v) => v.songId === songId && v.userId === userId
    );

    const voteRecord: SongVote = {
      id: `${songId}_${userId}`,
      songId,
      bandId,
      userId,
      sentiment,
      updatedAt: new Date().toISOString(),
    };

    if (existingIdx >= 0) {
      allVotes[existingIdx] = voteRecord;
    } else {
      allVotes.push(voteRecord);
    }
    saveItem(STORAGE_KEYS.VOTES, allVotes);

    // Compute updated aggregate sentiment
    const songVotes = allVotes.filter((v) => v.songId === songId);
    const summary: SongSentimentSummary = {
      reallyWant: songVotes.filter((v) => v.sentiment === 'really_want').length,
      wouldPlay: songVotes.filter((v) => v.sentiment === 'would_play').length,
      neutral: songVotes.filter((v) => v.sentiment === 'neutral').length,
      notInterested: songVotes.filter((v) => v.sentiment === 'not_interested').length,
      totalVotes: songVotes.length,
    };

    // Update song document with new aggregated summary
    this.updateSong(songId, { sentimentSummary: summary });

    if (isFirebaseConfigured) {
      FirestoreService.submitVote(bandId, songId, voteRecord).catch(console.error);
    }

    notify(`votes:${songId}`);
    notify(`songs:${bandId}`);
  },

  // --- PERSISTENT BAND ANNOUNCEMENTS ---
  getAnnouncements(bandId: string): BandAnnouncement[] {
    const all = loadItem<BandAnnouncement[]>(STORAGE_KEYS.ANNOUNCEMENTS, []);
    return all
      .filter((a) => a.bandId === bandId)
      .sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  },

  createAnnouncement(data: {
    bandId: string;
    title: string;
    content: string;
    authorId: string;
    authorName: string;
    isPinned?: boolean;
  }): BandAnnouncement {
    const all = loadItem<BandAnnouncement[]>(STORAGE_KEYS.ANNOUNCEMENTS, []);
    const newAnnouncement: BandAnnouncement = {
      ...data,
      id: `ann-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`,
      isPinned: Boolean(data.isPinned),
      isArchived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveItem(STORAGE_KEYS.ANNOUNCEMENTS, [newAnnouncement, ...all]);
    notify(`announcements:${data.bandId}`);

    if (isFirebaseConfigured) {
      FirestoreService.setAnnouncement(newAnnouncement).catch(console.error);
    }

    return newAnnouncement;
  },

  updateAnnouncement(
    id: string,
    updates: Partial<BandAnnouncement>
  ): BandAnnouncement | undefined {
    const all = loadItem<BandAnnouncement[]>(STORAGE_KEYS.ANNOUNCEMENTS, []);
    const idx = all.findIndex((a) => a.id === id);
    if (idx === -1) return undefined;

    all[idx] = {
      ...all[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    saveItem(STORAGE_KEYS.ANNOUNCEMENTS, all);
    notify(`announcements:${all[idx].bandId}`);

    if (isFirebaseConfigured) {
      FirestoreService.setAnnouncement(all[idx]).catch(console.error);
    }

    return all[idx];
  },

  deleteAnnouncement(id: string): void {
    const all = loadItem<BandAnnouncement[]>(STORAGE_KEYS.ANNOUNCEMENTS, []);
    const target = all.find((a) => a.id === id);
    if (!target) return;

    saveItem(
      STORAGE_KEYS.ANNOUNCEMENTS,
      all.filter((a) => a.id !== id)
    );
    notify(`announcements:${target.bandId}`);

    if (isFirebaseConfigured) {
      FirestoreService.deleteAnnouncement(target.bandId, id).catch(console.error);
    }
  },

  // --- POLYMORPHIC BAND EVENTS (Extends RehearsalEvent) ---
  updateEventRSVP(eventId: string, userId: string, rsvp: RSVPStatus): void {
    const events = this.getRehearsals();
    const event = events.find((e) => e.id === eventId);
    if (!event) return;

    if (!event.rsvps) event.rsvps = {};
    event.rsvps[userId] = rsvp;

    saveItem(STORAGE_KEYS.REHEARSALS, events);
    notify('rehearsals');

    if (isFirebaseConfigured) {
      FirestoreService.updateEventRSVP(eventId, userId, rsvp).catch(console.error);
    }
  },

  // --- BAND HISTORY & ARCHIVING ---
  archiveBand(bandId: string): void {
    const band = this.getBand(bandId);
    if (!band) return;

    this.updateBand(bandId, {
      status: 'archived',
      archivedAt: new Date().toISOString(),
    });
  },

  reactivateBand(bandId: string): void {
    const band = this.getBand(bandId);
    if (!band) return;

    this.updateBand(bandId, {
      status: 'active',
      archivedAt: undefined,
    });
  },

  getBandHistory(bandId: string): BandHistoryRecord | undefined {
    const band = this.getBand(bandId);
    if (!band) return undefined;

    const songs = this.getSongs(bandId);
    const events = this.getRehearsals(bandId);

    return {
      bandId: band.id,
      bandName: band.name,
      genre: band.genre,
      status: band.status,
      archivedAt: band.archivedAt,
      finalLineup: band.members.map((m) => ({
        userId: m.userId,
        name: m.name,
        instrument: m.instrument,
        role: m.role,
        joinedAt: m.joinedAt,
      })),
      finalRepertoire: songs.map((s) => ({
        title: s.title,
        artist: s.artist,
        status: s.status,
      })),
      pastEventsCount: events.length,
    };
  },
};
