import * as React from 'react';
import { styled, ThemeProvider as MUIThemeProvider, createTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import MuiDrawer from '@mui/material/Drawer';
import MuiAppBar, { AppBarProps as MuiAppBarProps } from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import Typography from '@mui/material/Typography';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { signOut } from 'aws-amplify/auth';
import { useState } from 'react';
import { useUser } from '../context/UserContext';
import { Divider, Paper, Avatar, List, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import { useTheme } from '@aws-amplify/ui-react';
import type {} from '@mui/x-data-grid/themeAugmentation';
import { themeIcons } from '../app/layout';
import { SITE_TITLE } from '../constant';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import GroupsIcon from '@mui/icons-material/Groups';
import { useRouter } from 'next/navigation';
import { stringAvatar } from '@/utils/avatar';

const drawerWidth = 240;

interface AppBarProps extends MuiAppBarProps {
  open?: boolean;
}

const StyledAppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
})<AppBarProps>(({ theme, open }) => ({
  background: `linear-gradient(45deg, var(--amplify-colors-font-interactive) 30%, var(--amplify-colors-font-primary) 90%)`,
  boxShadow: `0 3px 5px 2px rgba(139, 69, 19, .3)`,
  transition: theme.transitions.create(['margin', 'width'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    width: `calc(100% - ${drawerWidth}px)`,
    marginLeft: `${drawerWidth}px`,
    transition: theme.transitions.create(['margin', 'width'], {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

const StyledDrawer = styled(MuiDrawer)(() => ({
  '& .MuiDrawer-paper': {
    backgroundColor: 'var(--amplify-colors-background-primary)',
    borderRight: `1px solid var(--amplify-colors-border-primary)`,
    padding: 0,
    borderRadius: 0,
  },
}));

const DrawerHeader = styled('div')(() => ({
  display: 'flex',
  alignItems: 'center',
  padding: '0 8px',
  minHeight: 64,
  justifyContent: 'space-between',
  width: '100%',
}));

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [open, setOpen] = React.useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { userEmail } = useUser();
  const theme = useTheme();
  const { tokens } = theme;
  const router = useRouter();
  
  // Get the current theme key
  const currentTheme = (process.env.NEXT_PUBLIC_SITE_THEME || 'christmas') as keyof typeof themeIcons;
  
  // Get theme-specific icons
  const { primary: PrimaryIcon, secondary: SecondaryIcon } = themeIcons[currentTheme];

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Create a MUI theme using Amplify theme tokens
  const muiTheme = createTheme({
    palette: {
      primary: {
        main: tokens.colors.font.primary.value,
      },
      secondary: {
        main: tokens.colors.font.secondary.value,
      },
      background: {
        default: tokens.colors.background.primary.value,
        paper: tokens.colors.background.secondary.value,
      },
      text: {
        primary: tokens.colors.font.primary.value,
        secondary: tokens.colors.font.secondary.value,
      },
      error: {
        main: tokens.colors.font.accent.value as string,
      },
    },
    components: {
      MuiAppBar: {
        styleOverrides: {
          root: {
            background: `linear-gradient(45deg, ${tokens.colors.font.interactive.value} 30%, ${tokens.colors.font.primary.value} 90%)`,
            boxShadow: `0 3px 5px 2px rgba(139, 69, 19, .3)`,
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: tokens.colors.background.primary.value,
            borderRight: `1px solid ${tokens.colors.border.primary.value}`,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundColor: tokens.colors.background.primary.value,
            borderRadius: 8,
            border: '1px solid',
            borderColor: tokens.colors.border.primary.value,
            padding: 16,
          },
        },
      },
      MuiMenu: {
        styleOverrides: {
          paper: {
            backgroundColor: tokens.colors.background.primary.value,
            border: `1px solid ${tokens.colors.border.primary.value}`,
            '& .MuiMenuItem-root': {
              color: tokens.colors.font.primary.value,
              '&:hover': {
                backgroundColor: tokens.colors.font.secondary.value,
                color: tokens.colors.background.primary.value,
              },
            },
          },
        },
      },
      MuiMenuItem: {
        styleOverrides: {
          root: {
            color: tokens.colors.font.primary.value,
            '&:hover': {
              backgroundColor: tokens.colors.font.secondary.value,
              color: tokens.colors.background.primary.value,
            },
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            '&.header-icon': {
              color: tokens.colors.background.primary.value,
            },
            '&.account-icon': {
              color: tokens.colors.background.primary.value,
            }
          },
        },
      },
      MuiTypography: {
        styleOverrides: {
          root: {
            '&.header-text': {
              color: tokens.colors.background.primary.value,
              textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
            },
            '&.header-email': {
              color: tokens.colors.background.primary.value,
              textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
            }
          },
        },
      },
      MuiSvgIcon: {
        styleOverrides: {
          root: {
            '&.header-icon': {
              color: tokens.colors.background.primary.value,
            },
          },
        },
      },
      MuiDataGrid: {
        styleOverrides: {
          root: {
            '& .MuiDataGrid-columnHeader': {
              backgroundColor: tokens.colors.background.secondary.value,
              color: tokens.colors.background.primary.value,
              fontWeight: 600,
              '&:focus, &:focus-within': {
                outline: 'none',
              },
            },
            '& .MuiDataGrid-cell': {
              whiteSpace: 'normal',
              lineHeight: 'normal',
              padding: '8px',
              color: tokens.colors.font.primary.value,
            },
            '& .MuiDataGrid-row:hover': {
              color: tokens.colors.font.primary.value,
              backgroundColor: tokens.colors.background.secondary.value,
            },
            '@media (max-width: 600px)': {
              '& .MuiDataGrid-cell': {
                fontSize: '0.875rem',
              },
            },
          },
        },
      },
    },
  });

  const menuItems = [
    { text: 'Games', icon: <SportsEsportsIcon />, path: '/games' },
    { text: 'Transfers', icon: <GroupsIcon />, path: '/transfers' },
  ];

  return (
    <MUIThemeProvider theme={muiTheme}>
      <Box sx={{ display: 'flex' }}>
        <StyledAppBar position="fixed" open={open}>
          <Toolbar 
            sx={{ 
              justifyContent: 'space-between',
              px: { xs: 1, sm: 2 }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton
                color="inherit"
                aria-label="open drawer"
                onClick={handleDrawerOpen}
                edge="start"
                sx={{ mr: 2, ...(open && { display: 'none' }) }}
              >
                <MenuIcon />
              </IconButton>
              {PrimaryIcon && <PrimaryIcon className="header-icon" sx={{ mr: 1 }} />}
              {SecondaryIcon && <SecondaryIcon className="header-icon" sx={{ mr: 1 }} />}
              <Typography
                variant="h6"
                noWrap
                component="div"
                className="header-text"
                sx={{ 
                  display: { xs: 'none', sm: 'block' },
                  fontWeight: 'bold'
                }}
              >
                {SITE_TITLE} - {currentTheme.toUpperCase()}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {userEmail && (
                <>
                  <Typography 
                    variant="body2" 
                    className="header-email"
                    sx={{ display: { xs: 'none', sm: 'block' } }}
                  >
                    {userEmail}
                  </Typography>
                  <IconButton
                    size="large"
                    aria-label="account of current user"
                    aria-controls="menu-appbar"
                    aria-haspopup="true"
                    onClick={handleMenu}
                    className="account-icon"
                  >
                    <Avatar {...stringAvatar(userEmail)} />
                  </IconButton>
                  <Menu
                    id="menu-appbar"
                    anchorEl={anchorEl}
                    anchorOrigin={{
                      vertical: 'bottom',
                      horizontal: 'right',
                    }}
                    keepMounted
                    transformOrigin={{
                      vertical: 'top',
                      horizontal: 'right',
                    }}
                    open={Boolean(anchorEl)}
                    onClose={handleClose}
                  >
                    <MenuItem onClick={handleLogout}>Logout</MenuItem>
                  </Menu>
                </>
              )}
            </Box>
          </Toolbar>
        </StyledAppBar>
        <StyledDrawer
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
              backgroundColor: 'var(--amplify-colors-background-primary)',
              color: 'var(--amplify-colors-font-primary)',
            },
          }}
          variant="persistent"
          anchor="left"
          open={open}
        >
          <DrawerHeader
            sx={{
              background: `linear-gradient(45deg, var(--amplify-colors-font-interactive) 30%, var(--amplify-colors-font-primary) 90%)`,
              color: 'var(--amplify-colors-background-primary)',
            }}
          >
            <Typography variant="h6" sx={{ flexGrow: 1, ml: 2, textShadow: '1px 1px 2px rgba(0,0,0,0.3)' }}>
              {themeIcons[currentTheme].drawer.icon} {themeIcons[currentTheme].drawer.title}
            </Typography>
            <IconButton 
              onClick={handleDrawerClose}
              sx={{ color: 'var(--amplify-colors-background-primary)' }}
            >
              <ChevronLeftIcon />
            </IconButton>
          </DrawerHeader>
          <Divider />
          <List>
            {menuItems.map((item) => (
              <ListItemButton 
                key={item.text}
                onClick={() => router.push(item.path)}
                sx={{
                  '&:hover': {
                    backgroundColor: 'var(--amplify-colors-font-secondary)',
                    color: 'var(--amplify-colors-background-primary)',
                    '& .MuiListItemIcon-root': {
                      color: 'var(--amplify-colors-background-primary)',
                    }
                  }
                }}
              >
                <ListItemIcon sx={{ color: 'var(--amplify-colors-font-interactive)' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            ))}
          </List>
        </StyledDrawer>
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: { xs: 1, sm: 2, md: 3 },
            transition: theme => theme.transitions.create('margin', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.leavingScreen,
            }),
            marginLeft: `-${drawerWidth}px`,
            ...(open && {
              transition: theme => theme.transitions.create('margin', {
                easing: theme.transitions.easing.easeOut,
                duration: theme.transitions.duration.enteringScreen,
              }),
              marginLeft: 0,
            }),
            backgroundColor: 'var(--amplify-colors-background-secondary)',
          }}
        >
          <DrawerHeader />
          <Paper elevation={3}>
            {children}
          </Paper>
        </Box>
      </Box>
    </MUIThemeProvider>
  );
}
