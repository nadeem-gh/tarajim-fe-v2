'use client';
import { useEffect, useState } from 'react';
import { getTranslationRequests, listRequestApplications, checkUserApplication, acceptApplication, applyToRequest, listSamples, reviewSample, getBooks, deleteTranslationRequest, deleteApplication } from '@/lib/api';
import { useRouter } from 'next/navigation';
import Notification from '@/components/Notification';

export default function RequestsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [applications, setApplications] = useState<Record<string, any[]>>({});
  const [samples, setSamples] = useState<Record<string, any[]>>({});
  const [books, setBooks] = useState<Record<string, any>>({});
  const [motivations, setMotivations] = useState<Record<string, string>>({});
  const [role, setRole] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access');
      const userRole = localStorage.getItem('role');
      
      if (!token) {
        router.push('/login');
        return;
      }
      
      // Only allow requesters and translators to access this page
      if (userRole !== 'requester' && userRole !== 'translator') {
        router.push('/dashboard');
        return;
      }
      
      setRole(userRole);
      
      // Load data only after authentication check
      (async () => {
        try {
          const [requestsData, booksData] = await Promise.all([
            getTranslationRequests(),
            getBooks()
          ]);
          setItems(requestsData as any[]);
          setBooks((booksData as any[]).reduce((acc: any, book: any) => ({ ...acc, [book.id]: book }), {}));
          
          // Load samples and applications for each request
          const samplesData: Record<string, any[]> = {};
          const applicationsData: Record<string, any[]> = {};
          
          for (const request of requestsData as any[]) {
            try {
              const requestSamples = await listSamples({ book: request.book }) as any[];
              samplesData[request.id] = requestSamples;
            } catch (e) {
              console.log('Could not load samples for request:', request.id);
              samplesData[request.id] = [];
            }
            
            // Load applications for each request based on user role
            try {
              if (userRole === 'requester') {
                // Requesters can see all applications for their requests
                const requestApps = await listRequestApplications(request.id);
                applicationsData[request.id] = requestApps;
              } else if (userRole === 'translator') {
                // For translators, check if they have applied to this request
                const userApps = await checkUserApplication(request.id);
                applicationsData[request.id] = userApps;
              }
            } catch (e) {
              console.log('Could not load applications for request:', request.id);
              applicationsData[request.id] = [];
            }
          }
          console.log('=== LOADED DATA ===');
          console.log('Samples data:', samplesData);
          console.log('Applications data:', applicationsData);
          console.log('==================');
          
          setSamples(samplesData);
          setApplications(applicationsData);
        } catch (e: any) {
          setError(e.message || 'Failed to load');
        }
      })();
    }
  }, [router]);

  async function loadApps(id: string) {
    try {
      const apps = await listRequestApplications(id);
      setApplications((prev) => ({ ...prev, [id]: apps as any[] }));
    } catch {}
  }

  async function accept(appId: string) {
    try {
      await acceptApplication(appId);
      setItems([...items]);
    } catch (e: any) {
      setError(e.message || 'Failed to accept');
    }
  }

  async function apply(id: string) {
    setError(null);
    setSuccess(null);
    try {
      const motivationText = motivations[id];
      if (!motivationText?.trim()) {
        setError('Please enter your motivation');
        return;
      }
      
      await applyToRequest(id, motivationText);
      
      // Clear the motivation for this specific request
      setMotivations(prev => ({ ...prev, [id]: '' }));
      
      setSuccess('Application submitted successfully!');
      
      // Refresh the page to show updated applications after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (e: any) {
      console.error('Application error:', e);
      if (e.message?.includes('already applied')) {
        setError('You have already applied to this request');
      } else {
        setError(e.message || 'Failed to apply');
      }
    }
  }

  async function handleApproveSample(sampleId: string) {
    setError(null);
    setSuccess(null);
    try {
      await reviewSample(sampleId, 'approved');
      setSuccess('Sample approved successfully!');
      // Refresh the page to show updated samples after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (e: any) {
      console.error('Sample approval error:', e);
      setError(e.message || 'Failed to approve sample');
    }
  }

  async function handleDeleteApplication(applicationId: string) {
    setError(null);
    setSuccess(null);
    try {
      await deleteApplication(applicationId);
      setSuccess('Application deleted successfully!');
      // Refresh the page to show updated applications after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (e: any) {
      console.error('Application deletion error:', e);
      setError(e.message || 'Failed to delete application');
    }
  }

  async function handleDeleteRequest(requestId: string) {
    if (!confirm('Are you sure you want to delete this translation request? This action cannot be undone.')) {
      return;
    }
    
    setError(null);
    setSuccess(null);
    try {
      await deleteTranslationRequest(requestId);
      setSuccess('Translation request deleted successfully!');
      // Refresh the page to show updated requests after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (e: any) {
      console.error('Delete request error:', e);
      if (e.message?.includes('applications')) {
        setError('Cannot delete request with pending applications');
      } else if (e.message?.includes('contracts')) {
        setError('Cannot delete request with active contracts');
      } else {
        setError(e.message || 'Failed to delete request');
      }
    }
  }

  async function handleRejectSample(sampleId: string) {
    setError(null);
    setSuccess(null);
    try {
      await reviewSample(sampleId, 'rejected');
      setSuccess('Sample rejected successfully!');
      // Refresh the page to show updated samples after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (e: any) {
      console.error('Sample rejection error:', e);
      setError(e.message || 'Failed to reject sample');
    }
  }

  // Group requests by book
  const requestsByBook = items.reduce((acc: any, request: any) => {
    const bookId = request.book;
    if (!acc[bookId]) {
      acc[bookId] = [];
    }
    acc[bookId].push(request);
    return acc;
  }, {});

  return (
    <main className="max-w-6xl mx-auto p-6 bg-gradient-to-br from-indigo-400/10 to-purple-400/10">
      <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-500 mb-6">Translation Requests</h1>
      
      {/* Notifications */}
      <Notification 
        message={error} 
        type="error" 
        onClose={() => setError(null)}
      />
      <Notification 
        message={success} 
        type="success" 
        onClose={() => setSuccess(null)}
      />
      
      <div className="space-y-8">
        {Object.entries(requestsByBook).map(([bookId, requests]: [string, any[]]) => {
          const book = books[bookId];
          if (!book) return null;
          
          return (
            <div key={bookId} className="bg-white rounded-2xl p-6 shadow-lg">
              {/* Book Header */}
              <div className="border-b pb-4 mb-6">
                <h2 className="text-2xl font-bold text-gray-900">{book.title}</h2>
                <p className="text-gray-600">{book.original_language} → {book.target_language}</p>
              </div>
              
              {/* Requests for this book */}
              <div className="space-y-4">
                {requests.map((request) => (
                  <div key={request.id} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="font-semibold">Request by: {request.requester?.username || request.requester || 'Unknown'}</div>
                        <div className="text-sm text-gray-600">Budget: ${(request.budget_cents / 100).toFixed(2)}</div>
                        <div className="text-sm text-gray-600">Status: <span className={`px-2 py-1 rounded text-xs ${
                          request.status === 'active' ? 'bg-green-100 text-green-800' :
                          request.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>{request.status}</span></div>
                        {/* Show application count */}
                        {applications[request.id]?.length > 0 && (
                          <div className="text-sm text-blue-600 mt-1">
                            {applications[request.id].length} application{applications[request.id].length !== 1 ? 's' : ''} received
                          </div>
                        )}
                      </div>
                      {role === 'requester' && (
                        <div className="flex gap-2">
                          {applications[request.id]?.length > 0 ? (
                            <button 
                              onClick={() => loadApps(request.id)} 
                              className="px-3 py-1 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700 transition"
                            >
                              View Applications ({applications[request.id].length})
                            </button>
                          ) : (
                            <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded text-sm">
                              No applications yet
                            </span>
                          )}
                          <button 
                            onClick={() => handleDeleteRequest(request.id)} 
                            className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition"
                            title="Delete this translation request"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                    
                    {/* Translator Application Section */}
                    {role === 'translator' && (
                      <div className="mt-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                        <h4 className="font-medium text-blue-900 mb-3 flex items-center">
                          <span className="mr-2">📝</span>
                          Translation Request Application
                        </h4>
                        {(() => {
                          const currentUsername = localStorage.getItem('username');
                          const userApplications = applications[request.id]?.filter((app: any) => {
                            return app.translator_username === currentUsername;
                          }) || [];
                          
                          if (userApplications.length > 0) {
                            const userApp = userApplications[0];
                            return (
                              <div className="text-center py-3">
                                <div className="mb-3">
                                  <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                                    userApp.status === 'accepted' ? 'bg-green-100 text-green-800 border border-green-200' :
                                    userApp.status === 'rejected' ? 'bg-red-100 text-red-800 border border-red-200' :
                                    'bg-yellow-100 text-yellow-800 border border-yellow-200'
                                  }`}>
                                    {userApp.status === 'accepted' ? '✓ Application Accepted' :
                                     userApp.status === 'rejected' ? '✗ Application Rejected' :
                                     '⏳ Application Pending Review'}
                                  </span>
                                </div>
                                {userApp.motivation && (
                                  <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                                    <div className="font-medium mb-1">Your Application:</div>
                                    <div className="text-gray-600">"{userApp.motivation}"</div>
                                  </div>
                                )}
                                <div className="mt-3 text-xs text-gray-500">
                                  Applied on {new Date(userApp.created_at).toLocaleDateString()}
                                </div>
                                {userApp.status === 'applied' && (
                                  <div className="mt-3">
                                    <button 
                                      onClick={() => handleDeleteApplication(userApp.id)} 
                                      className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition"
                                    >
                                      Delete Application
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          }
                          
                          return (
                            <div className="space-y-3">
                              <div className="text-center mb-3">
                                <div className="text-sm text-gray-600 mb-2">You haven't applied to this request yet</div>
                                <div className="text-xs text-gray-500">Fill out the form below to submit your application</div>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Why are you interested in this translation?
                                </label>
                                <textarea 
                                  className="w-full border border-gray-300 p-3 text-sm rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                                  placeholder="Tell us about your experience and motivation for this translation..." 
                                  value={motivations[request.id] || ''} 
                                  onChange={(e) => setMotivations(prev => ({ ...prev, [request.id]: e.target.value }))}
                                  rows={3}
                                />
                              </div>
                              <div className="flex justify-end">
                                <button 
                                  onClick={() => apply(request.id)} 
                                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-sm font-medium hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                  disabled={!motivations[request.id]?.trim()}
                                >
                                  Submit Application
                                </button>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}

                    {/* Applications Section - Only for requesters */}
                    {role === 'requester' && applications[request.id]?.length ? (
                      <div className="mt-3">
                        <h4 className="font-medium text-sm mb-2">Applications ({applications[request.id].length})</h4>
                        <div className="space-y-2">
                          {applications[request.id].map((a) => (
                            <div key={a.id} className="bg-white p-3 rounded border flex items-center justify-between">
                              <div className="flex-1">
                                <div className="text-sm font-medium">
                                  {a.translator_username || a.translator?.username || a.translator || 'Unknown'}
                                </div>
                                {a.motivation && (
                                  <div className="text-xs text-gray-600 mt-1">
                                    {a.motivation.slice(0, 80)}...
                                  </div>
                                )}
                              </div>
                              <div className="ml-3">
                                {a.status === 'applied' && (
                                  <button 
                                    onClick={() => accept(a.id)} 
                                    className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition"
                                  >
                                    ✓ Accept
                                  </button>
                                )}
                                {a.status === 'accepted' && (
                                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                                    ✓ Accepted
                                  </span>
                                )}
                                {a.status === 'rejected' && (
                                  <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">
                                    ✗ Rejected
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {/* Sample Translations Section - Only for requesters */}
                    {role === 'requester' && samples[request.id]?.length ? (
                      <div className="mt-4">
                        <h4 className="font-medium text-sm mb-2">Sample Translations ({samples[request.id].length})</h4>
                        <div className="space-y-2">
                          {samples[request.id].map((sample) => (
                            <div key={sample.id} className="bg-white p-3 rounded border">
                              <div className="flex items-center justify-between mb-2">
                                <div className="text-sm font-medium">
                                  Sample by: {sample.translator?.username || sample.translator || 'Unknown'}
                                </div>
                                <span className={`px-2 py-1 rounded text-xs ${
                                  sample.status === 'approved' ? 'bg-green-100 text-green-800' :
                                  sample.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                  sample.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
                                  'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {sample.status === 'submitted' ? 'Pending Review' : sample.status}
                                </span>
                              </div>
                              <div className="text-xs text-gray-600 mb-2">
                                {sample.text?.slice(0, 150)}...
                              </div>
                              {role === 'requester' && sample.status === 'submitted' && (
                                <div className="flex gap-2">
                                  <button 
                                    onClick={() => handleApproveSample(sample.id)}
                                    className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition"
                                  >
                                    ✓ Approve
                                  </button>
                                  <button 
                                    onClick={() => handleRejectSample(sample.id)}
                                    className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition"
                                  >
                                    ✗ Reject
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}

