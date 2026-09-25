'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { StudioBranding, BrandPresetKey } from '@/types';
import { BRAND_PRESETS } from '@/lib/data-store';
import {
  Palette,
  X,
  Check,
  Sparkles,
  Building,
  Image as ImageIcon,
  Type,
  Radio,
  Eye,
  Flame,
  Upload,
  Trash2,
  RefreshCw,
  Camera,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { clsx } from 'clsx';

interface StudioBrandingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_OPTIONS: {
  key: BrandPresetKey;
  label: string;
  sublabel: string;
  color: string;
}[] = [
  {
    key: 'school_of_rock',
    label: 'School of Rock',
    sublabel: 'Crimson Red • Performance Rock Program',
    color: '#E11D48',
  },
  {
    key: 'bach_to_rock',
    label: 'Bach to Rock',
    sublabel: 'Electric Blue • Contemporary Academy',
    color: '#2563EB',
  },
  {
    key: 'highland',
    label: 'Highland Studio',
    sublabel: 'Studio Amber • Classic Flagship',
    color: '#F59E0B',
  },
  {
    key: 'conservatory',
    label: 'Metropolitan',
    sublabel: 'Emerald • Premier Conservatory',
    color: '#10B981',
  },
  {
    key: 'custom',
    label: 'Custom Brand',
    sublabel: 'Your Name, Palette & Logo',
    color: '#8B5CF6',
  },
];

const COLOR_SWATCHES = [
  { label: 'School of Rock Red', value: '#E11D48' },
  { label: 'Electric Blue', value: '#2563EB' },
  { label: 'Studio Amber', value: '#F59E0B' },
  { label: 'Emerald Green', value: '#10B981' },
  { label: 'Royal Purple', value: '#8B5CF6' },
  { label: 'Cyber Orange', value: '#F97316' },
  { label: 'Hot Pink', value: '#EC4899' },
  { label: 'Neon Cyan', value: '#06B6D4' },
  { label: 'Stealth Slate', value: '#64748B' },
];

export function StudioBrandingModal({ isOpen, onClose }: StudioBrandingModalProps) {
  const { activeBranding, updateStudioBranding, currentUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [studioName, setStudioName] = useState(activeBranding?.studioName || '');
  const [tagline, setTagline] = useState(activeBranding?.tagline || '');
  const [accentColor, setAccentColor] = useState(
    activeBranding?.accentColor || activeBranding?.brandColor || '#F59E0B'
  );
  const [logoUrl, setLogoUrl] = useState(activeBranding?.logoUrl || '');
  const [customWelcome, setCustomWelcome] = useState(activeBranding?.customWelcome || '');
  const [badgeText, setBadgeText] = useState(activeBranding?.badgeText || 'STUDIO PLATFORM');
  const [selectedPreset, setSelectedPreset] = useState<BrandPresetKey>(
    activeBranding?.presetKey || 'custom'
  );
  const [isSaved, setIsSaved] = useState(false);
  const [showUrlFallback, setShowUrlFallback] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  useEffect(() => {
    if (activeBranding) {
      setStudioName(activeBranding.studioName || currentUser?.studioName || 'Music Studio');
      setTagline(activeBranding.tagline || 'Ensemble Performance & Musician Training');
      setAccentColor(activeBranding.accentColor || activeBranding.brandColor || '#F59E0B');
      setLogoUrl(activeBranding.logoUrl || '');
      setCustomWelcome(activeBranding.customWelcome || '');
      setBadgeText(activeBranding.badgeText || 'STUDIO PLATFORM');
      setSelectedPreset(activeBranding.presetKey || 'custom');
    }
  }, [activeBranding, currentUser, isOpen]);

  if (!isOpen) return null;

  // Process and downscale uploaded photo/image client-side via canvas
  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setIsProcessingImage(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_DIM = 512;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_DIM) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/webp', 0.88);
          setLogoUrl(compressedDataUrl);
        }
        setIsProcessingImage(false);
      };
      img.onerror = () => setIsProcessingImage(false);
      img.src = e.target?.result as string;
    };
    reader.onerror = () => setIsProcessingImage(false);
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleSelectPreset = (key: BrandPresetKey) => {
    setSelectedPreset(key);
    const preset = BRAND_PRESETS[key];
    if (preset) {
      setStudioName(preset.studioName);
      setTagline(preset.tagline || '');
      setAccentColor(preset.accentColor || '#F59E0B');
      setLogoUrl(preset.logoUrl || '');
      setCustomWelcome(preset.customWelcome || '');
      setBadgeText(preset.badgeText || 'STUDIO PLATFORM');
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: StudioBranding = {
      studioName: studioName.trim() || 'Music Studio',
      tagline: tagline.trim() || undefined,
      accentColor: accentColor || '#F59E0B',
      brandColor: accentColor || '#F59E0B',
      logoUrl: logoUrl.trim() || undefined,
      customWelcome: customWelcome.trim() || undefined,
      badgeText: badgeText.trim() || 'STUDIO PLATFORM',
      presetKey: selectedPreset,
    };

    updateStudioBranding(updated);
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 700);
  };

  const isDarkColor =
    accentColor === '#E11D48' ||
    accentColor === '#2563EB' ||
    accentColor === '#8B5CF6' ||
    accentColor === '#64748B' ||
    accentColor === '#10B981';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-studio-900 border border-studio-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Hidden native file input for camera roll & file system */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml,image/*"
          className="hidden"
          onChange={handleFileInputChange}
        />

        {/* Modal Header */}
        <div className="p-6 pb-4 border-b border-studio-800 bg-studio-900/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg transition-colors"
              style={{ backgroundColor: `${accentColor}25`, color: accentColor }}
            >
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                White-Label Studio Branding
                <span
                  className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border"
                  style={{
                    backgroundColor: `${accentColor}20`,
                    borderColor: `${accentColor}40`,
                    color: accentColor,
                  }}
                >
                  Enterprise Theme Engine
                </span>
              </h2>
              <p className="text-xs text-studio-400">
                Custom studio brand, logo, and colors permeate the entire application.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-studio-400 hover:text-white rounded-xl hover:bg-studio-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handleSave} className="p-6 space-y-6 overflow-y-auto">
          {/* 1-Click Brand Presets */}
          <div>
            <label className="block text-xs font-bold text-studio-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              1-Click Brand Templates & Presets
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {PRESET_OPTIONS.map((p) => {
                const isSelected = selectedPreset === p.key;
                return (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => handleSelectPreset(p.key)}
                    className={clsx(
                      'p-3 rounded-2xl border text-left transition flex flex-col justify-between gap-2 relative overflow-hidden',
                      isSelected
                        ? 'bg-studio-800/90 border-2 shadow-lg shadow-black/40'
                        : 'bg-studio-950/60 border-studio-800 hover:border-studio-700 hover:bg-studio-800/40 text-studio-300'
                    )}
                    style={isSelected ? { borderColor: p.color } : {}}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3.5 h-3.5 rounded-full shadow-sm shrink-0"
                          style={{ backgroundColor: p.color }}
                        />
                        <span className="text-xs font-bold text-white truncate">{p.label}</span>
                      </div>
                      {isSelected && <Check className="w-4 h-4 shrink-0" style={{ color: p.color }} />}
                    </div>
                    <p className="text-[10px] text-studio-400 line-clamp-1">{p.sublabel}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Live Dual Preview Card */}
          <div className="p-4 rounded-2xl bg-studio-950 border border-studio-800 space-y-3 shadow-inner">
            <div className="text-[11px] font-bold text-studio-400 uppercase tracking-wider flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-purple-400" />
              Live Interactive Theme Preview
            </div>

            {/* Preview 1: Header / Navigation Mock */}
            <div className="p-3 bg-studio-900 rounded-xl border border-studio-800 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-2.5">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt={studioName}
                    className="w-9 h-9 rounded-xl object-cover border border-studio-700 shadow-md"
                  />
                ) : (
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center font-black shadow-md text-white"
                    style={{ backgroundColor: accentColor }}
                  >
                    <Radio className="w-5 h-5" />
                  </div>
                )}
                <div>
                  <div className="text-sm font-black text-white leading-tight">
                    {studioName || 'My Music Studio'}
                  </div>
                  <div
                    className="text-[9px] font-bold tracking-wider uppercase font-mono"
                    style={{ color: accentColor }}
                  >
                    {badgeText || 'STUDIO PLATFORM'}
                  </div>
                </div>
              </div>

              <div
                className="text-[10px] font-bold px-3 py-1 rounded-xl border shadow-sm"
                style={{
                  backgroundColor: `${accentColor}20`,
                  borderColor: `${accentColor}40`,
                  color: accentColor,
                }}
              >
                Director Workspace
              </div>
            </div>

            {/* Preview 2: Dashboard Hero & CTA Preview */}
            <div
              className="p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              style={{
                backgroundColor: `${accentColor}12`,
                borderColor: `${accentColor}30`,
              }}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: `${accentColor}25`, color: accentColor }}
                  >
                    STUDIO ACCENT
                  </span>
                  <span className="font-bold text-white text-xs">
                    {studioName || 'Studio'} Hub
                  </span>
                </div>
                <p className="text-[11px] text-studio-300 italic">
                  &ldquo;{customWelcome || tagline || 'Empowering musicians on stage and in life.'}&rdquo;
                </p>
              </div>

              {/* Sample primary CTA button showing dynamic contrast */}
              <div
                className="px-4 py-2 rounded-xl text-xs font-bold shadow-md shrink-0 flex items-center justify-center gap-1.5 transition"
                style={{
                  backgroundColor: accentColor,
                  color: isDarkColor ? '#FFFFFF' : '#020617',
                }}
              >
                <span>Primary CTA</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>

          {/* Native Photo & Logo Upload Section */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-studio-300 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-purple-400" />
                Studio Brand Logo (Photos & Files)
              </span>
              {logoUrl && (
                <span className="text-[10px] font-semibold text-emerald-400 flex items-center gap-1">
                  <Check className="w-3 h-3" /> Logo Active
                </span>
              )}
            </label>

            {logoUrl ? (
              /* Logo Active Display Card */
              <div className="p-4 bg-studio-950 border border-studio-800 rounded-2xl flex items-center justify-between gap-4 shadow-inner">
                <div className="flex items-center gap-3">
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-studio-700 bg-studio-900 shadow-md shrink-0">
                    <img
                      src={logoUrl}
                      alt="Brand Logo"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">Custom Brand Logo</div>
                    <div className="text-xs text-studio-400">
                      Optimized for navigation, dashboard & QR flyers
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-studio-800 hover:bg-studio-700 text-white text-xs font-semibold border border-studio-700 transition"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-studio-400" />
                    Replace
                  </button>
                  <button
                    type="button"
                    onClick={() => setLogoUrl('')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold border border-rose-500/20 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              /* Upload Dropzone Card */
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={clsx(
                  'p-6 border-2 border-dashed rounded-2xl text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 group',
                  isDragging
                    ? 'border-purple-500 bg-purple-500/10'
                    : 'border-studio-700 hover:border-purple-400 bg-studio-950/70 hover:bg-studio-900'
                )}
              >
                <div className="w-12 h-12 rounded-2xl bg-purple-500/15 text-purple-400 flex items-center justify-center border border-purple-500/20 group-hover:scale-105 transition-transform">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">
                    {isProcessingImage
                      ? 'Optimizing Image...'
                      : 'Choose Photo from iPhone or Computer'}
                  </div>
                  <div className="text-xs text-studio-400 mt-0.5">
                    Tap to open Camera Roll, Photos, or Files • PNG, JPG, WebP
                  </div>
                </div>
              </div>
            )}

            {/* Optional URL Toggle */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowUrlFallback(!showUrlFallback)}
                className="text-[11px] text-studio-400 hover:text-studio-200 underline transition"
              >
                {showUrlFallback ? 'Hide URL input' : 'Or paste an image web URL instead'}
              </button>
              {showUrlFallback && (
                <input
                  type="url"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://example.com/logo.png"
                  className="mt-1.5 w-full bg-studio-950 border border-studio-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-studio-500 focus:outline-none focus:border-purple-500 transition"
                />
              )}
            </div>
          </div>

          {/* Form Fields: School Name & Tagline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="brand-studio-name"
                className="block text-xs font-bold text-studio-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5"
              >
                <Building className="w-3.5 h-3.5 text-purple-400" />
                School or Studio Name *
              </label>
              <input
                id="brand-studio-name"
                name="organization"
                type="text"
                autoComplete="organization"
                value={studioName}
                onChange={(e) => setStudioName(e.target.value)}
                placeholder="e.g. School of Rock"
                required
                className="w-full bg-studio-950 border border-studio-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition"
              />
            </div>

            <div>
              <label
                htmlFor="brand-tagline"
                className="block text-xs font-bold text-studio-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5"
              >
                <Type className="w-3.5 h-3.5 text-blue-400" />
                Studio Tagline / Motto
              </label>
              <input
                id="brand-tagline"
                name="brand-tagline"
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="e.g. Inspiring the world to rock"
                className="w-full bg-studio-950 border border-studio-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition"
              />
            </div>
          </div>

          {/* Color Accent Picker */}
          <div>
            <label className="block text-xs font-bold text-studio-300 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-red-400" />
                Primary Studio Accent Color (App-Wide Theme)
              </span>
              <span className="font-mono text-xs text-studio-300 px-2 py-0.5 rounded bg-studio-950 border border-studio-800">
                {accentColor}
              </span>
            </label>
            <div className="flex flex-wrap items-center gap-2">
              {COLOR_SWATCHES.map((swatch) => (
                <button
                  key={swatch.value}
                  type="button"
                  onClick={() => setAccentColor(swatch.value)}
                  className={clsx(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition',
                    accentColor.toLowerCase() === swatch.value.toLowerCase()
                      ? 'border-white text-white shadow-md bg-studio-800'
                      : 'border-studio-800 text-studio-400 hover:text-white bg-studio-950'
                  )}
                >
                  <span
                    className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                    style={{ backgroundColor: swatch.value }}
                  />
                  <span>{swatch.label}</span>
                </button>
              ))}

              {/* Native Eyedropper Color Picker */}
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl border border-studio-800 bg-studio-950">
                <input
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="w-6 h-6 rounded-md cursor-pointer bg-transparent border-0"
                  title="Pick custom hex color"
                />
                <span className="text-[11px] text-studio-400 font-mono">Custom</span>
              </div>
            </div>
          </div>

          {/* Custom Welcome Message */}
          <div>
            <label
              htmlFor="brand-welcome-msg"
              className="block text-xs font-bold text-studio-300 uppercase tracking-wider mb-1.5"
            >
              Student Onboarding Greeting
            </label>
            <textarea
              id="brand-welcome-msg"
              name="welcome-message"
              value={customWelcome}
              onChange={(e) => setCustomWelcome(e.target.value)}
              rows={2}
              placeholder="Welcome to our program! Get ready to rehearse and take the stage."
              className="w-full bg-studio-950 border border-studio-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition resize-none"
            />
          </div>

          {/* Footer Buttons */}
          <div className="pt-4 border-t border-studio-800 flex items-center justify-between shrink-0">
            <div className="text-xs text-studio-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" style={{ color: accentColor }} />
              Instantly permeates navbar, dashboard, roster, and flyers.
            </div>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-studio-400 hover:text-white rounded-xl hover:bg-studio-800 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl font-bold text-xs transition shadow-lg flex items-center gap-2"
                style={{
                  backgroundColor: accentColor,
                  color: isDarkColor ? '#FFFFFF' : '#020617',
                }}
              >
                {isSaved ? (
                  <>
                    <Check className="w-4 h-4" />
                    Branding Applied!
                  </>
                ) : (
                  'Save & Apply Everywhere'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
