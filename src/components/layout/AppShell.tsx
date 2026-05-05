import React from 'react';
import { Sidebar } from './Sidebar';

export const AppShell: React.FC<{ children: React.ReactNode; hideSidebar?: boolean }> = ({ 
  children, 
  hideSidebar = false 
}) => {
  return (
    <div className="flex h-screen w-full app-bg app-text-primary overflow-hidden">
      {!hideSidebar && <Sidebar />}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
};
