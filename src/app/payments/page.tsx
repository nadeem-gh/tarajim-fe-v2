'use client';
import { useEffect, useState } from 'react';
import { getContracts, getEscrows, createContract, signContract, fundEscrow, releaseEscrow, completeMilestone } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function PaymentsPage() {
  const router = useRouter();
  const [contracts, setContracts] = useState<any[]>([]);
  const [escrows, setEscrows] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check authentication and role
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access');
      const role = localStorage.getItem('role');
      
      if (!token) {
        router.push('/login');
        return;
      }
      
      if (role !== 'requester') {
        router.push('/dashboard');
        return;
      }
      
      setUserRole(role);
    }
    
    loadData();
  }, [router]);

  async function loadData() {
    try {
      setLoading(true);
      const [contractsData, escrowsData] = await Promise.all([
        getContracts(),
        getEscrows()
      ]);
      setContracts(contractsData as any[]);
      setEscrows(escrowsData as any[]);
    } catch (e: any) {
      setError(e.message || 'Failed to load payment data');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateContract(requestId: string, amount: number) {
    setError(null);
    try {
      const contract = await createContract({
        application: requestId,
        total_amount_cents: amount
      });
      console.log('Contract created:', contract);
      await loadData(); // Refresh data
    } catch (e: any) {
      setError(e.message || 'Failed to create contract');
    }
  }

  async function handleSignContract(contractId: string) {
    setError(null);
    try {
      await signContract(contractId);
      console.log('Contract signed');
      await loadData(); // Refresh data
    } catch (e: any) {
      setError(e.message || 'Failed to sign contract');
    }
  }

  async function handleFundEscrow(escrowId: string) {
    setError(null);
    try {
      await fundEscrow(escrowId);
      console.log('Escrow funded');
      await loadData(); // Refresh data
    } catch (e: any) {
      setError(e.message || 'Failed to fund escrow');
    }
  }

  async function handleReleaseEscrow(escrowId: string) {
    setError(null);
    try {
      await releaseEscrow(escrowId);
      console.log('Escrow released');
      await loadData(); // Refresh data
    } catch (e: any) {
      setError(e.message || 'Failed to release escrow');
    }
  }

  async function handleCompleteMilestone(milestoneId: string) {
    setError(null);
    try {
      const result = await completeMilestone(milestoneId);
      console.log('Milestone completed:', result);
      await loadData(); // Refresh data
    } catch (e: any) {
      setError(e.message || 'Failed to complete milestone');
    }
  }

  if (loading) return <main className="p-6">Loading...</main>;

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Payment Management</h1>
        <button 
          onClick={loadData}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          🔄 Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Contracts Section */}
      <section>
        <h2 className="text-xl font-medium mb-4">Contracts</h2>
        {contracts.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <div className="text-4xl mb-2">📄</div>
            <p className="text-gray-600">No contracts found</p>
            <p className="text-sm text-gray-500">Create a translation request first</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {contracts.map((contract) => (
              <div key={contract.id} className="bg-white border rounded-lg p-6 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">Contract {contract.id.slice(0, 8)}...</h3>
                    <p className="text-sm text-gray-600">
                      Amount: ${(contract.total_amount_cents / 100).toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-600">
                      Status: <span className={`px-2 py-1 rounded text-xs ${
                        contract.status === 'signed' ? 'bg-green-100 text-green-800' :
                        contract.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {contract.status}
                      </span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Created: {new Date(contract.created_at).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-600 mt-2">
                      Book: {contract.book_title} ({contract.book_original_language} → {contract.book_target_language})
                    </p>
                    <p className="text-sm text-gray-600">
                      Translator: {contract.translator_username}
                    </p>
                  </div>
                </div>

                {/* Translation Progress Section */}
                <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium text-blue-900">Translation Progress</h4>
                    <span className="text-sm text-blue-700 font-medium">
                      {contract.translation_progress_percentage?.toFixed(1) || 0}%
                    </span>
                  </div>
                  
                  <div className="w-full bg-blue-200 rounded-full h-2 mb-3">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${contract.translation_progress_percentage || 0}%` }}
                    ></div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Status:</span>
                      <span className={`ml-2 font-medium ${
                        contract.translation_status === 'completed' ? 'text-green-600' :
                        contract.translation_status === 'in_progress' ? 'text-blue-600' :
                        'text-gray-600'
                      }`}>
                        {contract.translation_status === 'completed' ? '✅ Completed' :
                         contract.translation_status === 'in_progress' ? '🔄 In Progress' :
                         '⏳ Pending'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Progress:</span>
                      <span className="ml-2 font-medium text-blue-700">
                        {contract.translation_completed_sentences_count || 0} / {contract.translation_sentences_count || 0} sentences
                      </span>
                    </div>
                  </div>
                </div>

                {/* Contract Management Actions */}
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">Contract Management</h4>
                  <div className="flex flex-wrap gap-2">
                    {contract.status === 'pending' && (
                      <button
                        onClick={() => handleSignContract(contract.id)}
                        className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                      >
                        ✍️ Sign Contract
                      </button>
                    )}
                    
                    {contract.status === 'signed' && (
                      <div className="flex items-center gap-2 text-green-600">
                        <span>✓</span>
                        <span className="text-sm">Contract Signed</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Associated Escrow */}
                {contract.escrow && (
                  <div className="border-t pt-4 mt-4">
                    <h4 className="font-medium mb-3">Escrow Account</h4>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Escrow Status:</span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          contract.escrow.status === 'funded' ? 'bg-green-100 text-green-800' :
                          contract.escrow.status === 'released' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {contract.escrow.status}
                        </span>
                      </div>
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-sm">Amount: ${(contract.escrow.amount_cents / 100).toFixed(2)}</span>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        {contract.escrow.status === 'unfunded' && (
                          <button
                            onClick={() => handleFundEscrow(contract.escrow.id)}
                            className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition flex items-center gap-2"
                          >
                            💰 Fund Escrow
                          </button>
                        )}
                        
                        {contract.escrow.status === 'funded' && (
                          <button
                            onClick={() => handleReleaseEscrow(contract.escrow.id)}
                            className="px-4 py-2 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-700 transition flex items-center gap-2"
                          >
                            🚀 Release Payment
                          </button>
                        )}
                        
                        {contract.escrow.status === 'released' && (
                          <div className="flex items-center gap-2 text-blue-600">
                            <span>✓</span>
                            <span className="text-sm">Payment Released</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Escrow Section - Standalone escrows not associated with contracts */}
      <section>
        <h2 className="text-xl font-medium mb-4">Standalone Escrow Accounts</h2>
        {escrows.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <div className="text-4xl mb-2">💰</div>
            <p className="text-gray-600">No escrow accounts found</p>
            <p className="text-sm text-gray-500">Create and sign a contract first</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {escrows.map((escrow) => (
              <div key={escrow.id} className="bg-white border rounded-lg p-4 shadow-sm">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold">Escrow {escrow.id.slice(0, 8)}...</h3>
                    <p className="text-sm text-gray-600">
                      Amount: ${(escrow.amount_cents / 100).toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-600">
                      Status: <span className={`px-2 py-1 rounded text-xs ${
                        escrow.status === 'funded' ? 'bg-green-100 text-green-800' :
                        escrow.status === 'released' ? 'bg-purple-100 text-purple-800' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {escrow.status}
                      </span>
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {escrow.status === 'pending' && (
                      <button
                        onClick={() => handleFundEscrow(escrow.id)}
                        className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition"
                      >
                        Fund
                      </button>
                    )}
                    {escrow.status === 'funded' && (
                      <button
                        onClick={() => handleReleaseEscrow(escrow.id)}
                        className="px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 transition"
                      >
                        Release
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Milestones Section */}
      <section>
        <h2 className="text-xl font-medium mb-4">Project Milestones</h2>
        {contracts.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <div className="text-4xl mb-2">🎯</div>
            <p className="text-gray-600">No contracts with milestones found</p>
            <p className="text-sm text-gray-500">Create a contract with milestones first</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {contracts.map((contract) => (
              contract.milestones && contract.milestones.length > 0 && (
                <div key={contract.id} className="bg-white border rounded-lg p-6 shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">Contract {contract.id.slice(0, 8)}...</h3>
                      <p className="text-sm text-gray-600">
                        Total Milestones: {contract.milestones.length}
                      </p>
                    </div>
                  </div>

                  {/* Milestones List */}
                  <div className="space-y-3">
                    {contract.milestones.map((milestone: any) => (
                      <div key={milestone.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{milestone.title}</div>
                          <div className="text-sm text-gray-600">
                            Amount: ${(milestone.amount_cents / 100).toFixed(2)}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-1 rounded text-xs ${
                            milestone.status === 'completed' ? 'bg-green-100 text-green-800' :
                            milestone.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {milestone.status}
                          </span>
                          
                          {milestone.status === 'pending' && (
                            <button
                              onClick={() => handleCompleteMilestone(milestone.id)}
                              className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition"
                            >
                              ✓ Complete
                            </button>
                          )}
                          
                          {milestone.status === 'completed' && (
                            <div className="flex items-center gap-1 text-green-600">
                              <span>✓</span>
                              <span className="text-sm">Completed</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            ))}
          </div>
        )}
      </section>

      {/* Quick Actions */}
      <section>
        <h2 className="text-xl font-medium mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">Create Contract</h3>
            <p className="text-sm text-blue-800 mb-3">Create a new contract for a translation request</p>
            <button 
              onClick={() => router.push('/books')}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition"
            >
              New Request
            </button>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-medium text-green-900 mb-2">Fund Escrow</h3>
            <p className="text-sm text-green-800 mb-3">Fund an escrow account to secure payment</p>
            <button 
              onClick={loadData}
              className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition"
            >
              View Escrows
            </button>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="font-medium text-purple-900 mb-2">Release Payment</h3>
            <p className="text-sm text-purple-800 mb-3">Release payment to translator after completion</p>
            <button 
              onClick={loadData}
              className="px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 transition"
            >
              View Payments
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
