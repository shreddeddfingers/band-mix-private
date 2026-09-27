'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Music,
  Users,
  Calendar,
  Layers,
  QrCode,
  Menu,
  X,
  Palette,
  Radio,
  Sparkles,
  Camera,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { DataStore, subscribeToStore } from '@/lib/data-store';
import { Band } from '@/types';
import { RoleSwitcher } from './RoleSwitcher';
import { QRCodeModal } from './QRCodeModal';
import { StudioBrandingModal } from './branding/StudioBrandingModal';
import { ChangeAvatarModal } from './profile/ChangeAvatarModal';
import { clsx } from 'clsx';

export function Navbar() {
  const pathname = usePathname();
  const {
    isAdmin,
    isStudent,
    currentUser,
    activeDirectorId,
    activeBranding,
    updateUserAvatar,
  } = useAuth();
  const [studentBands, setStudentBands] = useState<Band[]>([]);
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [isBrandingOpen, setIsBrandingOpen] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (isAdmin || !currentUser) {
      setStudentBands([]);
      return;
    }
    const update = () => {
      const allBands = DataStore.getBands(activeDirectorId);
      setStudentBands(allBands.filter((b) => b.members.some((m) => m.userId === currentUser.id)));
    };
    update();
    const unsub = subscribeToStore('bands', update);
    return () => unsub();
  }, [isAdmin, currentUser, activeDirectorId]);

  const brandColor = activeBranding?.accentColor || activeBranding?.brandColor || '#F59E0B';
  const brandName = activeBranding?.studioName || 'BANDMIX';
  const brandBadge = activeBranding?.badgeText || (isAdmin ? 'STUDIO PLATFORM' : 'STUDENT PORTAL');

  const navLinks = isAdmin
    ? [
        { href: '/', label: 'Overview', icon: Layers },
        { href: '/bands', label: 'Bands', icon: Music },
        { href: '/roster', label: 'Student Roster', icon: Users },
        { href: '/schedule', label: 'Schedule', icon: Calendar },
      ]
    : studentBands.length === 1
    ? [{ href: `/bands/${studentBands[0].id}`, label: 'My Band', icon: Music }]
    : [{ href: '/bands', label: studentBands.length > 1 ? 'My Bands' : 'My Band', icon: Music }];

  const logoHref = isAdmin
    ? '/'
    : studentBands.length === 1
    ? `/bands/${studentBands[0].id}`
    : '/bands';

  return (
    <>
      <header className="sticky top-0 z-30 bg-studio-950/80 backdrop-blur-md border-b border-studio-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo & Platform Name */}
          <div className="flex items-center gap-3 sm:gap-8 min-w-0">
            <Link href={logoHref} className="flex items-center gap-2 sm:gap-2.5 group min-w-0">
              {activeBranding?.logoUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={activeBranding.logoUrl}
                  alt={brandName}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl object-cover border border-studio-700 shadow-md group-hover:scale-105 transition-transform bg-studio-900 shrink-0"
                />
              ) : (
                <div
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-slate-950 font-black shadow-lg group-hover:scale-105 transition-transform shrink-0"
                  style={{
                    backgroundColor: brandColor,
                    boxShadow: `0 10px 15px -3px ${brandColor}33`,
                  }}
                >
                  <Radio className="w-4 h-4 sm:w-5 sm:h-5 text-slate-950 stroke-[2.5]" />
                </div>
              )}
              <div className="min-w-0">
                <span className="font-black text-base sm:text-lg tracking-tight text-white flex items-center gap-1.5 truncate">
                  {brandName}
                </span>
                <span
                  className="text-[8px] sm:text-[9px] tracking-wider uppercase font-semibold block -mt-1 font-mono truncate"
                  style={{ color: brandColor }}
                >
                  {brandBadge}
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive =
                  pathname === link.href ||
                  (link.href !== '/' && pathname.startsWith(link.href));
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={clsx(
                      'flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-studio-800/90 text-white shadow-sm border border-studio-700/60'
                        : 'text-studio-400 hover:text-studio-200 hover:bg-studio-900'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* White-Label Branding Customizer (Desktop Only) */}
            {isAdmin && (
              <button
                onClick={() => setIsBrandingOpen(true)}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition border shadow-sm"
                style={{
                  backgroundColor: `${brandColor}18`,
                  borderColor: `${brandColor}40`,
                  color: brandColor,
                }}
                title="White-Label Studio Branding (School of Rock, Bach to Rock, etc.)"
              >
                <Palette className="w-3.5 h-3.5" />
                <span>Brand Studio</span>
              </button>
            )}

            {/* QR Code Action (Desktop Only) */}
            {isAdmin && (
              <button
                onClick={() => setIsQrOpen(true)}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition border shadow-sm bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30"
                title="Generate Dynamic Onboarding QR Code"
              >
                <QrCode className="w-4 h-4 text-amber-400" />
                <span>QR Onboard</span>
              </button>
            )}

            {/* Role & Perspective Switcher */}
            <RoleSwitcher />

            {/* Current User Avatar / Quick Change Photo */}
            {currentUser && (
              <button
                type="button"
                onClick={() => setIsAvatarModalOpen(true)}
                className="relative group p-0.5 rounded-full border border-studio-700 hover:border-amber-400 transition shrink-0"
                title={`Change profile picture (${currentUser.name})`}
                aria-label="Change profile picture"
              >
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden bg-studio-800">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
                <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <Camera className="w-3.5 h-3.5 text-amber-300" />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-studio-950 border border-studio-700 flex items-center justify-center text-amber-400 group-hover:bg-amber-500 group-hover:text-slate-950 transition">
                  <Camera className="w-2 h-2" />
                </div>
              </button>
            )}

            {/* Mobile menu trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-studio-400 hover:text-white hover:bg-studio-800 transition"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden px-4 pt-2 pb-4 border-t border-studio-800 bg-studio-950 space-y-1 animate-in fade-in slide-in-from-top-2 duration-150">
            {/* User Profile Card inside mobile menu */}
            {currentUser && (
              <div className="pt-1 pb-2 border-b border-studio-800/80 mb-2">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setIsAvatarModalOpen(true);
                  }}
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-studio-900 border border-studio-800 hover:border-amber-500/50 transition text-left"
                >
                  <div className="relative w-9 h-9 rounded-full overflow-hidden bg-studio-800 border border-studio-700 shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <Camera className="w-3 h-3 text-white" />
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-white truncate">
                      {currentUser.name}
                    </div>
                    <div className="text-[11px] text-amber-400 flex items-center gap-1 font-medium">
                      <Camera className="w-3 h-3" /> Change Profile Picture
                    </div>
                  </div>
                </button>
              </div>
            )}

            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive =
                pathname === link.href ||
                (link.href !== '/' && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={clsx(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-studio-800 text-white font-bold'
                      : 'text-studio-400 hover:text-white hover:bg-studio-900'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}

            {/* Director tools inside mobile menu */}
            {isAdmin && (
              <div className="pt-2 mt-2 border-t border-studio-800/80 space-y-1">
                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-studio-500">
                  Director Quick Actions
                </div>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setIsBrandingOpen(true);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-amber-300 hover:bg-studio-900 transition text-left"
                >
                  <Palette className="w-4 h-4 text-amber-400" />
                  White-Label Brand Studio
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setIsQrOpen(true);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-amber-300 hover:bg-studio-900 transition text-left"
                >
                  <QrCode className="w-4 h-4 text-amber-400" />
                  Dynamic Student QR Onboarding
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Dynamic QR Modal */}
      <QRCodeModal isOpen={isQrOpen} onClose={() => setIsQrOpen(false)} />

      {/* Studio White-Label Customizer Modal */}
      <StudioBrandingModal
        isOpen={isBrandingOpen}
        onClose={() => setIsBrandingOpen(false)}
      />

      {/* Profile Picture Change Modal */}
      {currentUser && (
        <ChangeAvatarModal
          isOpen={isAvatarModalOpen}
          onClose={() => setIsAvatarModalOpen(false)}
          currentAvatar={currentUser.avatar}
          userName={currentUser.name}
          onSave={(newAvatarUrl) => {
            updateUserAvatar(newAvatarUrl);
          }}
        />
      )}
    </>
  );
}
