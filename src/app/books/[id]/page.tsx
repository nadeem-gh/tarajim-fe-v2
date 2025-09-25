'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { getBooks, getBookPages, getBookSamplePages, getTranslationRequests, listRequestApplications, acceptApplication, createContract, signContract, getUserSamplesForBook, createMilestone, getContractMilestones, updateMilestone, deleteMilestone, submitSample, reviewSample } from '@/lib/api';

export default function BookDetailPage() {
  const params = useParams();
  const id = params.id as string;
  
  const [book, setBook] = useState<any>(null);
  const [pages, setPages] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [applications, setApplications] = useState<Record<string, any[]>>({});
  const [requesterContracts, setRequesterContracts] = useState<any[]>([]);
  const [translatorContracts, setTranslatorContracts] = useState<any[]>([]);
  const [translatorTranslations, setTranslatorTranslations] = useState<any[]>([]);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>('');
  const [totalCents, setTotalCents] = useState('');
  
  // Multi-application view state
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [assignedPages, setAssignedPages] = useState<number[]>([]);
  const [assignedBudget, setAssignedBudget] = useState('');
  
  // Sample translation submission state
  const [samplePages, setSamplePages] = useState<any[]>([]);
  const [userSamples, setUserSamples] = useState<any[]>([]);
  const [selectedSamplePage, setSelectedSamplePage] = useState<number | null>(null);
  const [sampleTranslation, setSampleTranslation] = useState('');
  const [sampleNotes, setSampleNotes] = useState('');
  
  // Milestone management state
  const [milestones, setMilestones] = useState<any[]>([]);
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [milestoneTitle, setMilestoneTitle] = useState('');
  const [milestoneAmount, setMilestoneAmount] = useState('');
  const [editingMilestone, setEditingMilestone] = useState<any>(null);
  const [currentContractId, setCurrentContractId] = useState<string | null>(null);

  // Pagination for pages
  const [pagesPage, setPagesPage] = useState(1);
  const [pagesTotal, setPagesTotal] = useState(0);
  const [pagesTotalPages, setPagesTotalPages] = useState(0);
  const [hasMorePages, setHasMorePages] = useState(false);
  const [pagesLoading, setPagesLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setUserRole(localStorage.getItem('role') || '');
        
        // Load book data
        const bookData = await apiFetch(`/books/${id}`);
        setBook(bookData);
        
        // Load applications for requesters
        if (localStorage.getItem('role') === 'requester') {
          await loadRequesterContracts();
          await loadApplications();
          await loadUserSamples();
        }
        
        // Load contracts for translators
        if (localStorage.getItem('role') === 'translator') {
          // Load applications first (required for main page display)
          await loadApplications();
          // Load contracts and translations separately to not block main page load
          await loadTranslatorContracts();
          await loadTranslatorTranslations();
        }
        
        // Load pages
        loadPages();
        
        // Load sample pages for translators
        if (localStorage.getItem('role') === 'translator') {
          loadSamplePages();
          loadUserSamples();
        }
      } catch (e: any) {
        setError(e.message || 'Failed to load');
      }
    })();
  }, [id]);

  async function loadPages() {
    try {
      setPagesLoading(true);
      const response = await getBookPages(id, pagesPage) as any;
      setPages(response.results || []);
      setPagesTotal(response.count || 0);
      setPagesTotalPages(response.total_pages || 0);
      setHasMorePages(response.next ? true : false);
    } catch (e: any) {
      console.error('Failed to load pages:', e);
      setError(e.message || 'Failed to load pages');
    } finally {
      setPagesLoading(false);
      setLoading(false);
    }
  }

  async function loadSamplePages() {
    try {
      const samplePagesData = await getBookSamplePages(id) as any[];
      setSamplePages(samplePagesData);
    } catch (e: any) {
      console.error('Failed to load sample pages:', e);
      setSamplePages([]);
    }
  }

  async function loadUserSamples() {
    try {
      const userSamplesData = await getUserSamplesForBook(id) as any[];
      console.log('Loaded user samples:', userSamplesData);
      setUserSamples(userSamplesData);
    } catch (e: any) {
      console.error('Failed to load user samples:', e);
      setUserSamples([]);
    }
  }

  async function loadMilestones(contractId: string) {
    try {
      console.log('Loading milestones for contract:', contractId);
      const milestonesData = await getContractMilestones(contractId) as any[];
      console.log('Loaded milestones:', milestonesData);
      setMilestones(prev => {
        // Remove existing milestones for this contract and add new ones
        const otherMilestones = prev.filter(m => m.contract !== contractId);
        return [...otherMilestones, ...milestonesData];
      });
    } catch (e: any) {
      console.error('Failed to load milestones:', e);
      // Don't clear all milestones, just log the error
    }
  }

  async function handleCreateMilestone(contractId: string) {
    if (!milestoneTitle.trim() || !milestoneAmount.trim()) {
      alert('Please fill in all milestone fields.');
      return;
    }

    try {
      console.log('Creating milestone:', {
        contract: contractId,
        title: milestoneTitle.trim(),
        amount_cents: Math.round(parseFloat(milestoneAmount) * 100)
      });
      
      const result = await createMilestone({
        contract: contractId,
        title: milestoneTitle.trim(),
        amount_cents: Math.round(parseFloat(milestoneAmount) * 100)
      });
      
      console.log('Milestone creation result:', result);
      alert('Milestone created successfully!');
      setMilestoneTitle('');
      setMilestoneAmount('');
      setShowMilestoneModal(false);
      setCurrentContractId(null);
      await loadMilestones(contractId);
    } catch (e: any) {
      console.error('Create milestone error:', e);
      setError(e.message || 'Failed to create milestone');
    }
  }

  async function handleUpdateMilestone(milestoneId: string) {
    if (!milestoneTitle.trim() || !milestoneAmount.trim()) {
      alert('Please fill in all milestone fields.');
      return;
    }

    try {
      await updateMilestone(milestoneId, {
        title: milestoneTitle.trim(),
        amount_cents: Math.round(parseFloat(milestoneAmount) * 100)
      });
      
      alert('Milestone updated successfully!');
      setMilestoneTitle('');
      setMilestoneAmount('');
      setEditingMilestone(null);
      // Reload milestones for the current contract
      const currentContract = requesterContracts.find(c => c.id === editingMilestone?.contract) || 
                            translatorContracts.find(c => c.id === editingMilestone?.contract);
      if (currentContract) {
        await loadMilestones(currentContract.id);
      }
    } catch (e: any) {
      console.error('Update milestone error:', e);
      setError(e.message || 'Failed to update milestone');
    }
  }

  async function handleDeleteMilestone(milestoneId: string) {
    if (!confirm('Are you sure you want to delete this milestone?')) {
      return;
    }

    try {
      await deleteMilestone(milestoneId);
      alert('Milestone deleted successfully!');
      // Reload milestones for the current contract
      const currentContract = requesterContracts.find(c => milestones.some(m => m.contract === c.id)) || 
                            translatorContracts.find(c => milestones.some(m => m.contract === c.id));
      if (currentContract) {
        await loadMilestones(currentContract.id);
      }
    } catch (e: any) {
      console.error('Delete milestone error:', e);
      setError(e.message || 'Failed to delete milestone');
    }
  }

  function openMilestoneModal(contractId: string) {
    setCurrentContractId(contractId);
    setShowMilestoneModal(true);
    setEditingMilestone(null);
    setMilestoneTitle('');
    setMilestoneAmount('');
  }

  function openEditMilestoneModal(milestone: any) {
    setEditingMilestone(milestone);
    setMilestoneTitle(milestone.title);
    setMilestoneAmount((milestone.amount_cents / 100).toString());
    setShowMilestoneModal(true);
  }

  async function loadMorePages() {
    if (hasMorePages && !pagesLoading) {
      setPagesPage(prev => prev + 1);
      try {
        setPagesLoading(true);
        const response = await getBookPages(id, pagesPage + 1) as any;
        setPages(prev => [...prev, ...(response.results || [])]);
        setHasMorePages(response.next ? true : false);
      } catch (e: any) {
        console.error('Failed to load more pages:', e);
      } finally {
        setPagesLoading(false);
      }
    }
  }

  async function loadRequesterContracts() {
    try {
      const contracts = await apiFetch('/payments/contracts') as any[];
      const bookContracts = contracts.filter(contract => contract.book_id == id);
      setRequesterContracts(bookContracts);
      
      // Load milestones for each contract
      for (const contract of bookContracts) {
        await loadMilestones(contract.id);
      }
    } catch (e: any) {
      console.error('Failed to load requester contracts:', e);
      setRequesterContracts([]);
    }
  }

  async function loadTranslatorContracts() {
    try {
      const contracts = await apiFetch('/payments/contracts') as any[];
      const bookContracts = contracts.filter(contract => contract.book_id == id);
      setTranslatorContracts(bookContracts);
      
      // Load milestones for each contract
      for (const contract of bookContracts) {
        await loadMilestones(contract.id);
      }
    } catch (e: any) {
      console.error('Failed to load translator contracts:', e);
      setTranslatorContracts([]);
    }
  }

  async function loadTranslatorTranslations() {
    try {
      console.log('Loading translator translations for book:', id);
      const translations = await apiFetch('/translations') as any[];
      console.log('All translations from API:', translations);
      
      const bookTranslations = translations.filter(translation => {
        const matches = translation.book == id || (translation.request && translation.request.book == id);
        console.log('Translation:', translation.id, 'Book:', translation.book, 'Request Book:', translation.request?.book, 'Matches:', matches);
        return matches;
      });
      
      console.log('Filtered book translations:', bookTranslations);
      setTranslatorTranslations(bookTranslations);
    } catch (e: any) {
      console.error('Failed to load translator translations:', e);
      setTranslatorTranslations([]);
    }
  }

  async function loadApplications() {
    try {
      const requestsData = await getTranslationRequests() as any[];
      console.log('All requests from API:', requestsData);
      console.log('Current book ID:', id);
      
      const bookRequests = requestsData.filter((req: any) => {
        const matches = req.book == id;
        console.log('Request:', req.id, 'Book ID:', req.book, 'Matches:', matches);
        return matches;
      });
      
      console.log('Filtered book requests:', bookRequests);
      setRequests(bookRequests);
      
      // Load applications for each request based on user role
      const apps: Record<string, any[]> = {};
      const userRole = localStorage.getItem('role');
      
      for (const request of bookRequests) {
        try {
          let appsData: any[] = [];
          
          if (userRole === 'requester') {
            // Requesters can see all applications for their requests
            appsData = await listRequestApplications(request.id) as any[];
          } else if (userRole === 'translator') {
            // Translators can only see their own applications
            try {
              appsData = await apiFetch(`/translations/requests/${request.id}/my-application`) as any[];
              console.log(`Translator applications for request ${request.id}:`, appsData);
            } catch (e) {
              console.log(`No application found for request ${request.id}:`, e);
              appsData = [];
            }
          }
          
          apps[request.id] = appsData;
        } catch (e) {
          console.error(`Failed to load applications for request ${request.id}:`, e);
          apps[request.id] = [];
        }
      }
      
      console.log('All applications loaded:', apps);
      setApplications(apps);
    } catch (e: any) {
      console.error('Failed to load applications:', e);
      setError(e.message || 'Failed to load applications');
    }
  }

  async function createContractFlow(applicationId: string) {
    try {
      const contractData = {
        application: applicationId,
        total_amount_cents: Number(totalCents)
      };
      
      await createContract(contractData);
      setTotalCents('');
      await loadApplications();
      await loadRequesterContracts();
      alert('Contract created successfully!');
    } catch (e: any) {
      console.error('Contract creation error:', e);
      setError(e.message || 'Failed to create contract');
    }
  }

  async function handleAcceptApplication(application: any) {
    try {
      // Open modal for assignment details
      setSelectedApplication(application);
      setAssignedPages([]);
      setAssignedBudget('');
      setShowAcceptModal(true);
    } catch (e: any) {
      console.error('Accept application error:', e);
      setError(e.message || 'Failed to accept application');
    }
  }

  async function confirmAcceptApplication() {
    if (!selectedApplication) return;
    
    try {
      await acceptApplication(selectedApplication.id, assignedPages, Number(assignedBudget) * 100);
      alert('Application accepted successfully!');
      setShowAcceptModal(false);
      setSelectedApplication(null);
      setAssignedPages([]);
      setAssignedBudget('');
      await loadApplications();
    } catch (e: any) {
      console.error('Accept application error:', e);
      setError(e.message || 'Failed to accept application');
    }
  }

  // Helper function to check if user has already submitted a sample for a page
  function hasUserSubmittedSampleForPage(pageNumber: number): boolean {
    return userSamples.some(sample => 
      sample.page === pageNumber || 
      sample.page_number === pageNumber ||
      (sample.page && sample.page.page_number === pageNumber)
    );
  }

  async function handleSampleTranslationSubmission() {
    if (!selectedSamplePage || !sampleTranslation.trim()) {
      alert('Please select a page and provide your translation.');
      return;
    }
    
    // Check if user has already submitted a sample for this page
    if (hasUserSubmittedSampleForPage(selectedSamplePage)) {
      alert('You have already submitted a sample translation for this page. Each page can only have one sample translation per user.');
      return;
    }
    
    try {
      // Get the selected page data
      const selectedPage = samplePages.find(page => page.page_number === selectedSamplePage);
      if (!selectedPage) {
        alert('Selected page not found.');
        return;
      }
      
      console.log('Submitting sample translation:', {
        book: id,
        page: selectedPage.id,
        original_text: selectedPage.content || '',
        translated_text: sampleTranslation.trim()
      });
      
      // Submit the sample translation
      const result = await submitSample({
        book: id,
        page: selectedPage.id,
        original_text: selectedPage.content || '',
        translated_text: sampleTranslation.trim()
      });
      
      console.log('Sample translation submission result:', result);
      alert('Sample translation submitted successfully!');
      setSelectedSamplePage(null);
      setSampleTranslation('');
      setSampleNotes('');
      // Reload user samples to reflect the new submission
      await loadUserSamples();
    } catch (e: any) {
      console.error('Sample translation submission error:', e);
      
      // Handle backend validation errors
      if (e.message && e.message.includes('already submitted')) {
        alert('You have already submitted a sample translation for this page. Each page can only have one sample translation per user.');
        // Reload user samples to update the UI
        await loadUserSamples();
      } else {
        setError(e.message || 'Failed to submit sample translation');
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading book details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">⚠️ Error</div>
          <p className="text-gray-600">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-600 text-xl mb-4">📚</div>
          <p className="text-gray-600">Book not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Book Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{book.title}</h1>
              <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
                <span>📚 {book.original_language} → {book.target_language}</span>
                <span>👤 {book.author}</span>
                <span>📅 {new Date(book.created_at).toLocaleDateString()}</span>
              </div>
              {book.description && (
                <p className="text-gray-700 leading-relaxed">{book.description}</p>
              )}
            </div>
          </div>
        </div>

        {/* Book Pages */}
        <section className="mb-8">
          <h2 className="text-xl font-medium mb-4">Book Pages</h2>
          <div className="grid gap-4">
            {pages.map((page) => (
              <div key={page.id} className="bg-white rounded-lg border p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">Page {page.page_number}</h3>
                  <span className="text-sm text-gray-500">
                    {page.content?.length || 0} characters
                  </span>
                </div>
                <div className="text-sm text-gray-900 whitespace-pre-wrap">
                  {page.content?.slice(0, 300)}
                  {page.content && page.content.length > 300 && '...'}
                </div>
              </div>
            ))}
            
            {/* Load More Button */}
            {hasMorePages && (
              <div className="text-center py-4">
                <button
                  onClick={loadMorePages}
                  disabled={pagesLoading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition"
                >
                  {pagesLoading ? 'Loading...' : 'Load More Pages'}
                </button>
              </div>
            )}
            
            {/* Pagination Info */}
            <div className="text-center text-sm text-gray-600 py-2">
              Showing {pages.length} of {pagesTotal} pages
              {pagesTotalPages > 1 && ` • Page ${pagesPage} of ${pagesTotalPages}`}
            </div>
          </div>
        </section>

        {/* Sample Translation Review - For Requesters */}
        {userRole === 'requester' && userSamples.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-medium mb-4">Sample Translation Reviews</h2>
            <div className="bg-white rounded-lg border p-6 shadow-sm">
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2">Review Sample Translations</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Review and approve sample translations submitted by translators for this book.
                </p>
              </div>
              
              <div className="space-y-4">
                {userSamples.map((sample, index) => (
                  <div key={sample.id || index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-medium text-gray-900">
                          Sample Translation by {sample.translator_username || 'Unknown'}
                        </h4>
                        <p className="text-sm text-gray-600">
                          Page {sample.page_number || sample.page?.page_number || sample.page} • 
                          Submitted {new Date(sample.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className={`px-2 py-1 rounded text-xs font-medium ${
                        sample.status === 'approved' ? 'bg-green-100 text-green-800' :
                        sample.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {sample.status}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-1">Original Text</h5>
                        <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded max-h-32 overflow-y-auto">
                          {sample.original_text}
                        </div>
                      </div>
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-1">Translation</h5>
                        <div className="text-sm text-gray-600 bg-blue-50 p-2 rounded max-h-32 overflow-y-auto">
                          {sample.translated_text}
                        </div>
                      </div>
                    </div>
                    
                    {sample.status === 'submitted' && (
                      <div className="flex space-x-2">
                        <button
                          onClick={async () => {
                            try {
                              await reviewSample(sample.id, 'approved');
                              alert('Sample translation approved!');
                              await loadUserSamples();
                            } catch (e: any) {
                              console.error('Approval error:', e);
                              setError(e.message || 'Failed to approve sample');
                            }
                          }}
                          className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition"
                        >
                          ✓ Approve
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              await reviewSample(sample.id, 'rejected');
                              alert('Sample translation rejected.');
                              await loadUserSamples();
                            } catch (e: any) {
                              console.error('Rejection error:', e);
                              setError(e.message || 'Failed to reject sample');
                            }
                          }}
                          className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition"
                        >
                          ✗ Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Sample Translation Submission - Independent View */}
        {userRole === 'translator' && (
          <section className="mb-8">
            <h2 className="text-xl font-medium mb-4">Sample Translation Submission</h2>
            <div className="bg-white rounded-lg border p-6 shadow-sm">
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2">Submit Sample Translation</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Submit a sample translation for any page of this book to showcase your skills. 
                  This is independent of any translation requests or applications.
                </p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Sample Page for Translation
                  </label>
                  <select
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={selectedSamplePage || ''}
                    onChange={(e) => setSelectedSamplePage(e.target.value ? parseInt(e.target.value) : null)}
                  >
                    <option value="">Select a sample page...</option>
                    {samplePages.map((page) => {
                      const hasSubmitted = hasUserSubmittedSampleForPage(page.page_number);
                      return (
                        <option 
                          key={page.id} 
                          value={page.page_number}
                          disabled={hasSubmitted}
                        >
                          Page {page.page_number} - {page.content?.slice(0, 50)}... {hasSubmitted ? '(Already submitted)' : ''}
                        </option>
                      );
                    })}
                  </select>
                  {samplePages.length === 0 && (
                    <p className="text-sm text-gray-500 mt-1">
                      No sample pages available for this book.
                    </p>
                  )}
                  
                  {userSamples.length > 0 && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-md">
                      <div className="text-sm font-medium text-blue-800 mb-2">Your Submitted Samples:</div>
                      <div className="space-y-1">
                        {userSamples.map((sample, index) => (
                          <div key={index} className="text-xs text-blue-700">
                            Page {sample.page_number || sample.page?.page_number || sample.page} - {sample.translated_text?.slice(0, 30) || sample.text?.slice(0, 30)}...
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Translation
                  </label>
                  <textarea
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm h-32"
                    placeholder="Enter your translation here..."
                    value={sampleTranslation}
                    onChange={(e) => setSampleTranslation(e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Translation Notes (Optional)
                  </label>
                  <textarea
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm h-20"
                    placeholder="Add any notes about your translation approach, challenges, or techniques used..."
                    value={sampleNotes}
                    onChange={(e) => setSampleNotes(e.target.value)}
                  />
                </div>
                
                <div className="flex justify-end">
                  <button 
                    onClick={handleSampleTranslationSubmission}
                    disabled={!selectedSamplePage || !sampleTranslation.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition font-medium disabled:bg-gray-400"
                  >
                    Submit Sample Translation
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Translation Requests & Applications - Comprehensive View */}
        {(userRole === 'requester' || userRole === 'translator') && (
          <section>
            <h2 className="text-xl font-medium mb-4">
              {userRole === 'requester' ? 'My Translation Requests & Applications' : 'Translation Requests & My Applications'}
            </h2>
            {requests.length > 0 ? requests.map((request) => (
              <div key={request.id} className="bg-white rounded-lg border p-6 mb-6 shadow-sm">
                {/* Request Header */}
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Request #{request.id}</h3>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    request.status === 'active' ? 'bg-green-100 text-green-800' :
                    request.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {request.status}
                  </span>
                </div>
                
                {/* Comprehensive Request Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="font-medium text-gray-700">Budget:</span>
                      <span className="ml-2 text-lg font-semibold text-green-600">${request.budget}</span>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium text-gray-700">Deadline:</span>
                      <span className="ml-2">{new Date(request.deadline).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="font-medium text-gray-700">Requester:</span>
                      <span className="ml-2">{request.requester_username || 'Unknown'}</span>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium text-gray-700">Created:</span>
                      <span className="ml-2">{new Date(request.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="font-medium text-gray-700">Language:</span>
                      <span className="ml-2">{book?.original_language} → {book?.target_language}</span>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium text-gray-700">Book:</span>
                      <span className="ml-2">{book?.title}</span>
                    </div>
                  </div>
                </div>
                
                {/* Applications Section */}
                {applications[request.id]?.length > 0 ? (
                  <div className="space-y-4">
                    <div className="text-sm text-gray-600 mb-3">
                      {userRole === 'requester' 
                        ? `${applications[request.id].length} application${applications[request.id].length !== 1 ? 's' : ''} received`
                        : 'Your application for this request'
                      }
                    </div>
                    {applications[request.id].map((app) => (
                      <div key={app.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                        {/* Application Header */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-blue-600 font-semibold text-sm">
                                {userRole === 'requester' ? 'T' : 'A'}
                              </span>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {userRole === 'requester' 
                                  ? (app.translator_username || app.translator?.username || 'Unknown Translator')
                                  : `Application #${app.id}`
                                }
                              </div>
                              <div className="text-xs text-gray-500">
                                Applied on {new Date(app.created_at).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            app.status === 'accepted' ? 'bg-green-100 text-green-800' :
                            app.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            app.status === 'applied' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {app.status?.toUpperCase() || 'APPLIED'}
                          </span>
                        </div>
                        
                        {/* Application Details */}
                        <div className="space-y-3">
                          {app.motivation && (
                            <div className="bg-blue-50 p-3 rounded-lg">
                              <div className="text-xs font-medium text-blue-800 mb-1">Motivation:</div>
                              <div className="text-sm text-blue-900">{app.motivation}</div>
                            </div>
                          )}
                          
                          {app.assigned_pages && app.assigned_pages.length > 0 && (
                            <div className="flex items-center space-x-2 text-sm">
                              <span className="font-medium text-gray-700">Assigned Pages:</span>
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                                {app.assigned_pages.join(', ')}
                              </span>
                            </div>
                          )}
                          
                          {app.assigned_budget_cents > 0 && (
                            <div className="flex items-center space-x-2 text-sm">
                              <span className="font-medium text-gray-700">Assigned Budget:</span>
                              <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold">
                                ${(app.assigned_budget_cents / 100).toFixed(2)}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        {/* Application Actions */}
                        <div className="mt-4 pt-3 border-t border-gray-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              {app.status === 'applied' && userRole === 'requester' && (
                                <button 
                                  onClick={() => handleAcceptApplication(app)} 
                                  className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition font-medium"
                                >
                                  ✓ Accept Application
                                </button>
                              )}
                              {app.status === 'applied' && userRole === 'translator' && (
                                <div className="flex items-center space-x-2 text-yellow-700">
                                  <span className="text-lg">⏳</span>
                                  <span className="text-sm font-medium">Under Review</span>
                                </div>
                              )}
                              {app.status === 'accepted' && (
                                <div className="flex items-center space-x-2 text-green-700">
                                  <span className="text-lg">✓</span>
                                  <span className="text-sm font-medium">Application Accepted</span>
                                </div>
                              )}
                              {app.status === 'rejected' && (
                                <div className="flex items-center space-x-2 text-red-700">
                                  <span className="text-lg">✗</span>
                                  <span className="text-sm font-medium">Application Rejected</span>
                                </div>
                              )}
                            </div>
                            
                            {/* Start Translation Button - Only show if contract is signed by both parties */}
                            {app.status === 'accepted' && userRole === 'translator' && (() => {
                              // Check if there's a signed contract for this application
                              const relatedContract = translatorContracts.find(contract => 
                                contract.application_id === app.id || 
                                contract.application === app.id ||
                                String(contract.application_id) === String(app.id) ||
                                String(contract.application) === String(app.id)
                              );
                              
                              console.log('Checking start translation button for app:', app.id);
                              console.log('Related contract:', relatedContract);
                              console.log('Contract status:', relatedContract?.status);
                              console.log('Translator translations:', translatorTranslations);
                              
                              if (relatedContract && relatedContract.status === 'signed') {
                                // Find translation for this specific application/contract
                                const relatedTranslation = translatorTranslations.find(translation => 
                                  translation.request === app.request_id ||
                                  translation.book === id ||
                                  (translation.request && translation.request.book === id)
                                );
                                
                                console.log('Related translation:', relatedTranslation);
                                
                                if (relatedTranslation) {
                                  return (
                                    <Link 
                                      href={`/translations/work/${relatedTranslation.id}`}
                                      className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition font-medium"
                                    >
                                      🚀 Start Translation Work
                                    </Link>
                                  );
                                } else {
                                  return (
                                    <div className="text-sm text-gray-500">
                                      ⏳ Translation assignment is being created...
                                    </div>
                                  );
                                }
                              }
                              return null;
                            })()}
                          </div>
                          
                          {/* Contract Creation Form for Requesters */}
                          {app.status === 'accepted' && userRole === 'requester' && (() => {
                            // Check if contract already exists for this application
                            const existingContract = requesterContracts.find(contract => 
                              contract.application_id === app.id || 
                              contract.application === app.id ||
                              String(contract.application_id) === String(app.id) ||
                              String(contract.application) === String(app.id)
                            );
                            
                            if (!existingContract) {
                              return (
                                <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                  <h4 className="font-medium text-sm mb-3 text-blue-800">📄 Create Contract</h4>
                                  <div className="space-y-3">
                                    <div>
                                      <label className="block text-xs font-medium text-blue-700 mb-1">
                                        Contract Amount (cents)
                                      </label>
                                      <input 
                                        className="w-full border border-blue-300 p-2 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                                        placeholder="Enter amount in cents (e.g., 5000 for $50.00)" 
                                        value={totalCents} 
                                        onChange={(e) => setTotalCents(e.target.value)}
                                        type="number"
                                        min="1"
                                      />
                                    </div>
                                    <button 
                                      onClick={() => createContractFlow(app.id)}
                                      className="w-full bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 transition font-medium disabled:bg-gray-400"
                                      disabled={!totalCents || Number(totalCents) <= 0}
                                    >
                                      📄 Create Contract
                                    </button>
                                  </div>
                                </div>
                              );
                            } else {
                              return (
                                <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                                  <div className="flex items-center space-x-2 mb-2">
                                    <span className="text-green-600">✓</span>
                                    <span className="font-medium text-sm text-green-800">Contract Created</span>
                                  </div>
                                  <div className="text-xs text-green-700 mb-3">
                                    Contract #{existingContract.id} - ${(existingContract.amount_cents / 100).toFixed(2)} - Status: {existingContract.status}
                                  </div>
                                  
                                  {/* Sign Contract Button for Requesters */}
                                  {!existingContract.requester_signed && (
                                    <button 
                                      onClick={async () => {
                                        try {
                                          await signContract(existingContract.id);
                                          alert('Contract signed successfully!');
                                          await loadRequesterContracts();
                                          await loadTranslatorContracts();
                                          await loadTranslatorTranslations();
                                        } catch (e: any) {
                                          console.error('Contract signing error:', e);
                                          setError(e.message || 'Failed to sign contract');
                                        }
                                      }}
                                      className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition font-medium"
                                    >
                                      ✍️ Sign Contract
                                    </button>
                                  )}
                                  
                                  {existingContract.requester_signed && !existingContract.translator_signed && (
                                    <div className="text-yellow-700 text-sm">
                                      ⏳ Waiting for translator to sign the contract.
                                    </div>
                                  )}
                                  
                                  {existingContract.status === 'signed' && (
                                    <div className="text-green-700 text-sm">
                                      ✓ Contract has been signed by both parties and is ready for work to begin.
                                    </div>
                                  )}
                                  
                                  {/* Milestones Section */}
                                  <div className="mt-4">
                                    <div className="flex items-center justify-between mb-2">
                                      <h4 className="text-sm font-medium text-gray-800">📋 Milestones</h4>
                                      {existingContract.status !== 'signed' && (
                                        <button
                                          onClick={() => openMilestoneModal(existingContract.id)}
                                          className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition"
                                        >
                                          + Add Milestone
                                        </button>
                                      )}
                                    </div>
                                    
                                    {milestones.filter(m => m.contract === existingContract.id).length > 0 ? (
                                      <div className="space-y-2">
                                        {milestones.filter(m => m.contract === existingContract.id).map((milestone, index) => (
                                          <div key={milestone.id || index} className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs">
                                            <div className="flex-1">
                                              <div className="font-medium text-gray-800">{milestone.title}</div>
                                              <div className="text-gray-600">${(milestone.amount_cents / 100).toFixed(2)}</div>
                                            </div>
                                            {existingContract.status !== 'signed' && (
                                              <div className="flex space-x-1">
                                                <button
                                                  onClick={() => openEditMilestoneModal(milestone)}
                                                  className="text-blue-600 hover:text-blue-800"
                                                >
                                                  ✏️
                                                </button>
                                                <button
                                                  onClick={() => handleDeleteMilestone(milestone.id)}
                                                  className="text-red-600 hover:text-red-800"
                                                >
                                                  🗑️
                                                </button>
                                              </div>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <div className="text-xs text-gray-500 italic">
                                        No milestones defined yet. Add milestones to break down the work and payments.
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            }
                          })()}
                          
                          {/* Contract Status for Translators */}
                          {app.status === 'accepted' && userRole === 'translator' && (() => {
                            const relatedContract = translatorContracts.find(contract => 
                              contract.application_id === app.id || 
                              contract.application === app.id ||
                              String(contract.application_id) === String(app.id) ||
                              String(contract.application) === String(app.id)
                            );
                            
                            if (relatedContract) {
                              return (
                                <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
                                  <div className="text-sm font-medium text-gray-800 mb-2">📄 Contract Status</div>
                                  <div className="space-y-1 text-xs">
                                    <div><span className="font-medium">Contract ID:</span> #{relatedContract.id}</div>
                                    <div><span className="font-medium">Amount:</span> ${(relatedContract.amount_cents / 100).toFixed(2)}</div>
                                    <div><span className="font-medium">Status:</span> 
                                      <span className={`ml-1 px-2 py-1 rounded text-xs ${
                                        relatedContract.status === 'signed' ? 'bg-green-100 text-green-800' :
                                        relatedContract.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-gray-100 text-gray-800'
                                      }`}>
                                        {relatedContract.status}
                                      </span>
                                    </div>
                                    {!relatedContract.translator_signed && (
                                      <div className="mt-3">
                                        <div className="text-yellow-700 text-xs mb-2">
                                          {!relatedContract.requester_signed 
                                            ? '⏳ Waiting for requester to sign the contract first.'
                                            : '⏳ Requester has signed. You can now sign the contract.'
                                          }
                                        </div>
                                        {relatedContract.requester_signed && (
                                          <button 
                                            onClick={async () => {
                                              try {
                                                await signContract(relatedContract.id);
                                                alert('Contract signed successfully!');
                                                await loadTranslatorContracts();
                                                await loadTranslatorTranslations();
                                              } catch (e: any) {
                                                console.error('Contract signing error:', e);
                                                setError(e.message || 'Failed to sign contract');
                                              }
                                            }}
                                            className="px-3 py-1 bg-yellow-600 text-white text-xs rounded hover:bg-yellow-700 transition font-medium"
                                          >
                                            ✍️ Sign Contract
                                          </button>
                                        )}
                                      </div>
                                    )}
                                    
                                    {relatedContract.translator_signed && !relatedContract.requester_signed && (
                                      <div className="text-yellow-700 text-xs mt-1">
                                        ⏳ Waiting for requester to sign the contract.
                                      </div>
                                    )}
                                    
                                    {relatedContract.status === 'signed' && (
                                      <div className="text-green-700 text-xs mt-1">
                                        ✓ Contract has been signed by both parties and is ready for work to begin.
                                      </div>
                                    )}
                                    
                                    {/* Milestones Section for Translators */}
                                    <div className="mt-3">
                                      <h4 className="text-xs font-medium text-gray-800 mb-2">📋 Work Milestones</h4>
                                      
                                      {milestones.filter(m => m.contract === relatedContract.id).length > 0 ? (
                                        <div className="space-y-1">
                                          {milestones.filter(m => m.contract === relatedContract.id).map((milestone, index) => (
                                            <div key={milestone.id || index} className="p-2 bg-blue-50 rounded text-xs">
                                              <div className="font-medium text-blue-800">{milestone.title}</div>
                                              <div className="text-blue-600">Payment: ${(milestone.amount_cents / 100).toFixed(2)}</div>
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <div className="text-xs text-gray-500 italic">
                                          No milestones defined yet. The requester will add milestones before you sign.
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          })()}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 p-4 bg-gray-50 rounded-lg">
                    {userRole === 'requester' 
                      ? 'No applications received yet' 
                      : 'You haven\'t applied to this request yet. To apply to translation requests, visit the Translation Requests page.'
                    }
                  </div>
                )}
              </div>
            )) : (
              <div className="text-center py-8 text-gray-500">
                <p>No translation requests found for this book.</p>
                <p className="text-sm mt-2">Create a translation request to start receiving applications.</p>
              </div>
            )}
          </section>
        )}
      </div>
      
      {/* Assignment Modal */}
      {showAcceptModal && selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Accept Application</h3>
            
            <div className="mb-4">
              <div className="text-sm text-gray-600 mb-2">
                <strong>Translator:</strong> {selectedApplication.translator_username || selectedApplication.translator?.username || 'Unknown'}
              </div>
              {selectedApplication.motivation && (
                <div className="text-sm text-gray-600 mb-2">
                  <strong>Motivation:</strong> {selectedApplication.motivation}
                </div>
              )}
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select Pages to Assign
                </label>
                <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-md p-3">
                  <div className="grid grid-cols-3 gap-2">
                    {pages.map((page) => (
                      <label key={page.id} className="flex items-center space-x-2 text-sm">
                        <input
                          type="checkbox"
                          checked={assignedPages.includes(page.page_number)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setAssignedPages([...assignedPages, page.page_number]);
                            } else {
                              setAssignedPages(assignedPages.filter(p => p !== page.page_number));
                            }
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-gray-700">Page {page.page_number}</span>
                      </label>
                    ))}
                  </div>
                </div>
                {assignedPages.length > 0 && (
                  <div className="mt-2 text-sm text-blue-600">
                    Selected: {assignedPages.sort((a, b) => a - b).join(', ')}
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Budget (USD)
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  placeholder="e.g., 50.00"
                  value={assignedBudget}
                  onChange={(e) => setAssignedBudget(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowAcceptModal(false);
                  setSelectedApplication(null);
                  setAssignedPages([]);
                  setAssignedBudget('');
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmAcceptApplication}
                disabled={assignedPages.length === 0 || !assignedBudget}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition disabled:bg-gray-400"
              >
                Accept Application
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Milestone Modal */}
      {showMilestoneModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">
              {editingMilestone ? 'Edit Milestone' : 'Add New Milestone'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Milestone Title
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Complete Chapter 1 Translation"
                  value={milestoneTitle}
                  onChange={(e) => setMilestoneTitle(e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                  value={milestoneAmount}
                  onChange={(e) => setMilestoneAmount(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowMilestoneModal(false);
                  setEditingMilestone(null);
                  setCurrentContractId(null);
                  setMilestoneTitle('');
                  setMilestoneAmount('');
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (editingMilestone) {
                    handleUpdateMilestone(editingMilestone.id);
                  } else {
                    if (currentContractId) {
                      handleCreateMilestone(currentContractId);
                    } else {
                      alert('No contract selected for milestone creation.');
                    }
                  }
                }}
                disabled={!milestoneTitle.trim() || !milestoneAmount.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:bg-gray-400"
              >
                {editingMilestone ? 'Update Milestone' : 'Create Milestone'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}




