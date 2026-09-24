'use client';

import React, { useState, useEffect } from 'react';
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
  Sliders,
  Flame,
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
    sublabel: 'Vivid Red • Performance Rock Program',
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
  { label: 'Purple Haze', value: '#8B5CF6' },
  { label: 'Cyber Orange', value: '#F97316' },
  { label: 'Neon Cyan', value: '#06B6D4' },
  { label: 'Stealth Slate', value: '#64748B' },
];

export function StudioBrandingModal({ isOpen, onClose }: StudioBrandingModalProps) {
  const { activeBranding, updateStudioBranding, currentUser } = useAuth();

  const [studioName, setStudioName] = useState(activeBranding?.studioName || '');
  const [tagline, setTagline] = useState(activeBranding?.tagline || '');
  const [accentColor, setAccentColor] = useState(activeBranding?.accentColor || '#F59E0B');
  const [logoUrl, setLogoUrl] = useState(activeBranding?.logoUrl || '');
  const [customWelcome, setCustomWelcome] = useState(activeBranding?.customWelcome || '');
  const [badgeText, setBadgeText] = useState(activeBranding?.badgeText || 'STUDIO PLATFORM');
  const [selectedPreset, setSelectedPreset] = useState<BrandPresetKey>(
    activeBranding?.presetKey || 'custom'
  );
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (activeBranding) {
      setStudioName(activeBranding.studioName || currentUser?.studioName || 'Music Studio');
      setTagline(activeBranding.tagline || 'Ensemble Performance & Musician Training');
      setAccentColor(activeBranding.accentColor || '#F59E0B');
      setLogoUrl(activeBranding.logoUrl || '');
      setCustomWelcome(activeBranding.customWelcome || '');
      setBadgeText(activeBranding.badgeText || 'STUDIO PLATFORM');
      setSelectedPreset(activeBranding.presetKey || 'custom');
    }
  }, [activeBranding, currentUser, isOpen]);

  if (!isOpen) return null;

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
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-studio-900 border border-studio-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
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
                  Enterprise Customizer
                </span>
              </h2>
              <p className="text-xs text-studio-400">
                Brand this entire application as your school or franchise (e.g. School of Rock).
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
                          className="w-3.5 h-3.5 rounded-full shadow-sm"
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

          {/* Live Preview Card */}
          <div className="p-4 rounded-2xl bg-studio-950 border border-studio-800 space-y-3">
            <div className="text-[11px] font-bold text-studio-400 uppercase tracking-wider flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" />
              Live Brand Preview
            </div>

            {/* Mock Navigation Header */}
            <div className="p-3 bg-studio-900 rounded-xl border border-studio-800 flex items-center justify-between shadow-inner">
              <div className="flex items-center gap-2.5">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt={studioName}
                    className="w-8 h-8 rounded-lg object-cover border border-studio-700"
                  />
                ) : (
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-slate-950 shadow"
                    style={{ backgroundColor: accentColor }}
                  >
                    <Radio className="w-4 h-4" />
                  </div>
                )}
                <div>
                  <div className="text-sm font-black text-white leading-tight">
                    {studioName}
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
                className="text-[10px] font-bold px-2.5 py-1 rounded-full border shadow-sm"
                style={{
                  backgroundColor: `${accentColor}20`,
                  borderColor: `${accentColor}50`,
                  color: accentColor,
                }}
              >
                Director Portal
              </div>
            </div>

            {/* Mock Welcome Tagline */}
            <div
              className="p-3 rounded-xl border flex items-center justify-between text-xs"
              style={{
                backgroundColor: `${accentColor}10`,
                borderColor: `${accentColor}30`,
              }}
            >
              <div className="space-y-0.5">
                <span className="font-semibold text-white">Student Intake Greeting:</span>
                <p className="text-[11px] text-studio-300 italic">
                  &ldquo;{customWelcome || tagline || 'Welcome to the studio!'}&rdquo;
                </p>
              </div>
              <span
                className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase shrink-0"
                style={{ backgroundColor: accentColor, color: '#020617' }}
              >
                Onboarding Ready
              </span>
            </div>
          </div>

          {/* Form Fields Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* School / Studio Name */}
            <div>
              <label
                htmlFor="brand-studio-name"
                className="block text-xs font-bold text-studio-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5"
              >
                <Building className="w-3.5 h-3.5 text-amber-400" />
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
                className="w-full bg-studio-950 border border-studio-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition"
              />
            </div>

            {/* Tagline / Motto */}
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
                placeholder="e.g. The Ultimate Rock & Roll Experience"
                className="w-full bg-studio-950 border border-studio-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition"
              />
            </div>

            {/* Brand Logo URL */}
            <div className="sm:col-span-2">
              <label
                htmlFor="brand-logo-url"
                className="block text-xs font-bold text-studio-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5"
              >
                <ImageIcon className="w-3.5 h-3.5 text-purple-400" />
                Custom Brand Logo URL (Optional)
              </label>
              <input
                id="brand-logo-url"
                name="logo-url"
                type="url"
                autoComplete="url"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://.../logo.png"
                className="w-full bg-studio-950 border border-studio-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition"
              />
            </div>

            {/* Color Accent Picker */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-studio-300 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-red-400" />
                  Primary Brand Accent Color
                </span>
                <span className="font-mono text-xs text-studio-400">{accentColor}</span>
              </label>
              <div className="flex flex-wrap items-center gap-2">
                {COLOR_SWATCHES.map((swatch) => (
                  <button
                    key={swatch.value}
                    type="button"
                    onClick={() => setAccentColor(swatch.value)}
                    className={clsx(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition',
                      accentColor === swatch.value
                        ? 'border-white text-white shadow-md bg-studio-800'
                        : 'border-studio-800 text-studio-400 hover:text-white bg-studio-950'
                    )}
                  >
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: swatch.value }}
                    />
                    <span>{swatch.label}</span>
                  </button>
                ))}
                {/* Custom hex input */}
                <input
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                  title="Pick custom hex color"
                />
              </div>
            </div>

            {/* Custom Welcome Message */}
            <div className="sm:col-span-2">
              <label
                htmlFor="brand-welcome-msg"
                className="block text-xs font-bold text-studio-300 uppercase tracking-wider mb-1.5"
              >
                Intake / Student Onboarding Welcome Message
              </label>
              <textarea
                id="brand-welcome-msg"
                name="welcome-message"
                value={customWelcome}
                onChange={(e) => setCustomWelcome(e.target.value)}
                rows={2}
                placeholder="Welcome to our program! Get ready to rehearse and take the stage."
                className="w-full bg-studio-950 border border-studio-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition resize-none"
              />
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="pt-4 border-t border-studio-800 flex items-center justify-between shrink-0">
            <div className="text-xs text-studio-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" style={{ color: accentColor }} />
              Changes take effect immediately across all student flows & flyers.
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
                  color: accentColor === '#E11D48' || accentColor === '#2563EB' || accentColor === '#8B5CF6' ? '#FFFFFF' : '#020617',
                }}
              >
                {isSaved ? (
                  <>
                    <Check className="w-4 h-4" />
                    Branding Applied!
                  </>
                ) : (
                  'Save & Apply Branding'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
