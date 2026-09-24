'use client';

import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Copy, Check, Printer, QrCode, Sparkles, Music, Share2, Building } from 'lucide-react';
import { DataStore } from '@/lib/data-store';
import { useAuth } from '@/lib/auth-context';
import { InviteCode, Band } from '@/types';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedBandId?: string;
}

export function QRCodeModal({
  isOpen,
  onClose,
  preselectedBandId,
}: QRCodeModalProps) {
  const { currentUser, activeDirectorId, activeBranding } = useAuth();
  const [bands, setBands] = useState<Band[]>([]);
  const [selectedBandId, setSelectedBandId] = useState<string>(preselectedBandId || '');
  const [activeCode, setActiveCode] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState('');

  const dirId = activeDirectorId || currentUser?.id || 'director-main';
  const brandColor = activeBranding?.accentColor || '#F59E0B';
  const studioName = activeBranding?.studioName || currentUser?.studioName || 'Music Studio';
  const tagline = activeBranding?.tagline || 'Ensemble Performance & Musician Training';
  const logoUrl = activeBranding?.logoUrl;
  const directorName = currentUser?.name || 'Director';

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
    const dirBands = DataStore.getBands(dirId);
    setBands(dirBands);

    // Find or create appropriate code for this director
    const existing = DataStore.getInvites(dirId);
    if (preselectedBandId) {
      setSelectedBandId(preselectedBandId);
      const bandCode = existing.find((i) => i.bandId === preselectedBandId);
      if (bandCode) {
        setActiveCode(bandCode.code);
      } else {
        const created = DataStore.createInvite({
          bandId: preselectedBandId,
          label: 'Band Join QR',
          directorId: dirId,
          directorName,
          studioName,
        });
        setActiveCode(created.code);
      }
    } else {
      const general = existing.find((i) => !i.bandId);
      if (general) {
        setActiveCode(general.code);
      } else {
        const created = DataStore.createInvite({
          label: `${studioName} Student Intake Pass`,
          directorId: dirId,
          directorName,
          studioName,
        });
        setActiveCode(created.code);
      }
    }
  }, [isOpen, preselectedBandId, dirId, directorName, studioName]);

  if (!isOpen) return null;

  const handleBandSelect = (bandId: string) => {
    setSelectedBandId(bandId);
    const existing = DataStore.getInvites(dirId);
    if (bandId) {
      const found = existing.find((i) => i.bandId === bandId);
      if (found) {
        setActiveCode(found.code);
      } else {
        const created = DataStore.createInvite({
          bandId,
          label: `Invite for ${bands.find((b) => b.id === bandId)?.name}`,
          directorId: dirId,
          directorName,
          studioName,
        });
        setActiveCode(created.code);
      }
    } else {
      const general = existing.find((i) => !i.bandId);
      if (general) {
        setActiveCode(general.code);
      } else {
        const created = DataStore.createInvite({
          label: `${studioName} Pass`,
          directorId: dirId,
          directorName,
          studioName,
        });
        setActiveCode(created.code);
      }
    }
  };

  const inviteUrl = `${origin}/onboard?code=${activeCode}${
    selectedBandId ? `&bandId=${selectedBandId}` : ''
  }`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const printCard = () => {
    window.print();
  };

  const selectedBand = bands.find((b) => b.id === selectedBandId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-studio-900 border border-studio-700/80 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-studio-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Dynamic QR Onboarding
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Director Tool
                </span>
              </h3>
              <p className="text-xs text-studio-400">
                Display or print for students to scan with their mobile camera.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-studio-400 hover:text-white p-1 rounded-lg hover:bg-studio-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Target Band Selector */}
        <div className="px-6 pt-4">
          <label className="block text-xs font-semibold text-studio-300 uppercase tracking-wider mb-2">
            Target Destination
          </label>
          <select
            value={selectedBandId}
            onChange={(e) => handleBandSelect(e.target.value)}
            className="w-full bg-studio-950 border border-studio-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/80 transition"
          >
            <option value="">General Studio Roster (Select Band Later)</option>
            {bands.map((band) => (
              <option key={band.id} value={band.id}>
                Direct Join: {band.name} ({band.genre})
              </option>
            ))}
          </select>
        </div>

        {/* QR Code Presentation Card */}
        <div className="p-6 flex flex-col items-center">
          <div
            className="p-5 bg-white rounded-2xl shadow-xl flex flex-col items-center border-4"
            style={{ borderColor: `${brandColor}40` }}
          >
            {logoUrl && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={logoUrl}
                alt={studioName}
                className="w-12 h-12 object-contain mb-2 rounded"
              />
            )}
            <div className="text-center mb-2">
              <div className="text-sm font-black text-slate-900 tracking-tight">
                {studioName}
              </div>
              {tagline && (
                <div className="text-[10px] text-slate-500 font-medium">
                  {tagline}
                </div>
              )}
            </div>

            <QRCodeSVG
              value={inviteUrl || 'https://bandmix.local/onboard'}
              size={180}
              level="H"
              includeMargin={false}
            />
            <div className="mt-3 text-center">
              <p
                className="text-[10px] font-bold uppercase tracking-wider font-mono"
                style={{ color: brandColor }}
              >
                Scan with Mobile Camera to Enroll
              </p>
              <p className="text-xs font-mono font-bold text-slate-800">
                Code: {activeCode}
              </p>
            </div>
          </div>

          {/* Details below QR */}
          <div className="mt-4 text-center">
            <h4 className="text-sm font-semibold text-white">
              {selectedBand ? `Join "${selectedBand.name}"` : `${studioName} Musician Intake`}
            </h4>
            <p className="text-xs text-studio-400 mt-0.5 max-w-sm">
              Students will pick instruments, rehearsal availability, and musical styles for director matching.
            </p>
          </div>

          {/* Link Box */}
          <div className="mt-4 w-full flex items-center gap-2 bg-studio-950 p-2.5 rounded-xl border border-studio-800">
            <input
              type="text"
              readOnly
              value={inviteUrl}
              className="bg-transparent text-xs text-studio-300 font-mono w-full outline-none truncate"
            />
            <button
              onClick={copyToClipboard}
              className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shrink-0"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copy Link
                </>
              )}
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-studio-950/60 border-t border-studio-800 flex items-center justify-between">
          <span className="text-xs text-studio-400 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Dynamic single-scan intake
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={printCard}
              className="px-4 py-2 bg-studio-800 hover:bg-studio-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Rehearsal Room Flyer
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
