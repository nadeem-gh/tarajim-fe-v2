import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { Navbar } from '@/components/Navbar'
import { Toaster } from 'react-hot-toast'
import GlobalErrorBoundary from '@/components/GlobalErrorBoundary'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Tarajim Translation Platform',
  description: 'A comprehensive marketplace for book translation services',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <script src="https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/epubjs@0.3.93/dist/epub.min.js"></script>
      </head>
      <body className={inter.className}>
        <GlobalErrorBoundary>
          <Providers>
            <div className="min-h-screen bg-gray-50">
              <Navbar />
              <main className="container mx-auto px-4 py-8">
                {children}
              </main>
            </div>
            <Toaster 
              position="top-right" 
              toastOptions={{
                duration: 2000, // 2 seconds instead of default 4 seconds
                style: {
                  background: '#363636',
                  color: '#fff',
                },
                success: {
                  duration: 1500, // Success messages show for 1.5 seconds
                },
                error: {
                  duration: 3000, // Error messages show for 3 seconds
                },
              }}
            />
          </Providers>
        </GlobalErrorBoundary>
      </body>
    </html>
  )
}
