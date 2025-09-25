'use client';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AssignmentsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access');
      const role = localStorage.getItem('role');
      
      if (!token) {
        router.push('/login');
        return;
      }
      
      // Only allow translators to access this page
      if (role !== 'translator') {
        router.push('/dashboard');
        return;
      }
    }
    
    (async () => {
      try {
        setLoading(true);
        
        // Load translations and contracts in parallel
        const [translationsData, contractsData] = await Promise.all([
          apiFetch('/translations'),
          apiFetch('/payments/contracts')
        ]);
        
        console.log('Assignments data:', translationsData);
        console.log('Contracts data:', contractsData);
        console.log('Data type:', typeof translationsData, 'Is array:', Array.isArray(translationsData));
        
        if (Array.isArray(translationsData)) {
          translationsData.forEach((item, index) => {
            console.log(`Item ${index}:`, item);
            console.log(`Item ${index} ID:`, typeof item?.id, item?.id);
          });
        }
        
        setItems(translationsData as any[]);
        setContracts(contractsData as any[]);
      } catch (e: any) {
        console.error('Failed to load assignments:', e);
        setError(e.message || 'Failed to load your translation assignments');
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  // Helper function to check if a translation has a signed contract
  const hasSignedContract = (translation: any) => {
    if (!contracts || contracts.length === 0) return false;
    
    // Find contracts related to this translation
    const relatedContracts = contracts.filter(contract => {
      // Check if contract is related to this translation through the request
      return contract.request_id === translation.request?.id || 
             contract.application_id === translation.request?.id ||
             contract.book_id === translation.book;
    });
    
    // Check if any related contract is signed
    return relatedContracts.some(contract => contract.status === 'signed');
  };

  return (
    <main className="max-w-4xl mx-auto p-6 bg-gradient-to-br from-indigo-400/10 to-purple-400/10 min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-500 mb-2">
          My Translation Assignments
        </h1>
        <p className="text-gray-600">Manage your active translation projects and track your progress</p>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <span className="text-red-600 mr-2">⚠️</span>
            <p className="text-red-800 font-medium">{error}</p>
          </div>
        </div>
      )}
      
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your assignments...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-8xl mb-6">📚</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No Translation Assignments Yet</h2>
          <p className="text-lg text-gray-600 mb-6 max-w-md mx-auto">
            You don't have any active translation assignments. Apply to translation requests to get started with your first project!
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-md mx-auto">
            <h3 className="font-semibold text-blue-900 mb-2">How to get started:</h3>
            <ol className="text-sm text-blue-800 text-left space-y-1">
              <li>1. Browse available translation requests</li>
              <li>2. Apply to requests that interest you</li>
              <li>3. Wait for the requester to accept your application</li>
              <li>4. Start translating once accepted!</li>
            </ol>
          </div>
          <div className="mt-6">
            <Link 
              href="/translations/requests"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all duration-200 font-medium"
            >
              Browse Translation Requests
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-6">
          {items.filter(t => t && t.id).map((t) => (
            <div key={t.id} className="bg-white border rounded-xl p-6 shadow-sm hover:shadow-lg transition-all duration-300">
              {/* Header Section */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="font-bold text-xl text-gray-900 mb-2">
                    {t.request?.book_title || 'Translation Assignment'}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      {t.request?.book_original_language} → {t.request?.book_target_language}
                    </span>
                    <span className="text-gray-400">•</span>
                    <span>Assignment ID: {t.id ? String(t.id).slice(0, 8) : 'Unknown'}...</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                    t.status === 'completed' ? 'bg-green-100 text-green-800' :
                    t.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                    t.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {t.status?.replace('_', ' ').toUpperCase() || 'PENDING'}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {t.progress_percentage || 0}% Complete
                  </div>
                </div>
              </div>
              
              {/* Progress Section */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Translation Progress</span>
                  <span className="text-sm text-gray-600">{t.progress_percentage || 0}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${t.progress_percentage || 0}%` }}
                  ></div>
                </div>
              </div>
              
              {/* Details Section */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-sm">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="font-medium text-gray-700 mb-1">Created</div>
                  <div className="text-gray-600">
                    {new Date(t.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="font-medium text-gray-700 mb-1">Last Updated</div>
                  <div className="text-gray-600">
                    {new Date(t.updated_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="font-medium text-gray-700 mb-1">Contract Status</div>
                  <div className="text-gray-600">
                    {(() => {
                      if (!contracts || contracts.length === 0) return 'No contract';
                      
                      const relatedContracts = contracts.filter(contract => {
                        return contract.request_id === t.request?.id || 
                               contract.application_id === t.request?.id ||
                               contract.book_id === t.book;
                      });
                      
                      if (relatedContracts.length === 0) return 'No contract';
                      
                      const signedContract = relatedContracts.find(contract => contract.status === 'signed');
                      if (signedContract) return '✅ Signed';
                      
                      const pendingContract = relatedContracts.find(contract => contract.status === 'pending');
                      if (pendingContract) return '⏳ Pending signature';
                      
                      return '❌ Not signed';
                    })()}
                  </div>
                </div>
              </div>
              
              {/* Action Button */}
              <div className="flex justify-center">
                {t.id ? (
                  hasSignedContract(t) ? (
                    <Link 
                      href={`/translations/work/${t.id}`}
                      className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all duration-200 font-medium text-center"
                    >
                      {t.progress_percentage > 0 ? 'Continue Translation' : 'Start Translation'}
                    </Link>
                  ) : (
                    <div className="w-full px-6 py-3 bg-yellow-100 text-yellow-800 rounded-lg text-center font-medium border border-yellow-300">
                      ⏳ Waiting for contract to be signed
                    </div>
                  )
                ) : (
                  <div className="w-full px-6 py-3 bg-gray-400 text-white rounded-lg text-center font-medium">
                    Translation ID not available
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

