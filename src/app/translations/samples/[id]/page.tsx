'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getSampleTranslation } from '@/lib/api';

export default function SampleDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [sample, setSample] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access');
      const role = localStorage.getItem('role');
      
      if (!token) {
        router.push('/login');
        return;
      }
      
      // Only allow requesters and readers to access this page
      if (role !== 'requester' && role !== 'reader') {
        router.push('/dashboard');
        return;
      }
    }

    if (params.id) {
      loadSample();
    }
  }, [params.id, router]);

  async function loadSample() {
    try {
      setLoading(true);
      const data = await getSampleTranslation(params.id as string);
      setSample(data);
    } catch (e: any) {
      setError(e.message || 'Failed to load sample translation');
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <main className="p-6">Loading...</main>;
  if (error) return <main className="p-6 text-red-600">{error}</main>;
  if (!sample) return <main className="p-6">Sample not found</main>;

  return (
    <main className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={() => router.back()}
          className="px-4 py-2 text-gray-600 hover:text-gray-800 transition"
        >
          ← Back
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Sample Translation</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Book Information */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Book Information</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-600">Book Title</label>
                <div className="text-lg font-medium text-gray-900">{sample.book_title}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Language Pair</label>
                <div className="text-gray-900">{sample.language_pair}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Page Number</label>
                <div className="text-gray-900">Page {sample.page_number}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Translator</label>
                <div className="text-gray-900">{sample.translator_username}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Status</label>
                <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                  sample.status === 'approved' ? 'bg-green-100 text-green-800' :
                  sample.status === 'rejected' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {sample.status?.charAt(0).toUpperCase() + sample.status?.slice(1)}
                </div>
              </div>
            </div>
          </div>

          {/* Translation Content */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Translation Content</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Original Text</label>
                <div className="bg-gray-50 p-4 rounded-lg text-gray-900 whitespace-pre-wrap">
                  {sample.original_text}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Translated Text</label>
                <div className="bg-blue-50 p-4 rounded-lg text-gray-900 whitespace-pre-wrap">
                  {sample.translated_text}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons for Requesters */}
        {localStorage.getItem('role') === 'requester' && sample.status === 'submitted' && (
          <div className="mt-6 pt-6 border-t">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Review Sample Translation</h3>
            <div className="flex gap-3">
              <button 
                onClick={() => handleReview('approved')}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                ✓ Approve Sample
              </button>
              <button 
                onClick={() => handleReview('rejected')}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                ✗ Reject Sample
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );

  async function handleReview(status: 'approved' | 'rejected') {
    try {
      // Import the reviewSample function
      const { reviewSample } = await import('@/lib/api');
      await reviewSample(sample.id, status);
      
      // Reload the sample to show updated status
      await loadSample();
    } catch (e: any) {
      setError(e.message || 'Failed to review sample');
    }
  }
}
