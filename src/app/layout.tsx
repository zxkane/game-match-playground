import { AmplifyProvider } from '../components/AmplifyProvider';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Game Match App',
  description: 'A game matching application',
  viewport: 'width=device-width, initial-scale=1',
  icons: {
    icon: '/favicon.ico'
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
      <html lang="en" className={inter.className}>
        <body>
          <AmplifyProvider>
            <main className="min-h-screen">
              {children}
            </main>
          </AmplifyProvider>
        </body>
      </html>
  );
}
