'use client';

import React, { useState } from 'react';
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
  PlusCircle,
  Radio,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { RoleSwitcher } from './RoleSwitcher';
import { QRCodeModal } from './QRCodeModal';
import { clsx } from 'clsx';

export function Navbar() {
  const pathname = usePathname();
  const { isAdmin, role } = useAuth();
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: '/', label: 'Overview', icon: Layers },
    { href: '/bands', label: 'Bands', icon: Music },
    { href: '/roster', label: 'Student Roster', icon: Users },
    { href: '/schedule', label: 'Schedule', icon: Calendar },
  ];

  return (
    <>
      <header className="sticky top-0 z-30 bg-studio-950/80 backdrop-blur-md border-b border-studio-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo & Platform Name */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-amp-orange flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
                <Radio className="w-5 h-5 text-slate-950 stroke-[2.5]" />
              </div>
              <div>
                <span className="font-black text-lg tracking-tight text-white flex items-center gap-1.5">
                  BAND<span className="text-amber-400">MIX</span>
                </span>
                <span className="text-[10px] tracking-wider uppercase text-studio-400 font-semibold block -mt-1">
                  Studio Platform
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
          <div className="flex items-center gap-3">
            {/* QR Code Action (Director / Admin quick tool) */}
            <button
              onClick={() => setIsQrOpen(true)}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition border shadow-sm',
                isAdmin
                  ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30'
                  : 'bg-studio-800 hover:bg-studio-700 text-studio-300 border-studio-700'
              )}
              title="Generate Dynamic Onboarding QR Code"
            >
              <QrCode className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">QR Onboard</span>
            </button>

            {/* Role & Perspective Switcher */}
            <RoleSwitcher />

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
          <div className="md:hidden px-4 pt-2 pb-4 border-t border-studio-800 bg-studio-950 space-y-1">
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
          </div>
        )}
      </header>

      {/* Dynamic QR Modal */}
      <QRCodeModal isOpen={isQrOpen} onClose={() => setIsQrOpen(false)} />
    </>
  );
}
