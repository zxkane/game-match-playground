'use client';

import { Authenticator } from '@aws-amplify/ui-react';
import { useState, useEffect } from 'react';
import '@aws-amplify/ui-react/styles.css';
import DashboardLayout from '../components/DashboardLayout';
import { Schema } from '../../amplify/data/resource';
import { generateClient } from 'aws-amplify/api';
import { Typography, Button } from '@mui/material';
import { useRouter } from 'next/navigation';
import { UserProvider, useUser } from '../context/UserContext';
import BreadcrumbsComponent from '../components/BreadcrumbsComponent';
import { DataGrid, GridColDef, GridValueFormatter } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';

const client = generateClient<Schema>();

type Game = {
  id: string | null;
  name: string;
  owner: string;
  description: string | null;
  status: 'draft' | 'active' | 'completed' | null;
  updatedAt: string;
};

function SignInHeader() {
  return (
    <div className="flex flex-col items-center justify-center h-full mb-4">
      <h3 className="text-xl font-semibold">Sign in to Game Match App</h3>
      <p className="text-sm text-gray-600">Use your email or Google account</p>
    </div>
  );
}

export default function Home() {
  
  return (
    <UserProvider>
      <HomeContent />
    </UserProvider>
  );
}

function HomeContent() {
  const router = useRouter();
  const { userEmail } = useUser();
  const [games, setGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [columnVisibilityModel, setColumnVisibilityModel] = useState({});
  const [isMobile, setIsMobile] = useState(window?.innerWidth < 600);

  useEffect(() => {
    const fetchGames = async (userId: string) => {
      try {
        setIsLoading(true);
        const gamesResult = await client.models.Game.list({
          selectionSet: ['id', 'name', 'owner', 'description', 'status', 'updatedAt']
        });
        setGames(gamesResult.data || []);
      } catch (error) {
        console.error('Error fetching games:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (userEmail) {
      fetchGames(userEmail);
    }
  }, [userEmail]);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window?.innerWidth < 600;
      setIsMobile(mobile);
      setColumnVisibilityModel({
        description: !mobile,
        owner: !mobile,
      });
    };
    
    handleResize(); // Set initial state
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const columns: GridColDef[] = [
    { 
      field: 'name', 
      headerName: 'Name', 
      width: 150,
      flex: 1,
      minWidth: 120,
      renderCell: (params) => (
        <div style={{ whiteSpace: 'normal', lineHeight: '1.2em' }}>
          {params.value}
        </div>
      )
    },
    { 
      field: 'description', 
      headerName: 'Description', 
      width: 300,
      flex: 2,
      minWidth: 200,
    },
    { 
      field: 'status', 
      headerName: 'Status', 
      width: 120,
      flex: 0.8,
      minWidth: 100 
    },
    { 
      field: 'owner', 
      headerName: 'Creator', 
      width: 200,
      flex: 1,
      minWidth: 150,
    },
    { 
      field: 'updatedAt', 
      headerName: 'Created', 
      width: 150,
      flex: 1,
      minWidth: 120,
      valueFormatter: (value: string) => 
        new Date(value).toLocaleDateString()
    },
  ];

  if (!userEmail) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Authenticator
          components={{
            Header: SignInHeader
          }}
          loginMechanisms={['email']}
          signUpAttributes={['email']}
          initialState="signIn"
          socialProviders={['google']}
        />
      </div>
    );
  }

  return (
    <DashboardLayout>
      <main className="min-h-screen p-2 sm:p-8">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <BreadcrumbsComponent
              links={[
                { href: '/', label: 'Home' },
                { href: '/', label: 'Games' }
              ]}
              current="Your Games"
            />
            {games.length > 0 && (
              <Button
                variant="contained"
                color="primary"
                onClick={() => router.push('/games/new')}
                sx={{ mt: 2 }}
                startIcon={<AddIcon />}
              >
                New Game
              </Button>
            )}
          </div>
          <div className="grid grid-cols-1 gap-4">
            {isLoading ? (
              <div className="col-span-1 text-center p-8">
                <Typography variant="body1" color="text.secondary">
                  Loading games...
                </Typography>
              </div>
            ) : games.length === 0 ? (
              <div className="col-span-1 text-center p-8 border rounded-lg bg-gray-50">
                <Typography variant="body1" color="text.secondary">
                  No games found. Create a new game to get started.
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => router.push('/games/new')}
                  sx={{ mt: 2 }}
                  startIcon={<AddIcon />}
                >
                  New Game
                </Button>
              </div>
            ) : (
              <div className="w-full overflow-x-auto" style={{ height: 400 }}>
                <DataGrid
                  rows={games}
                  columns={columns}
                  pageSizeOptions={[5]}
                  onRowClick={(params) => router.push(`/games/${params.id}`)}
                  columnVisibilityModel={columnVisibilityModel}
                  onColumnVisibilityModelChange={(newModel) => 
                    setColumnVisibilityModel(newModel)
                  }
                  style={{ height: 400 }}
                  disableColumnMenu
                  sx={{
                    '& .MuiDataGrid-cell': {
                      whiteSpace: 'normal',
                      lineHeight: 'normal',
                      padding: '8px',
                    },
                    '@media (max-width: 600px)': {
                      '& .MuiDataGrid-cell': {
                        fontSize: '0.875rem',
                      },
                    },
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </main>
    </DashboardLayout>
  );
}