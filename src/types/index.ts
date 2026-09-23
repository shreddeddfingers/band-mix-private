export type InstrumentType =
  | 'drums'
  | 'bass'
  | 'vocals'
  | 'piano'
  | 'keyboard'
  | 'guitars'
  | 'horns'
  | 'other';

export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export type AgeGroup = 'kids' | 'teens' | 'adults';

export type UserRole = 'admin' | 'student';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  instruments: InstrumentType[];
  primaryInstrument: InstrumentType;
  skillLevel: SkillLevel;
  musicalStyles: string[];
  ageGroup: AgeGroup;
  bio?: string;
  joinedAt: string;
  bandIds: string[];
}

export interface BandMember {
  userId: string;
  name: string;
  role: 'director' | 'member' | 'leader';
  instrument: InstrumentType;
  avatar: string;
  joinedAt: string;
}

export interface Band {
  id: string;
  name: string;
  genre: string;
  description: string;
  coverImage?: string;
  createdBy: string;
  createdAt: string;
  members: BandMember[];
  rehearsalSchedule?: string; // e.g. "Tuesdays 5:00 PM - 7:00 PM"
  status: 'active' | 'forming' | 'archived';
}

export interface ChatMessage {
  id: string;
  bandId: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  senderInstrument?: InstrumentType;
  senderAvatar: string;
  text: string;
  timestamp: string;
  isPinnedRehearsalNotice?: boolean;
}

export interface RehearsalEvent {
  id: string;
  bandId: string;
  bandName?: string;
  title: string;
  location: string; // e.g. "Studio A", "Rehearsal Hall 2"
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  notes?: string;
  setlist?: string[];
  createdBy: string;
  createdAt: string;
}

export interface InviteCode {
  code: string;
  bandId?: string;
  bandName?: string;
  role: UserRole;
  createdAt: string;
  expiresAt: string;
  usedCount: number;
  maxUses?: number;
  label?: string;
}
