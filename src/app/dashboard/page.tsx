'use client';
import { useEffect, useState } from 'react';
import { getBooks, getTranslationRequests, getMe, getReaderTranslations } from '@/lib/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useServerError } from '@/hooks/useServerError';
import ServerErrorPage from '@/components/ServerErrorPage';

export default function DashboardPage() {
  const [books, setBooks] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [me, setMe] = useState<any | null>(null);
  const [readerTranslations, setReaderTranslations] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  
  // Server error handling
  const { hasError, error: serverError, handleError, retry } = useServerError();

  useEffect(() => {
    if (typeof window !== 'undefined' && !localStorage.getItem('access')) {
      router.push('/login');
      return;
    }
    (async () => {
      try {
        const [m, b, r] = await Promise.all([getMe(), getBooks(), getTranslationRequests()]);
        setMe(m);
        setBooks(b as any[]);
        setRequests(r as any[]);
        
        // Load reader translations if user is a reader
        if ((m as any)?.role === 'reader') {
          try {
            const readerData = await getReaderTranslations();
            setReaderTranslations(readerData);
          } catch (e) {
            console.log('Could not load reader translations:', e);
          }
        }
      } catch (e: any) {
        setError(e.message || 'Failed to load data');
        handleError(e);
      }
    })();
  }, [router, handleError]);

  // Show server error page if server is down
  if (hasError) {
    return (
      <ServerErrorPage 
        error={serverError || undefined} 
        onRetry={async () => retry(async () => window.location.reload())} 
      />
    );
  }

  return (
    <main className="p-6 space-y-8 bg-gradient-to-br from-indigo-400/10 to-purple-400/10">
      <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-500">Dashboard</h1>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <section className="grid md:grid-cols-2 gap-4">
        {[
          { label: 'Books Available', value: books.length },
          { label: 'Translation Requests', value: requests.length },
        ].map((c) => (
          <div key={c.label} className="bg-white rounded-2xl p-5 shadow">
            <div className="text-sm text-gray-600">{c.label}</div>
            <div className="text-2xl font-semibold text-indigo-600">{c.value}</div>
          </div>
        ))}
      </section>
      <section className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-5 shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-medium">Recent Books</h2>
            <Link href="/books" className="text-sm text-blue-600 hover:text-blue-800 transition">
              View All Books →
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {books.slice(0, 4).map((b) => (
              <Link key={b.id} href={`/books/${b.id}`} className="border rounded-lg p-3 hover:shadow-md transition hover:bg-gray-50">
                <div className="font-medium text-sm">{b.title}</div>
                <div className="text-xs text-gray-600">{b.original_language} → {b.target_language}</div>
                <div className="text-xs text-blue-600 mt-1">Click to view details →</div>
              </Link>
            ))}
          </div>
        </div>
        {/* Translation Requests - Only for requesters and translators */}
        {(me?.role === 'requester' || me?.role === 'translator') && (
          <div className="bg-white rounded-2xl p-5 shadow">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-medium">Translation Requests</h2>
              <Link href="/translations/requests" className="text-sm text-blue-600 hover:text-blue-800 transition">
                View All Requests →
              </Link>
            </div>
            <ul className="space-y-2">
              {requests.map((r) => {
                const book = books.find(b => b.id === r.book);
                return (
                  <li key={r.id} className="border p-3 rounded-lg hover:shadow-md transition">
                    <Link href={`/books/${r.book}`} className="block">
                      <div className="font-medium">{book?.title || 'Unknown Book'}</div>
                      <div className="text-sm text-gray-600">Status: <span className={`px-2 py-1 rounded text-xs ${
                        r.status === 'active' ? 'bg-green-100 text-green-800' :
                        r.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>{r.status}</span></div>
                      <div className="text-sm text-gray-600">Budget: ${(r.budget_cents / 100).toFixed(2)}</div>
                      <div className="text-xs text-blue-600 mt-1">Click to view book details →</div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Available Translations - For readers */}
        {me?.role === 'reader' && (
          <div className="bg-white rounded-2xl p-5 shadow">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-medium">Available Translations</h2>
              <Link href="/books" className="text-sm text-blue-600 hover:text-blue-800 transition">
                Browse All Books →
              </Link>
            </div>
            
            {readerTranslations ? (
              <div className="space-y-4">
                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{readerTranslations.stats.total_approved_samples}</div>
                    <div className="text-sm text-gray-600">Approved Samples</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{readerTranslations.stats.total_completed_translations}</div>
                    <div className="text-sm text-gray-600">Completed Translations</div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{readerTranslations.stats.total_available}</div>
                    <div className="text-sm text-gray-600">Total Available</div>
                  </div>
                </div>

                {/* Approved Samples */}
                {readerTranslations.approved_samples.length > 0 && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Approved Sample Translations</h3>
                    <div className="space-y-2">
                      {readerTranslations.approved_samples.slice(0, 3).map((sample: any) => (
                        <div key={sample.id} className="border rounded-lg p-3 hover:shadow-md transition">
                          <Link href={`/translations/samples/${sample.id}`} className="block">
                            <div className="font-medium text-sm">{sample.book_title}</div>
                            <div className="text-xs text-gray-600">Page {sample.page_number} • {sample.language_pair}</div>
                            <div className="text-xs text-gray-500 mt-1">by {sample.translator_username}</div>
                            <div className="text-xs text-gray-400 mt-1">{sample.text_preview}</div>
                          </Link>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Completed Translations */}
                {readerTranslations.completed_translations.length > 0 && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Completed Translations</h3>
                    <div className="space-y-2">
                      {readerTranslations.completed_translations.slice(0, 3).map((translation: any) => (
                        <div key={translation.id} className="border rounded-lg p-3 hover:shadow-md transition">
                          <Link href={`/books/${translation.book_id}`} className="block">
                            <div className="font-medium text-sm">{translation.book_title}</div>
                            <div className="text-xs text-gray-600">{translation.language_pair}</div>
                            <div className="text-xs text-gray-500 mt-1">by {translation.translator_username}</div>
                            <div className="text-xs text-green-600 mt-1">✓ Completed</div>
                          </Link>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {readerTranslations.stats.total_available === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p>No translations available yet</p>
                    <Link href="/books" className="mt-2 inline-block px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
                      Explore Books
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>Loading available translations...</p>
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}

