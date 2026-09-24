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

// Recurring structured availability
export type DayOfWeek =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

export interface RecurringTimeWindow {
  id: string;
  dayOfWeek: DayOfWeek;
  startTime: string; // HH:mm (e.g. "16:30")
  endTime: string;   // HH:mm (e.g. "18:30")
}

// Lightweight Band Match Profile
export type HobbyInterest =
  | 'sports'
  | 'video_games'
  | 'anime_manga'
  | 'movies_tv'
  | 'art_design'
  | 'technology_computers'
  | 'outdoors'
  | 'skateboarding'
  | 'reading'
  | 'theater_acting'
  | 'content_creation'
  | 'other';

export type MusicalGoal =
  | 'learn_favorite_songs'
  | 'discover_new_music'
  | 'perform_live'
  | 'write_originals'
  | 'jam_improvise'
  | 'record_music'
  | 'make_videos'
  | 'improve_skills'
  | 'mostly_fun';

export type CommitmentLevel =
  | 'mostly_fun'
  | 'fun_and_improve'
  | 'serious_improve'
  | 'very_ambitious';

export type SocialStyle =
  | 'reserved_at_first'
  | 'middle'
  | 'outgoing_talkative';

export type BandEnvironmentPreference =
  | 'relaxed'
  | 'structured'
  | 'high_energy'
  | 'any';

export interface BandMatchProfile {
  hobbies: HobbyInterest[];
  musicalGoals: MusicalGoal[];
  commitmentLevel: CommitmentLevel;
  socialStyle: SocialStyle;
  preferredEnvironment: BandEnvironmentPreference;
  currentObsession?: string; // Optional: "Anything you're really into right now?"
}

// Private Sensitive User Document (stored at /users/{userId}/private/profile)
// Raw DOB is strictly restricted to owner and Director/Admin.
export interface PrivateUserProfile {
  userId: string;
  dateOfBirth?: string; // ISO format: YYYY-MM-DD
  guardianName?: string;
  guardianEmail?: string;
  guardianPhone?: string;
  updatedAt: string;
}

export type BrandPresetKey =
  | 'school_of_rock'
  | 'bach_to_rock'
  | 'highland'
  | 'conservatory'
  | 'custom';

export interface StudioBranding {
  studioName: string;
  tagline?: string;
  logoUrl?: string;
  accentColor?: string; // Hex color e.g. "#E11D48"
  presetKey?: BrandPresetKey;
  customWelcome?: string;
  badgeText?: string;
}

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
  ageGroup: AgeGroup; // Preserved for backward compatibility
  exactAge?: number;  // Calculated current age (e.g. 10, 13, 16) - safe for Director display
  pronouns?: string;  // Optional free-text (e.g. "he/him", "she/her", "they/them") - ZERO weight in matching
  availability?: RecurringTimeWindow[];
  bandMatchProfile?: BandMatchProfile;
  bio?: string;
  joinedAt: string;
  bandIds: string[];
  guardianId?: string;
  directorId?: string;  // Connected Director ID for student isolation
  studioName?: string;  // School/Studio/Program name (primarily for Directors)
  branding?: StudioBranding; // White-label customization for directors/studios
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
  createdBy: string;    // Director UID who created the band
  directorId?: string;   // Explicit Director UID for multi-director scoping
  createdAt: string;
  members: BandMember[];
  rehearsalSchedule?: string; // e.g. "Tuesdays 5:00 PM - 7:00 PM"
  status: 'active' | 'forming' | 'archived';
  archivedAt?: string;
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

// Master Repertoire & Setlist System
export type SongStatus =
  | 'suggested'
  | 'learning'
  | 'rehearsing'
  | 'performance_ready'
  | 'retired';

export type SongSentiment = 'really_want' | 'would_play' | 'neutral' | 'not_interested';

export interface SongSentimentSummary {
  reallyWant: number;
  wouldPlay: number;
  neutral: number;
  notInterested: number;
  totalVotes: number;
}

export interface BandSong {
  id: string;
  bandId: string;
  title: string;
  artist: string;
  key?: string;
  tempoBpm?: number;
  vocalistAssignments?: string[];
  directorNotes?: string;
  status: SongStatus;
  suggestedBy?: string; // Student userId (Director/admin only; masked from fellow students)
  sentimentSummary?: SongSentimentSummary;
  createdAt: string;
  updatedAt: string;
}

// Anonymous Individual Sentiment Vote
export interface SongVote {
  id: string; // `${songId}_${userId}`
  songId: string;
  bandId: string;
  userId: string;
  sentiment: SongSentiment;
  updatedAt: string;
}

// Persistent Band Announcements
export interface BandAnnouncement {
  id: string;
  bandId: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  isPinned: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

// Polymorphic Band Event (Superset & evolution of RehearsalEvent)
export type BandEventType = 'rehearsal' | 'gig' | 'showcase' | 'audition' | 'recording' | 'other';
export type RSVPStatus = 'attending' | 'declined' | 'tentative';

export interface BandEvent {
  id: string;
  bandId: string;
  bandName?: string;
  eventType: BandEventType;
  title: string;
  location: string;
  date: string;       // YYYY-MM-DD
  startTime: string;  // HH:mm
  endTime: string;    // HH:mm
  callTime?: string;  // HH:mm
  performanceTime?: string; // HH:mm
  notes?: string;
  repertoireSongIds?: string[];
  setlist?: string[]; // Cached title strings (backward compatibility with RehearsalEvent)
  rsvps?: Record<string, RSVPStatus>; // userId -> RSVPStatus
  createdBy: string;
  createdAt: string;
}

// Aliased for seamless backward compatibility with existing components
export type RehearsalEvent = BandEvent;

// Band History & Past Season Record
export interface BandHistoryRecord {
  bandId: string;
  bandName: string;
  genre: string;
  status: 'active' | 'forming' | 'archived';
  archivedAt?: string;
  finalLineup: {
    userId: string;
    name: string;
    instrument: InstrumentType;
    role: string;
    joinedAt: string;
  }[];
  finalRepertoire: { title: string; artist: string; status: SongStatus }[];
  pastEventsCount: number;
}

export interface InviteCode {
  code: string;
  bandId?: string;
  bandName?: string;
  directorId?: string;
  directorName?: string;
  studioName?: string;
  tagline?: string;
  accentColor?: string;
  logoUrl?: string;
  role: UserRole;
  createdAt: string;
  expiresAt: string;
  usedCount: number;
  maxUses?: number;
  label?: string;
}
