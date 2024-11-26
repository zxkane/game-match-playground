'use client';

import { AmplifyProvider } from '../components/AmplifyProvider';
import { ThemeProvider, createTheme, defaultDarkModeOverride } from '@aws-amplify/ui-react';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

// Thanksgiving-themed colors
const theme = createTheme({
  name: 'thanksgiving-theme',
  tokens: {
    colors: {
      background: {
        primary: { value: '#FFF8DC' },  // Cream background
        secondary: { value: '#8B4513' }, // Saddle brown
      },
      font: {
        interactive: { value: '#D2691E' }, // Chocolate
        primary: { value: '#654321' },     // Dark brown
        secondary: { value: '#CD853F' },   // Peru brown
        accent: { value: '#FF8C00' },      // Dark orange
      },
      border: {
        primary: { value: '#8B4513' },     // Saddle brown
      },
    },
    components: {
      button: {
        primary: {
          backgroundColor: { value: '#D2691E' },
          color: { value: '#FFF8DC' },
          _hover: {
            backgroundColor: { value: '#8B4513' },
          },
        },
      },
    },
  },
  overrides: [defaultDarkModeOverride],
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.className}>
      <body>
        <ThemeProvider theme={theme}>
          <AmplifyProvider>
            <main className="min-h-screen">
              {children}
            </main>
          </AmplifyProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
