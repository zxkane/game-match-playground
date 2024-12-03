'use client';

import { AmplifyProvider } from '../components/AmplifyProvider';
import { ThemeProvider, createTheme, defaultDarkModeOverride } from '@aws-amplify/ui-react';
import { Inter } from 'next/font/google';
import './globals.css';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import CelebrationIcon from '@mui/icons-material/Celebration';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import { SITE_TITLE } from '../constant';

const inter = Inter({ subsets: ['latin'] });

// Theme-specific icons
export const themeIcons = {
  thanksgiving: {
    primary: RestaurantIcon,
    secondary: SportsEsportsIcon,
    drawer: {
      icon: '🦃',
      title: SITE_TITLE
    }
  },
  christmas: {
    primary: CelebrationIcon,
    secondary: CardGiftcardIcon,
    drawer: {
      icon: '🎄',
      title: SITE_TITLE
    }
  },
} as const;

// Theme definitions
const themes = {
  thanksgiving: createTheme({
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
  }),
  
  christmas: createTheme({
    name: 'christmas-theme',
    tokens: {
      colors: {
        background: {
          primary: { value: '#FFFFFF' },   // Snow white background
          secondary: { value: '#165B33' }, // Christmas green
        },
        font: {
          interactive: { value: '#CC231E' }, // Christmas red
          primary: { value: '#034F34' },     // Dark green
          secondary: { value: '#BB2528' },    // Bright red
          accent: { value: '#FAC898' },      // Gold
        },
        border: {
          primary: { value: '#165B33' },     // Christmas green
        },
      },
      components: {
        button: {
          primary: {
            backgroundColor: { value: '#CC231E' },
            color: { value: '#FFFFFF' },
            _hover: {
              backgroundColor: { value: '#165B33' },
            },
          },
        },
      },
    },
    overrides: [defaultDarkModeOverride],
  })
} as const;

type ThemeKey = keyof typeof themes;

// Select theme based on environment variable
const themeKey = (process.env.NEXT_PUBLIC_SITE_THEME as ThemeKey) || 'christmas';
const selectedTheme = themes[themeKey] || themes.christmas;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.className}>
      <body>
        <ThemeProvider theme={selectedTheme}>
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
