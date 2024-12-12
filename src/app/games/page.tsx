'use client';

import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/api';
import { Schema } from '../../../amplify/data/resource';
import DashboardLayout from '../../components/DashboardLayout';
import { Typography, Button } from '@mui/material';
import { useRouter } from 'next/navigation';
import { UserProvider } from '../../context/UserContext';
import BreadcrumbsComponent from '../../components/BreadcrumbsComponent';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import RequireAuth from '../../components/RequireAuth';

const client = generateClient<Schema>();

type Game = Omit<Schema['Game']['type'], 'createdAt' | 'players' | 'rounds'>;

export default function Games() {
  const router = useRouter();
  const [games, setGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [columnVisibilityModel, setColumnVisibilityModel] = useState({});


  useEffect(() => {
    const fetchGames = async () => {
      try {
        setIsLoading(true);
        const gamesResult = await client.models.Game.list({
          selectionSet: ['id', 'name', 'owner', 'description', 'status', 'updatedAt'],
          filter: {
            status: {
              ne: 'deleted'
            }
          }
        });
        setGames(gamesResult.data || []);
      } catch (error) {
        console.error('Error fetching games:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGames();
  }, []);

  const columns: GridColDef[] = [
    {
      field: 'name',
      headerName: 'Name',
      headerClassName: 'amplify-theme-header',
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
      headerClassName: 'amplify-theme-header',
      width: 300,
      flex: 2,
      minWidth: 200,
    },
    {
      field: 'status',
      headerName: 'Status',
      headerClassName: 'amplify-theme-header',
      width: 120,
      flex: 0.8,
      minWidth: 100
    },
    {
      field: 'owner',
      headerName: 'Creator',
      headerClassName: 'amplify-theme-header',
      width: 200,
      flex: 1,
      minWidth: 150,
    },
    {
      field: 'updatedAt',
      headerName: 'Created',
      headerClassName: 'amplify-theme-header',
      width: 150,
      flex: 1,
      minWidth: 120,
      valueFormatter: (value: string) =>
        new Date(value).toLocaleDateString()
    },
  ];

  return (
    <RequireAuth>
      <UserProvider>
        <DashboardLayout>
          <main className="min-h-screen p-2 sm:p-8">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <BreadcrumbsComponent
                  links={[
                    { href: '/', label: 'Home' },
                    { href: '/games', label: 'Games' }
                  ]}
                  current="Your Games"
                />
                {games.length > 0 && (
                  <Button
                    variant="contained"
                    sx={{ mt: 2 }}
                    onClick={() => router.push('/games/new')}
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
                      sx={{ mt: 2 }}
                      onClick={() => router.push('/games/new')}
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
                      initialState={{
                        pagination: {
                          paginationModel: { pageSize: 10, page: 0 },
                        },
                      }}
                      pageSizeOptions={[10, 25, 50, 100]}
                      onRowClick={(params) => router.push(`/games/${params.id}`)}
                      columnVisibilityModel={columnVisibilityModel}
                      onColumnVisibilityModelChange={(newModel) =>
                        setColumnVisibilityModel(newModel)
                      }
                      style={{ height: 400 }}
                      disableColumnMenu
                      sx={{
                        '& .MuiDataGrid-row:hover': {
                          backgroundColor: 'rgba(0, 0, 0, 0.04)', // Light gray with low opacity
                          cursor: 'pointer'
                        }
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </main>
        </DashboardLayout>
      </UserProvider>
    </RequireAuth>
  );
}