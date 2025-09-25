'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { getBooks, apiFetch } from '@/lib/api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useServerError } from '@/hooks/useServerError';
import ServerErrorPage from '@/components/ServerErrorPage';

export default function BooksPage() {
  const [books, setBooks] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [existingRequests, setExistingRequests] = useState<Set<string>>(new Set());
  const [existingContracts, setExistingContracts] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalBooks, setTotalBooks] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const router = useRouter();
  const isLoadingRef = useRef(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [selectedBook, setSelectedBook] = useState<any>(null);
  const [budget, setBudget] = useState('100.00');
  
  // Server error handling
  const { hasError, error: serverError, handleError, retry } = useServerError();

  // Note: Backend should not return duplicates, but we'll keep this as a safety measure
  const deduplicateBooks = useCallback((booksArray: any[]) => {
    const seen = new Set();
    return booksArray.filter(book => {
      if (seen.has(book.id)) {
        console.warn('BooksPage: Backend returned duplicate book', book.id, '- this should not happen');
        return false;
      }
      seen.add(book.id);
      return true;
    });
  }, []);

  // Load books function
  const loadBooks = useCallback(async (page: number, reset: boolean = false) => {
    if (loading || isLoadingRef.current) {
      console.log('BooksPage: Skipping loadBooks - already loading');
      return;
    }
    
    // Prevent loading the same page twice
    if (!reset && currentPage >= page) {
      console.log('BooksPage: Skipping loadBooks - page already loaded', { currentPage, requestedPage: page });
      return;
    }
    
    console.log('BooksPage: Loading books page', page, 'reset:', reset, 'currentPage:', currentPage);
    isLoadingRef.current = true;
    setLoading(true);
    setError(null); // Clear any previous errors
    try {
      const response = await getBooks(page, 12) as any; // Use consistent page size
      console.log('BooksPage: API response', { page, response });
      
      if (reset) {
        setBooks(response.results || response);
      } else {
        // Append new books (backend should not return duplicates)
        const newBooks = response.results || response;
        setBooks(prev => {
          console.log('BooksPage: Appending books', { 
            prevCount: prev.length, 
            newCount: newBooks.length
          });
          return [...prev, ...newBooks];
        });
      }
      
      // Update pagination info
      if (response.total_books !== undefined) {
        console.log('BooksPage: Updating pagination state', {
          totalBooks: response.total_books,
          totalPages: response.total_pages,
          hasNext: response.has_next,
          currentPage: response.current_page,
          next: response.next
        });
        setTotalBooks(response.total_books);
        setTotalPages(response.total_pages);
        setHasNextPage(response.has_next);
        setCurrentPage(response.current_page);
      }
      
      // Load requests and contracts for requester on first load
      if (reset && userRole === 'requester') {
        try {
          const [requests, contracts] = await Promise.all([
            apiFetch('/translations/requests'),
            apiFetch('/payments/contracts')
          ]) as [any[], any[]];
          
          const requestBookIds = new Set(requests.map((r: any) => r.book));
          const contractBookIds = new Set();
          
          // Map contracts to book IDs through requests
          contracts.forEach((contract: any) => {
            const request = requests.find((r: any) => r.id === contract.request);
            if (request) {
              contractBookIds.add(request.book);
            }
          });
          
          setExistingRequests(requestBookIds as Set<string>);
          setExistingContracts(contractBookIds as Set<string>);
        } catch (e: any) {
          console.log('Could not fetch requests/contracts:', e);
          handleError(e);
        }
      }
    } catch (e: any) {
      setError(e.message || 'Failed to load books');
      handleError(e);
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, [loading, userRole, handleError, currentPage]);

  // Load more books
  const loadMore = useCallback(() => {
    if (hasNextPage && !loading) {
      console.log('BooksPage: loadMore called', { hasNextPage, loading, currentPage });
      loadBooks(currentPage + 1, false);
    } else {
      console.log('BooksPage: loadMore blocked', { hasNextPage, loading, currentPage });
    }
  }, [hasNextPage, loading, currentPage, loadBooks]);

  // Scroll event handler with debouncing
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const handleScroll = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const scrollPosition = window.innerHeight + document.documentElement.scrollTop;
        const documentHeight = document.documentElement.offsetHeight;
        const threshold = documentHeight - 1000;
        
        console.log('BooksPage: Scroll check', { scrollPosition, documentHeight, threshold, hasNextPage, loading, currentPage });
        
        if (scrollPosition >= threshold && hasNextPage && !loading) {
          console.log('BooksPage: Triggering loadMore from scroll');
          loadMore();
        }
      }, 200); // 200ms debounce
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timeoutId);
    };
  }, [loadMore]);

  useEffect(() => {
    // Check authentication and role
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access');
      const role = localStorage.getItem('role');
      
      if (!token) {
        router.push('/login');
        return;
      }
      
      setUserRole(role);
    }
  }, [router]);

  // Load initial books when userRole is set
  useEffect(() => {
    console.log('BooksPage: useEffect triggered for userRole', userRole);
    if (userRole) {
      console.log('BooksPage: Loading initial books for userRole:', userRole);
      loadBooks(1, true);
    }
  }, [userRole]); // Remove loadBooks from dependencies to prevent circular dependency

  // Debug: Log books array changes
  useEffect(() => {
    const uniqueIds = new Set(books.map(b => b.id));
    const hasDuplicates = books.length !== uniqueIds.size;
    
    console.log('BooksPage: Books array updated', { 
      count: books.length, 
      uniqueCount: uniqueIds.size,
      ids: books.map(b => b.id),
      hasDuplicates,
      duplicateIds: hasDuplicates ? books.filter((book, index) => books.findIndex(b => b.id === book.id) !== index).map(b => b.id) : []
    });
    
    if (hasDuplicates) {
      console.error('BooksPage: Duplicate books detected in state!', books);
    }
  }, [books]);

  // Show server error page if server is down
  if (hasError) {
    return (
      <ServerErrorPage 
        error={serverError || undefined} 
        onRetry={async () => {
          console.log('BooksPage: Retry triggered');
          try {
            // Clear error state first
            setError(null);
            setBooks([]);
            setCurrentPage(0);
            setHasNextPage(true);
            
            // Reload books
            await loadBooks(1, true);
            console.log('BooksPage: Retry successful');
          } catch (e: any) {
            console.error('BooksPage: Retry failed', e);
            handleError(e);
          }
        }} 
      />
    );
  }

  return (
    <main className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-500">Book Catalog</h1>
        {totalBooks > 0 && (
          <div className="text-sm text-gray-600">
            Showing {books.length} of {totalBooks} books
            {totalPages > 1 && (
              <span className="ml-2">• Page {currentPage} of {totalPages}</span>
            )}
            <span className="ml-2 text-xs text-gray-500">
              {hasNextPage ? 'More available' : 'All loaded'}
            </span>
          </div>
        )}
      </div>
      
      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
      
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {books.map((b) => (
          <div key={b.id} className="bg-white rounded-2xl shadow hover:shadow-lg transition p-0 overflow-hidden">
            <div className="h-40 bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-5xl text-white">📖</div>
            <div className="p-4 space-y-2">
              <div className="font-semibold">{b.title}</div>
              <div className="text-sm text-gray-600">{b.original_language} → {b.target_language}</div>
              <div className="flex gap-2 pt-2">
                <Link href={`/books/${b.id}`} className="px-3 py-1 rounded-full text-white bg-gradient-to-r from-indigo-500 to-purple-500 text-sm">View Details</Link>
                {userRole === 'requester' && !existingRequests.has(b.id) && (
                  <button
                    onClick={() => {
                      setSelectedBook(b);
                      setShowBudgetModal(true);
                    }}
                    className="px-3 py-1 rounded-full text-white bg-gradient-to-r from-green-500 to-blue-500 text-sm hover:shadow-lg transition"
                  >
                    Request Translation
                  </button>
                )}
                {userRole === 'requester' && existingRequests.has(b.id) && !existingContracts.has(b.id) && (
                  <span className="px-3 py-1 rounded-full text-white bg-gradient-to-r from-yellow-500 to-orange-500 text-sm">Request Created</span>
                )}
                {userRole === 'requester' && existingRequests.has(b.id) && existingContracts.has(b.id) && (
                  <span className="px-3 py-1 rounded-full text-white bg-gradient-to-r from-green-500 to-green-600 text-sm">✓ Contract Signed</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Loading indicator */}
      {loading && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
          <span className="ml-2 text-gray-600">Loading more books...</span>
        </div>
      )}
      
      {/* End of results message */}
      {!hasNextPage && books.length > 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>You've reached the end! No more books to load.</p>
          <p className="text-sm mt-2">Showing all {books.length} books</p>
        </div>
      )}
      
      {/* No books message */}
      {books.length === 0 && !loading && !error && (
        <div className="text-center py-12 text-gray-500">
          <p>No books found.</p>
        </div>
      )}

      {/* Budget Modal */}
      {showBudgetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Create Translation Request</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Book: {selectedBook?.title}
                </label>
                <div className="text-sm text-gray-500">
                  {selectedBook?.original_language} → {selectedBook?.target_language}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Budget (USD)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter budget amount"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowBudgetModal(false);
                    setSelectedBook(null);
                    setBudget('100.00');
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    try {
                      const response = await apiFetch('/translations/requests', {
                        method: 'POST',
                        body: JSON.stringify({
                          book: selectedBook.id,
                          requester: localStorage.getItem('user_id') || '1',
                          budget: parseFloat(budget),
                          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                        })
                      });
                      
                      alert('Translation request created successfully!');
                      setShowBudgetModal(false);
                      setSelectedBook(null);
                      setBudget('100.00');
                      window.location.reload();
                    } catch (error: any) {
                      alert(`Error: ${error.message || 'Failed to create request'}`);
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create Request
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

