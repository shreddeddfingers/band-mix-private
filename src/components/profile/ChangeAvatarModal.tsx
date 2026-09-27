'use client';

import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  Sparkles,
  Link as LinkIcon,
  Check,
  Camera,
  Loader2,
  User,
} from 'lucide-react';
import { resizeImageFile } from '@/lib/image-utils';

interface ChangeAvatarModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAvatar?: string;
  userName?: string;
  onSave: (newAvatarUrl: string) => Promise<void> | void;
}

const AVATAR_PRESETS = [
  {
    label: 'Electric Guitarist',
    url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=400',
  },
  {
    label: 'Acoustic Guitarist',
    url: 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&q=80&w=400',
  },
  {
    label: 'Drummer',
    url: 'https://images.unsplash.com/photo-1519892300165-cb5542fb47c7?auto=format&fit=crop&q=80&w=400',
  },
  {
    label: 'Vocalist / Mic',
    url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=400',
  },
  {
    label: 'Bass Player',
    url: 'https://images.unsplash.com/photo-1464375117522-1311d6a5b81f?auto=format&fit=crop&q=80&w=400',
  },
  {
    label: 'Keyboardist / Piano',
    url: 'https://images.unsplash.com/photo-1520523839898-50712825e617?auto=format&fit=crop&q=80&w=400',
  },
  {
    label: 'Horns / Saxophone',
    url: 'https://images.unsplash.com/photo-1525994886773-080587e161c2?auto=format&fit=crop&q=80&w=400',
  },
  {
    label: 'Studio Producer',
    url: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80&w=400',
  },
  {
    label: 'Stage Spotlight',
    url: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&q=80&w=400',
  },
  {
    label: 'Rockstar Bot',
    url: 'https://api.dicebear.com/7.x/bottts/svg?seed=rockstar',
  },
  {
    label: 'Adventurer Indie',
    url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=guitarist',
  },
  {
    label: 'Singing Artist',
    url: 'https://api.dicebear.com/7.x/micah/svg?seed=singer',
  },
];

export function ChangeAvatarModal({
  isOpen,
  onClose,
  currentAvatar,
  userName = 'Musician',
  onSave,
}: ChangeAvatarModalProps) {
  const [selectedAvatar, setSelectedAvatar] = useState<string>(
    currentAvatar || AVATAR_PRESETS[0].url
  );
  const [activeTab, setActiveTab] = useState<'upload' | 'presets' | 'url'>('upload');
  const [urlInput, setUrlInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);
    setIsProcessing(true);
    try {
      const compressedDataUrl = await resizeImageFile(file, 600, 600, 0.85);
      setSelectedAvatar(compressedDataUrl);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to process image');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApplyUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    setSelectedAvatar(urlInput.trim());
    setUrlInput('');
  };

  const handleSave = async () => {
    try {
      setIsProcessing(true);
      await onSave(selectedAvatar);
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to save avatar');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-studio-900 border border-studio-700/80 rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-studio-800 bg-studio-950/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                Change Profile Picture
              </h2>
              <p className="text-[11px] text-studio-400">
                Updating picture for {userName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-studio-400 hover:text-white hover:bg-studio-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          {/* Live Preview Bar */}
          <div className="flex items-center justify-center gap-4 p-3 bg-studio-950/60 rounded-2xl border border-studio-800/80">
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 border-amber-500/80 shadow-lg bg-studio-800 shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedAvatar}
                alt="Avatar preview"
                className="w-full h-full object-cover"
                onError={() => {
                  setErrorMessage('Failed to load selected image. Please try another.');
                }}
              />
              {isProcessing && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <Loader2 className="w-5 h-5 text-amber-400 animate-spin" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-white uppercase tracking-wider">
                Photo Preview
              </div>
              <p className="text-[11px] text-studio-400 mt-0.5">
                This image will appear on your profile, ensemble rosters, and band messages.
              </p>
            </div>
          </div>

          {errorMessage && (
            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {errorMessage}
            </div>
          )}

          {/* Source Tabs */}
          <div className="flex rounded-xl bg-studio-950 p-1 border border-studio-800">
            <button
              onClick={() => setActiveTab('upload')}
              className={`flex-1 py-1.5 sm:py-2 text-xs font-semibold rounded-lg transition flex items-center justify-center gap-1.5 ${
                activeTab === 'upload'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-studio-400 hover:text-white'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              Upload Photo
            </button>
            <button
              onClick={() => setActiveTab('presets')}
              className={`flex-1 py-1.5 sm:py-2 text-xs font-semibold rounded-lg transition flex items-center justify-center gap-1.5 ${
                activeTab === 'presets'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-studio-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Presets
            </button>
            <button
              onClick={() => setActiveTab('url')}
              className={`flex-1 py-1.5 sm:py-2 text-xs font-semibold rounded-lg transition flex items-center justify-center gap-1.5 ${
                activeTab === 'url'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-studio-400 hover:text-white'
              }`}
            >
              <LinkIcon className="w-3.5 h-3.5" />
              Image URL
            </button>
          </div>

          {/* Tab 1: Upload from device */}
          {activeTab === 'upload' && (
            <div className="space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-studio-700 hover:border-amber-400/80 bg-studio-950/40 hover:bg-studio-950/80 rounded-2xl p-6 text-center transition flex flex-col items-center justify-center gap-2 group cursor-pointer"
              >
                <div className="w-12 h-12 rounded-full bg-studio-800 border border-studio-700 flex items-center justify-center text-amber-400 group-hover:scale-110 transition">
                  <Camera className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs sm:text-sm font-bold text-white group-hover:text-amber-300 transition">
                    Take Photo or Choose from Library
                  </span>
                  <p className="text-[11px] text-studio-400 mt-0.5">
                    Works directly with your iPhone camera, photo roll, or desktop files
                  </p>
                </div>
              </button>
            </div>
          )}

          {/* Tab 2: Curated Musician Presets */}
          {activeTab === 'presets' && (
            <div className="space-y-2">
              <div className="text-[11px] text-studio-400 font-medium">
                Choose a musician or instrument avatar:
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-52 overflow-y-auto p-1">
                {AVATAR_PRESETS.map((preset, idx) => {
                  const isSelected = selectedAvatar === preset.url;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setSelectedAvatar(preset.url);
                        setErrorMessage(null);
                      }}
                      className={`relative group rounded-xl overflow-hidden aspect-square border-2 transition-all ${
                        isSelected
                          ? 'border-amber-400 scale-95 shadow-md shadow-amber-500/20'
                          : 'border-studio-800 hover:border-studio-600'
                      }`}
                      title={preset.label}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={preset.url}
                        alt={preset.label}
                        className="w-full h-full object-cover"
                      />
                      {isSelected && (
                        <div className="absolute inset-0 bg-amber-500/30 flex items-center justify-center">
                          <Check className="w-5 h-5 text-amber-300 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tab 3: Custom Image URL */}
          {activeTab === 'url' && (
            <form onSubmit={handleApplyUrl} className="space-y-2">
              <label className="text-[11px] text-studio-400 block font-medium">
                Paste any web image URL:
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://example.com/avatar.jpg"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="flex-1 bg-studio-950 border border-studio-700 rounded-xl px-3 py-2 text-xs text-white placeholder-studio-500 focus:outline-none focus:border-amber-500"
                />
                <button
                  type="submit"
                  className="px-3.5 py-2 rounded-xl bg-studio-800 hover:bg-studio-700 text-white text-xs font-semibold transition"
                >
                  Preview
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-4 sm:p-5 border-t border-studio-800 bg-studio-950/70 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2 rounded-xl bg-studio-800 hover:bg-studio-700 text-studio-300 hover:text-white text-xs font-semibold transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isProcessing || !selectedAvatar}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition shadow-lg shadow-amber-500/20 disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                Save Profile Picture
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
