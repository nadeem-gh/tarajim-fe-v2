import './globals.css';
import type { ReactNode } from 'react';
import Nav from '@/components/Nav';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import ServerStatusIndicator from '@/components/ServerStatusIndicator';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <ErrorBoundary>
          <Nav />
          {children}
          <ServerStatusIndicator />
        </ErrorBoundary>
      </body>
    </html>
  );
}

