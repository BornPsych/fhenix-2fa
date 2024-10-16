import './globals.css';

import { FileLock2, House, LogIn } from 'lucide-react';
import type { Metadata } from 'next';
import localFont from 'next/font/local';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/lib/authContext';

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
});
const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
});

export const metadata: Metadata = {
  title: 'Fhenix Two Factor Authentication',
  description: 'Fhenix Two Factor Authentication',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en'>
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-slate-800 bg-3dot bg-no-repeat antialiased`}
      >
        <div className='flex w-screen flex-row items-center justify-between px-12 py-4'>
          <Link href='/register'>
            <Button className='gap-4'>
              <LogIn size={16} strokeWidth={3} /> <span>Register</span>
            </Button>
          </Link>
          <Link href='/'>
            <Button className='gap-4'>
              <House size={16} /> <span>Home</span>
            </Button>
          </Link>
          <Link href='/approve'>
            <Button className='gap-4'>
              <FileLock2 size={16} strokeWidth={3} />
              <span>Approve</span>
            </Button>
          </Link>
        </div>
        <AuthProvider>{children}</AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
