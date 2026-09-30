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
  LogOut,
  LogIn,
  MessageSquare,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { DataStore, subscribeToStore } from '@/lib/data-store';
import { Band } from '@/types';
import { RoleSwitcher } from './RoleSwitcher';
import { QRCodeModal } from './QRCodeModal';
import { StudioBrandingModal } from './branding/StudioBrandingModal';
import { ChangeAvatarModal } from './profile/ChangeAvatarModal';
import { LoginModal } from './auth/LoginModal';
import { StudentProfileModal } from './roster/StudentProfileModal';
import { DirectMessagesModal } from './chat/DirectMessagesModal';
import { clsx } from 'clsx';

export function Navbar() {
  const pathname = usePathname();
  const {
    isAdmin,
    isStudent,
    currentUser,
    isAuthLoading,
    activeDirectorId,
    activeBranding,
    updateUserAvatar,
    signOut,
  } = useAuth();
  const [studentBands, setStudentBands] = useState<Band[]>([]);
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [isBrandingOpen, setIsBrandingOpen] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isStudentProfileOpen, setIsStudentProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDmOpen, setIsDmOpen] = useState(false);
  const [unreadDmCount, setUnreadDmCount] = useState(0);

  useEffect(() => {
    if (!currentUser) {
      setUnreadDmCount(0);
      return;
    }
    const updateUnread = () => {
      setUnreadDmCount(DataStore.getTotalUnreadDirectMessagesCount(currentUser.id));
    };
    updateUnread();
    const unsub = subscribeToStore('direct_messages', updateUnread);
    return () => unsub();
  }, [currentUser]);

  useEffect(() => {
    if (isAdmin || !currentUser) {
      setStudentBands([]);
      return;
    }
    const update = () => {
      const allBands = DataStore.getBands();
      setStudentBands(
        allBands.filter(
          (b) =>
            b.members?.some((m) => m.userId === currentUser.id) ||
            (currentUser.bandIds && currentUser.bandIds.includes(b.id))
        )
      );
    };
    update();
    const unsubBands = subscribeToStore('bands', update);
    const unsubStudents = subscribeToStore('students', update);
    return () => {
      unsubBands();
      unsubStudents();
    };
  }, [isAdmin, currentUser]);

  const brandColor = activeBranding?.accentColor || activeBranding?.brandColor || '#F59E0B';
  const brandName = activeBranding?.studioName || 'BANDMIX';
  const brandBadge = activeBranding?.badgeText || (isAdmin ? 'STUDIO PLATFORM' : isStudent ? 'STUDENT PORTAL' : 'STUDIO PORTAL');

  const navLinks = isAdmin
    ? [
        { href: '/', label: 'Overview', icon: Layers },
        { href: '/bands', label: 'Bands', icon: Music },
        { href: '/roster', label: 'Student Roster', icon: Users },
        { href: '/schedule', label: 'Schedule', icon: Calendar },
      ]
    : isStudent && studentBands.length > 0
    ? [{ href: `/bands/${studentBands[0].id}`, label: 'My Band', icon: Music }]
    : [];

  const logoHref = isAdmin
    ? '/'
    : isStudent && studentBands.length > 0
    ? `/bands/${studentBands[0].id}`
    : '/';

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

            {/* Guest Actions (Not Logged In) */}
            {!currentUser && !isAuthLoading && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsLoginOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition shadow-sm"
                >
                  <LogIn className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Log In</span>
                </button>
                <Link
                  href="/onboard"
                  className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-studio-850 hover:bg-studio-800 text-studio-200 hover:text-white text-xs font-semibold border border-studio-700 transition"
                >
                  <span>Intake Pass</span>
                </Link>
              </div>
            )}

            {/* Direct Messages Icon Button (Instagram Direct Style) */}
            {currentUser && (
              <button
                type="button"
                onClick={() => setIsDmOpen(true)}
                className="relative p-2 rounded-xl text-studio-300 hover:text-white hover:bg-studio-900 border border-transparent hover:border-studio-800 transition shrink-0"
                title="Direct Messages"
                aria-label="Direct Messages"
              >
                <MessageSquare className="w-5 h-5 text-amber-400" />
                {unreadDmCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center ring-2 ring-studio-950 animate-pulse">
                    {unreadDmCount > 9 ? '9+' : unreadDmCount}
                  </span>
                )}
              </button>
            )}

            {/* Band Director Perspective Tools (Admin Only) */}
            {isAdmin && currentUser && (
              <>
                <RoleSwitcher />
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
                  <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-studio-950 border border-studio-700 flex items-center justify-center text-amber-400 group-hover:bg-amber-500 group-hover:text-slate-950 transition">
                    <Camera className="w-2 h-2" />
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => signOut()}
                  className="p-2 rounded-xl text-studio-400 hover:text-rose-400 hover:bg-studio-900 border border-transparent hover:border-studio-800 transition shrink-0"
                  title="Sign Out / Switch Director"
                  aria-label="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            )}

            {/* Student Musician Perspective (Student Only - strictly isolated, no RoleSwitcher) */}
            {isStudent && currentUser && (
              <>
                <button
                  type="button"
                  onClick={() => setIsStudentProfileOpen(true)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-studio-900 hover:bg-studio-800 border border-studio-700 text-xs font-semibold text-white transition group shrink-0"
                  title="View & Edit My Profile"
                >
                  <div className="relative w-6 h-6 rounded-full overflow-hidden bg-studio-800 border border-studio-600 shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="truncate max-w-[100px] sm:max-w-[130px]">
                    {currentUser.name}
                  </span>
                  <span className="hidden sm:inline text-[10px] text-amber-400 font-normal">
                    Profile
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => signOut()}
                  className="p-2 rounded-xl text-studio-400 hover:text-rose-400 hover:bg-studio-900 border border-transparent hover:border-studio-800 transition shrink-0"
                  title="Log Out"
                  aria-label="Log Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
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
          <div className="md:hidden px-4 pt-2.5 pb-4 border-t border-studio-800 bg-studio-950/95 backdrop-blur-md space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-150 shadow-2xl">
            {/* Guest Menu Options */}
            {!currentUser && !isAuthLoading && (
              <div className="pt-1 pb-2 border-b border-studio-800/80 mb-2 space-y-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setIsLoginOpen(true);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-amber-500 active:scale-95 text-slate-950 font-bold text-xs shadow-sm"
                >
                  <LogIn className="w-3.5 h-3.5 stroke-[2.5]" />
                  Log In to Band Account
                </button>
                {pathname !== '/onboard' && (
                  <Link
                    href="/onboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-studio-900 text-studio-200 font-semibold text-xs border border-studio-700"
                  >
                    Enter Student Intake Pass
                  </Link>
                )}
              </div>
            )}

            {/* Non-redundant Navigation Links (Only shows pages that are NOT currently open) */}
            {(() => {
              const otherLinks = navLinks.filter((link) => {
                const isCurrentPage =
                  pathname === link.href ||
                  (link.href !== '/' && pathname.startsWith(link.href));
                return !isCurrentPage;
              });

              return (
                <>
                  {otherLinks.length > 0 && (
                    <div className="space-y-1">
                      <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-studio-400">
                        Switch View
                      </div>
                      {otherLinks.map((link) => {
                        const Icon = link.icon;
                        return (
                          <Link
                            key={link.href}
                            href={link.href}
                            onClick={() => setMobileMenuOpen(false)}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-studio-300 hover:text-white hover:bg-studio-900 transition-colors"
                          >
                            <Icon className="w-4 h-4 text-amber-400" />
                            {link.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </>
              );
            })()}

            {/* Director tools inside mobile menu */}
            {isAdmin && (
              <div className="pt-2 mt-2 border-t border-studio-800/80 space-y-1">
                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-studio-400">
                  Director Quick Actions
                </div>
                <button
                  type="button"
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
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setIsQrOpen(true);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-amber-300 hover:bg-studio-900 transition text-left"
                >
                  <QrCode className="w-4 h-4 text-amber-400" />
                  Dynamic Student QR Pass
                </button>
              </div>
            )}

            {/* Direct Messages inside Mobile Menu */}
            {currentUser && (
              <div className="pt-2 mt-2 border-t border-studio-800/80">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setIsDmOpen(true);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold text-white bg-studio-900 hover:bg-studio-850 transition"
                >
                  <div className="flex items-center gap-3">
                    <MessageSquare className="w-4 h-4 text-amber-400" />
                    <span>Direct Messages</span>
                  </div>
                  {unreadDmCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black">
                      {unreadDmCount} new
                    </span>
                  )}
                </button>
              </div>
            )}

            {/* Sign Out in Mobile Menu */}
            {currentUser && (
              <div className="pt-2 mt-2 border-t border-studio-800/80">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    signOut();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-rose-400 hover:bg-rose-500/10 transition text-left"
                >
                  <LogOut className="w-4 h-4 text-rose-400" />
                  Sign Out ({currentUser.name})
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Dynamic QR Modal (Admin Only) */}
      {isAdmin && <QRCodeModal isOpen={isQrOpen} onClose={() => setIsQrOpen(false)} />}

      {/* Studio White-Label Customizer Modal (Admin Only) */}
      {isAdmin && (
        <StudioBrandingModal
          isOpen={isBrandingOpen}
          onClose={() => setIsBrandingOpen(false)}
        />
      )}

      {/* Direct Messages Modal (Available to Directors and Students) */}
      <DirectMessagesModal
        isOpen={isDmOpen}
        onClose={() => setIsDmOpen(false)}
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

      {/* Universal Sign In / Log In Modal */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
      />

      {/* Student's Own Profile Modal (Accessible directly from navbar) */}
      {isStudent && currentUser && (
        <StudentProfileModal
          isOpen={isStudentProfileOpen}
          onClose={() => setIsStudentProfileOpen(false)}
          student={currentUser}
          bands={studentBands}
          onStudentUpdated={(updated) => {
            updateUserAvatar(updated.avatar);
          }}
        />
      )}
    </>
  );
}
