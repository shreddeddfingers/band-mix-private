'use client';

import React, { useState, useEffect } from 'react';
import { BandEvent, BandEventType, RSVPStatus, Band, BandSong } from '@/types';
import { useAuth } from '@/lib/auth-context';
import { DataStore, subscribeToStore } from '@/lib/data-store';
import {
  Calendar,
  Clock,
  MapPin,
  Music,
  Plus,
  Trash2,
  Lock,
  Sparkles,
  ListMusic,
  AlertCircle,
  X,
  Check,
  Radio,
  Mic,
  Disc,
} from 'lucide-react';
import { format, isAfter, parseISO } from 'date-fns';
import { clsx } from 'clsx';

interface RehearsalPlannerProps {
  bandId?: string;
  showCreateModalInitially?: boolean;
}

const EVENT_TYPE_BADGES: Record<
  BandEventType,
  { label: string; bg: string; text: string; border: string }
> = {
  rehearsal: {
    label: 'Rehearsal',
    bg: 'bg-cyan-500/15',
    text: 'text-cyan-300',
    border: 'border-cyan-500/30',
  },
  gig: {
    label: 'Live Gig / Concert',
    bg: 'bg-amber-500/20',
    text: 'text-amber-300',
    border: 'border-amber-500/40',
  },
  showcase: {
    label: 'Showcase',
    bg: 'bg-purple-500/15',
    text: 'text-purple-300',
    border: 'border-purple-500/30',
  },
  audition: {
    label: 'Audition',
    bg: 'bg-orange-500/15',
    text: 'text-orange-300',
    border: 'border-orange-500/30',
  },
  recording: {
    label: 'Recording Session',
    bg: 'bg-emerald-500/15',
    text: 'text-emerald-300',
    border: 'border-emerald-500/30',
  },
  other: {
    label: 'Special Event',
    bg: 'bg-studio-800',
    text: 'text-studio-300',
    border: 'border-studio-700',
  },
};

export function RehearsalPlanner({
  bandId,
  showCreateModalInitially = false,
}: RehearsalPlannerProps) {
  const { isAdmin, currentUser, activeDirectorId } = useAuth();
  const [events, setEvents] = useState<BandEvent[]>([]);
  const [bands, setBands] = useState<Band[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(showCreateModalInitially);

  // Form state
  const [selectedBandId, setSelectedBandId] = useState(bandId || '');
  const [eventType, setEventType] = useState<BandEventType>('rehearsal');
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('Studio A (Main Soundstage)');
  const [date, setDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  });
  const [startTime, setStartTime] = useState('17:00');
  const [endTime, setEndTime] = useState('19:00');
  const [callTime, setCallTime] = useState('');
  const [performanceTime, setPerformanceTime] = useState('');
  const [selectedSongIds, setSelectedSongIds] = useState<string[]>([]);
  const [customSetlistInput, setCustomSetlistInput] = useState('');
  const [notes, setNotes] = useState('');

  // Available repertoire songs for the selected band
  const [repertoireSongs, setRepertoireSongs] = useState<BandSong[]>([]);

  useEffect(() => {
    const loadData = () => {
      setEvents(DataStore.getRehearsals(bandId));
      setBands(DataStore.getBands(activeDirectorId));
    };

    loadData();
    const unsubReh = subscribeToStore('rehearsals', loadData);
    return () => unsubReh();
  }, [bandId, activeDirectorId]);

  useEffect(() => {
    if (bandId) {
      setSelectedBandId(bandId);
    } else if (bands.length > 0 && !selectedBandId) {
      setSelectedBandId(bands[0].id);
    }
  }, [bandId, bands, selectedBandId]);

  useEffect(() => {
    if (selectedBandId) {
      setRepertoireSongs(
        DataStore.getSongs(selectedBandId).filter((s) => s.status !== 'suggested')
      );
    }
  }, [selectedBandId]);

  const toggleSongSelection = (songId: string) => {
    setSelectedSongIds((prev) =>
      prev.includes(songId) ? prev.filter((id) => id !== songId) : [...prev, songId]
    );
  };

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !selectedBandId || !title.trim()) return;

    // Combine repertoire song titles + custom entered titles
    const chosenSongTitles = repertoireSongs
      .filter((s) => selectedSongIds.includes(s.id))
      .map((s) => `${s.title} (${s.artist})`);

    const customTitles = customSetlistInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const combinedSetlist = [...chosenSongTitles, ...customTitles];

    DataStore.createRehearsal({
      bandId: selectedBandId,
      eventType,
      title: title.trim(),
      location,
      date,
      startTime,
      endTime,
      callTime: callTime.trim() || undefined,
      performanceTime: performanceTime.trim() || undefined,
      notes: notes.trim(),
      setlist: combinedSetlist,
      repertoireSongIds: selectedSongIds,
    });

    // Reset
    setTitle('');
    setSelectedSongIds([]);
    setCustomSetlistInput('');
    setCallTime('');
    setPerformanceTime('');
    setNotes('');
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (!isAdmin) return;
    if (confirm('Are you sure you want to cancel this event?')) {
      DataStore.deleteRehearsal(id);
    }
  };

  const handleRSVP = (eventId: string, rsvp: RSVPStatus) => {
    if (!currentUser) return;
    DataStore.updateEventRSVP(eventId, currentUser.id, rsvp);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-studio-900 border border-studio-800 p-5 rounded-2xl">
        <div>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-bold text-white">
              Band Events & Rehearsal Schedule
            </h3>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-studio-800 text-studio-300 font-mono">
              {events.length} Scheduled
            </span>
          </div>
          <p className="text-xs text-studio-400 mt-1">
            Rehearsals, live concerts, and showcase call-times managed by Director Marcus Vance with student RSVP tracking.
          </p>
        </div>

        {isAdmin ? (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs sm:text-sm font-bold shadow-lg shadow-amber-500/10 transition shrink-0 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            Schedule Event / Rehearsal
          </button>
        ) : (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-studio-800/80 border border-studio-700 text-xs text-studio-400">
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span>Director-Managed Scheduling & RSVPs</span>
          </div>
        )}
      </div>

      {/* Events Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {events.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-studio-950 border border-dashed border-studio-800 rounded-2xl p-6 text-studio-400">
            <Calendar className="w-12 h-12 text-studio-600 mx-auto mb-3" />
            <h4 className="text-white font-semibold">No events scheduled</h4>
            <p className="text-xs text-studio-400 max-w-sm mx-auto mt-1">
              {isAdmin
                ? 'Check student availability in the band chat and schedule your first rehearsal or performance.'
                : 'Your Director has not scheduled any upcoming events for this band yet.'}
            </p>
          </div>
        ) : (
          events.map((event) => {
            const eventDate = parseISO(`${event.date}T${event.startTime}`);
            const isUpcoming = isAfter(eventDate, new Date());
            const badge = EVENT_TYPE_BADGES[event.eventType || 'rehearsal'];

            // RSVP stats
            const rsvps = event.rsvps || {};
            const attendingCount = Object.values(rsvps).filter((r) => r === 'attending').length;
            const declinedCount = Object.values(rsvps).filter((r) => r === 'declined').length;
            const myRSVP = currentUser ? rsvps[currentUser.id] : undefined;

            return (
              <div
                key={event.id}
                className={clsx(
                  'group relative bg-studio-900 border rounded-2xl p-5 transition shadow-sm flex flex-col justify-between space-y-4',
                  isUpcoming
                    ? 'border-studio-700/80 hover:border-amber-500/50'
                    : 'border-studio-800 opacity-75'
                )}
              >
                <div>
                  {/* Card Header: Band, Type Badge, Title, Delete */}
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                          {event.bandName}
                        </span>
                        <span
                          className={clsx(
                            'text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border',
                            badge.bg,
                            badge.text,
                            badge.border
                          )}
                        >
                          {badge.label}
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-white group-hover:text-amber-300 transition">
                        {event.title}
                      </h4>
                    </div>

                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(event.id)}
                        className="p-1.5 rounded-lg text-studio-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                        title="Cancel Event"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Timing & Location Box */}
                  <div className="space-y-1.5 text-xs text-studio-300 mb-3 bg-studio-950 p-3 rounded-xl border border-studio-800/80">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
                      <span className="font-semibold text-white">
                        {format(parseISO(event.date), 'EEEE, MMMM d, yyyy')}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-studio-400 shrink-0" />
                      <span>
                        {event.startTime} – {event.endTime}
                      </span>
                      {event.callTime && (
                        <span className="text-amber-400 font-bold ml-1 font-mono">
                          (Call: {event.callTime})
                        </span>
                      )}
                      {event.performanceTime && (
                        <span className="text-emerald-400 font-bold ml-1 font-mono">
                          (Live: {event.performanceTime})
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-studio-400 shrink-0" />
                      <span className="text-studio-200">{event.location}</span>
                    </div>
                  </div>

                  {/* Director Notes */}
                  {event.notes && (
                    <div className="text-xs text-studio-400 mb-3 bg-studio-950/40 p-2.5 rounded-lg border border-studio-800">
                      <span className="font-bold text-studio-300 block mb-0.5">
                        Director Agenda & Preparation:
                      </span>
                      {event.notes}
                    </div>
                  )}

                  {/* Setlist */}
                  {event.setlist && event.setlist.length > 0 && (
                    <div className="space-y-1.5 mb-2">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-studio-400">
                        <ListMusic className="w-3.5 h-3.5 text-amber-400" />
                        Target Rehearsal / Gig Setlist:
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {event.setlist.map((song, idx) => (
                          <span
                            key={idx}
                            className="text-xs px-2.5 py-1 rounded-lg bg-studio-950 border border-studio-800 text-studio-200 font-medium flex items-center gap-1"
                          >
                            <Music className="w-3 h-3 text-studio-400" />
                            {song}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* RSVP Attendance Strip */}
                <div className="pt-3 border-t border-studio-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 text-studio-400 text-[11px]">
                    <span className="font-semibold text-white">
                      RSVPs: <strong className="text-emerald-400">{attendingCount} Going</strong>
                      {declinedCount > 0 && (
                        <span className="text-rose-400 ml-1">({declinedCount} Out)</span>
                      )}
                    </span>
                  </div>

                  {/* Student RSVP Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleRSVP(event.id, 'attending')}
                      className={clsx(
                        'px-2.5 py-1 rounded-lg text-xs font-semibold transition border',
                        myRSVP === 'attending'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-studio-950 border-studio-800 text-studio-400 hover:text-white'
                      )}
                    >
                      Going ✓
                    </button>
                    <button
                      onClick={() => handleRSVP(event.id, 'tentative')}
                      className={clsx(
                        'px-2.5 py-1 rounded-lg text-xs font-semibold transition border',
                        myRSVP === 'tentative'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-studio-950 border-studio-800 text-studio-400 hover:text-white'
                      )}
                    >
                      Maybe
                    </button>
                    <button
                      onClick={() => handleRSVP(event.id, 'declined')}
                      className={clsx(
                        'px-2.5 py-1 rounded-lg text-xs font-semibold transition border',
                        myRSVP === 'declined'
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                          : 'bg-studio-950 border-studio-800 text-studio-400 hover:text-white'
                      )}
                    >
                      Can&apos;t Make It
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Admin Event Creation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
          <div className="relative w-full max-w-lg bg-studio-900 border border-studio-700 rounded-3xl shadow-2xl overflow-hidden my-8">
            <div className="p-6 pb-4 border-b border-studio-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    Schedule Band Event
                  </h3>
                  <p className="text-xs text-studio-400">
                    Create rehearsals, gigs, showcases, or recording sessions.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-studio-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-studio-300 uppercase tracking-wider mb-1.5">
                    Select Band
                  </label>
                  <select
                    value={selectedBandId}
                    onChange={(e) => setSelectedBandId(e.target.value)}
                    required
                    className="w-full bg-studio-950 border border-studio-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500"
                  >
                    {bands.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-studio-300 uppercase tracking-wider mb-1.5">
                    Event Type
                  </label>
                  <select
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value as BandEventType)}
                    className="w-full bg-studio-950 border border-studio-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500 font-semibold capitalize"
                  >
                    <option value="rehearsal">Rehearsal</option>
                    <option value="gig">Live Gig / Concert</option>
                    <option value="showcase">Studio Showcase</option>
                    <option value="recording">Recording Session</option>
                    <option value="audition">Audition</option>
                    <option value="other">Special Event</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-studio-300 uppercase tracking-wider mb-1.5">
                  Event Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={
                    eventType === 'gig'
                      ? 'e.g. Downtown Music Hall Spring Gig'
                      : 'e.g. Rhythm Section Tightening & Solos'
                  }
                  required
                  className="w-full bg-studio-950 border border-studio-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-studio-300 uppercase tracking-wider mb-1.5">
                    Date
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="w-full bg-studio-950 border border-studio-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-studio-300 uppercase tracking-wider mb-1.5">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                    className="w-full bg-studio-950 border border-studio-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-studio-300 uppercase tracking-wider mb-1.5">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                    className="w-full bg-studio-950 border border-studio-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Specific Gig / Showcase Times */}
              {(eventType === 'gig' || eventType === 'showcase' || eventType === 'recording') && (
                <div className="grid grid-cols-2 gap-3 p-3 bg-studio-950 rounded-2xl border border-studio-800">
                  <div>
                    <label className="block text-[11px] font-semibold text-amber-300 uppercase tracking-wider mb-1">
                      Call Time (Arrival)
                    </label>
                    <input
                      type="time"
                      value={callTime}
                      onChange={(e) => setCallTime(e.target.value)}
                      className="w-full bg-studio-900 border border-studio-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-emerald-300 uppercase tracking-wider mb-1">
                      Performance / Downbeat Time
                    </label>
                    <input
                      type="time"
                      value={performanceTime}
                      onChange={(e) => setPerformanceTime(e.target.value)}
                      className="w-full bg-studio-900 border border-studio-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-studio-300 uppercase tracking-wider mb-1.5">
                  Venue / Location
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Studio A, Rehearsal Hall 2, Downtown Amphitheater"
                  required
                  className="w-full bg-studio-950 border border-studio-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Master Repertoire Song Selector */}
              {repertoireSongs.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-studio-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span>Select From Master Repertoire</span>
                    <span className="text-amber-400">
                      {selectedSongIds.length} Selected
                    </span>
                  </label>
                  <div className="max-h-32 overflow-y-auto space-y-1.5 border border-studio-800 rounded-xl p-2 bg-studio-950">
                    {repertoireSongs.map((song) => {
                      const isSelected = selectedSongIds.includes(song.id);
                      return (
                        <div
                          key={song.id}
                          onClick={() => toggleSongSelection(song.id)}
                          className={clsx(
                            'p-2 rounded-lg cursor-pointer text-xs flex items-center justify-between transition',
                            isSelected
                              ? 'bg-amber-500/20 text-white font-semibold'
                              : 'text-studio-400 hover:bg-studio-900'
                          )}
                        >
                          <span>
                            {song.title} ({song.artist})
                          </span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-amber-400" />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-studio-300 uppercase tracking-wider mb-1.5">
                  Additional Songs (comma separated)
                </label>
                <input
                  type="text"
                  value={customSetlistInput}
                  onChange={(e) => setCustomSetlistInput(e.target.value)}
                  placeholder="e.g. Chameleon, Superstition, Cissy Strut"
                  className="w-full bg-studio-950 border border-studio-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-studio-300 uppercase tracking-wider mb-1.5">
                  Director Notes / Agendas
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Specific goals, charts to review, dress code..."
                  className="w-full bg-studio-950 border border-studio-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-studio-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-studio-400 hover:text-white text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition shadow-lg shadow-amber-500/10 flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  Publish Event & Notify Band
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
