'use client';

import { Typography, Box } from '@mui/material';
import BreadcrumbsComponent from '../../components/BreadcrumbsComponent';
import DashboardLayout from '../../components/DashboardLayout';
import RequireAuth from '../../components/RequireAuth';
import { UserProvider } from '../../context/UserContext';

export default function TransfersPage() {
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
                    { href: '/transfers', label: 'Transfers' }
                  ]}
                  current="Your Transfers"
                />
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div className="col-span-1 text-center p-8 border rounded-lg bg-gray-50">
                  <Typography variant="body1" color="text.secondary">
                    Coming soon! This feature is under development.
                  </Typography>
                </div>
              </div>
            </div>
          </main>
        </DashboardLayout>
      </UserProvider>
    </RequireAuth>
  );
} 