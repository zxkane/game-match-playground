'use client';

import { AmplifyProvider } from '../components/AmplifyProvider';
import { ThemeProvider, createTheme, defaultDarkModeOverride } from '@aws-amplify/ui-react';
import { Inter } from 'next/font/google';
import './globals.css';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import CelebrationIcon from '@mui/icons-material/Celebration';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import CelebrationOutlinedIcon from '@mui/icons-material/CelebrationOutlined';
import PetsIcon from '@mui/icons-material/Pets';
import { DEFAULT_THEME, SITE_TITLE, ThemeKey } from '../constant';

const inter = Inter({ subsets: ['latin'] });

// Theme-specific configurations
export const themeConfigurations = {
  thanksgiving: {
    primary: RestaurantIcon,
    secondary: SportsEsportsIcon,
    drawer: {
      icon: '🦃',
      title: SITE_TITLE,
      blessing: 'Grateful Hearts, Happy Games!'
    }
  },
  christmas: {
    primary: CelebrationIcon,
    secondary: CardGiftcardIcon,
    drawer: {
      icon: '🎄',
      title: SITE_TITLE,
      blessing: 'Joy to the Games!'
    }
  },
  chineseNewYearSnake: {
    primary: CelebrationOutlinedIcon,
    secondary: PetsIcon,
    drawer: {
      icon: '🐍',
      title: SITE_TITLE,
      blessing: '蛇年大吉，游戏常胜！'
    }
  },
} as const;

// Theme definitions
const themes = {
  chineseNewYearSnake: createTheme({
    name: 'chinese-new-year-theme',
    tokens: {
      colors: {
        background: {
          primary: { value: '#FFEFEF' },    // Light red background
          secondary: { value: '#C41E3A' },  // Chinese red
        },
        font: {
          interactive: { value: '#FF3333' }, // Brighter red
          primary: { value: '#E60000' },     // Vivid red
          secondary: { value: '#FFD700' },    // Pure gold
          accent: { value: '#FFC107' },       // Vivid amber
        },
        border: {
          primary: { value: '#C41E3A' },     // Chinese red
        },
      },
      components: {
        button: {
          primary: {
            backgroundColor: { value: '#C41E3A' },
            color: { value: '#FFD700' },
            _hover: {
              backgroundColor: { value: '#8B0000' },
            },
          },
        },
      },
    },
    overrides: [defaultDarkModeOverride],
  }),
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

// Select theme based on environment variable
const themeKey = (process.env.NEXT_PUBLIC_SITE_THEME as ThemeKey) || DEFAULT_THEME;
const selectedTheme = themes[themeKey] || themes.christmas;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.className}>
      <head>
        <title>{SITE_TITLE}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="Match and play games with friends. Create custom game tournaments and track scores in real-time." />
        <meta name="keywords" content="game matching, tournaments, multiplayer games, score tracking" />
        
        {/* Open Graph / Social Media */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content={SITE_TITLE} />
        <meta property="og:description" content="Match and play games with friends. Create custom game tournaments and track scores in real-time." />
        <meta property="og:site_name" content={SITE_TITLE} />
        
        {/* Theme Color */}
        <meta name="theme-color" content={selectedTheme.tokens.colors.font.interactive.value} />
        
        {/* Favicon */}
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
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
