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
  Music,
} from 'lucide-react';
import { resizeImageFile } from '@/lib/image-utils';

interface ChangeBandCoverModalProps {
  isOpen: boolean;
  onClose: () => void;
  bandName: string;
  currentCover?: string;
  onSave: (newCoverUrl: string) => Promise<void> | void;
}

const BAND_COVER_PRESETS = [
  {
    label: 'Live Concert Stage & Lights',
    url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=1200',
  },
  {
    label: 'Studio Rehearsal Room',
    url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=1200',
  },
  {
    label: 'Neon Rock Garage',
    url: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&q=80&w=1200',
  },
  {
    label: 'Indie Stage Spotlight',
    url: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&q=80&w=1200',
  },
  {
    label: 'Modern Synthwave Studio',
    url: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80&w=1200',
  },
  {
    label: 'Golden Hour Acoustic Jam',
    url: 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&q=80&w=1200',
  },
  {
    label: 'Velvet Jazz Lounge',
    url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=1200',
  },
  {
    label: 'High Energy Rock Show',
    url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=1200',
  },
];

export function ChangeBandCoverModal({
  isOpen,
  onClose,
  bandName,
  currentCover,
  onSave,
}: ChangeBandCoverModalProps) {
  const [selectedCover, setSelectedCover] = useState<string>(
    currentCover || BAND_COVER_PRESETS[0].url
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
      // 1200x800 for high definition yet compact band cover
      const compressedDataUrl = await resizeImageFile(file, 1200, 800, 0.85);
      setSelectedCover(compressedDataUrl);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to process image');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApplyUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    setSelectedCover(urlInput.trim());
    setUrlInput('');
  };

  const handleSave = async () => {
    try {
      setIsProcessing(true);
      await onSave(selectedCover);
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to save band picture');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-studio-900 border border-studio-700/80 rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-studio-800 bg-studio-950/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                Change Band Picture
              </h2>
              <p className="text-[11px] text-studio-400">
                Updating cover image for <strong className="text-white">{bandName}</strong>
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
          {/* Live Preview Banner */}
          <div className="space-y-1.5">
            <div className="text-[11px] font-bold text-studio-400 uppercase tracking-wider flex items-center justify-between">
              <span>Cover Preview</span>
              <span className="text-[10px] text-studio-500 font-mono">16:9 widescreen</span>
            </div>
            <div className="relative h-36 sm:h-44 rounded-2xl overflow-hidden border-2 border-amber-500/60 shadow-lg bg-studio-950">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedCover}
                alt="Band cover preview"
                className="w-full h-full object-cover"
                onError={() => {
                  setErrorMessage('Failed to load selected image. Please try another.');
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex items-end p-3 sm:p-4">
                <span className="text-white font-black text-lg sm:text-xl drop-shadow">
                  {bandName}
                </span>
              </div>
              {isProcessing && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
                </div>
              )}
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
              Upload Image
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
              Stage Presets
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
                    Take Photo or Choose Band Picture from Library
                  </span>
                  <p className="text-[11px] text-studio-400 mt-0.5">
                    Works on iPhone, iPad, Android, and Desktop
                  </p>
                </div>
              </button>
            </div>
          )}

          {/* Tab 2: Curated Band Presets */}
          {activeTab === 'presets' && (
            <div className="space-y-2">
              <div className="text-[11px] text-studio-400 font-medium">
                Choose a high-energy stage or studio aesthetic:
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-52 overflow-y-auto p-1">
                {BAND_COVER_PRESETS.map((preset, idx) => {
                  const isSelected = selectedCover === preset.url;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setSelectedCover(preset.url);
                        setErrorMessage(null);
                      }}
                      className={`relative group rounded-xl overflow-hidden aspect-video border-2 transition-all text-left ${
                        isSelected
                          ? 'border-amber-400 scale-95 shadow-md shadow-amber-500/20'
                          : 'border-studio-800 hover:border-studio-600'
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={preset.url}
                        alt={preset.label}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-1.5">
                        <span className="text-[10px] text-white font-semibold line-clamp-1 leading-tight">
                          {preset.label}
                        </span>
                      </div>
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
                  placeholder="https://images.unsplash.com/..."
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
            disabled={isProcessing || !selectedCover}
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
                Save Band Picture
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
