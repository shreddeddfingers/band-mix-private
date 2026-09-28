import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { Navbar } from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'Bandmix - Studio Band Management Platform',
  description:
    'Web-based band management platform for scheduling, internal communication, QR onboarding, and ensemble structure for music students.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-studio-950 text-studio-50 antialiased selection:bg-amber-500 selection:text-slate-950 overflow-x-hidden w-full max-w-full">
        <AuthProvider>
          <div className="min-h-screen flex flex-col w-full max-w-full overflow-x-hidden">
            <Navbar />
            <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 overflow-x-hidden">
              {children}
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
