import React from 'react';
import { Navbar } from './navbar'; // Assuming navbar.tsx is in the same directory

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8">
        {children}
      </main>
      {/* Optional: Add a Footer component here */}
    </div>
  );
} 