'use client';

import React, { createContext, useContext } from 'react';
import { useSession } from 'next-auth/react';

interface UserContextType {
  userEmail: string;
  setUserEmail: (email: string) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const userEmail = session?.user?.email || '';

  return (
    <UserContext.Provider value={{ userEmail, setUserEmail: () => {} }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
} 