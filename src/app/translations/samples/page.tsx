'use client';
import { useEffect, useState } from 'react';
import { listSamples, reviewSample } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function SamplesReviewPage() {
  const [items, setItems] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access');
      const role = localStorage.getItem('role');
      
      if (!token) {
        router.push('/login');
        return;
      }
      
      // Only allow requesters to access this page
      if (role !== 'requester') {
        router.push('/dashboard');
        return;
      }
    }
    (async () => {
      try {
        const data = await listSamples();
        setItems(data as any[]);
      } catch (e: any) {
        setError(e.message || 'Failed to load');
      }
    })();
  }, [router]);

  async function act(id: string, status: 'approved' | 'rejected') {
    try {
      await reviewSample(id, status);
      const data = await listSamples();
      setItems(data as any[]);
    } catch (e: any) {
      setError(e.message || 'Failed to update');
    }
  }

  return (
    <main className="max-w-6xl mx-auto p-6 bg-gradient-to-br from-indigo-400/10 to-purple-400/10">
      <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-500 mb-6">Sample Translations Review</h1>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <div className="grid gap-6">
        {items.map((s) => (
          <div key={s.id} className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="text-sm text-gray-600 mb-4">Book: {s.book} • Page: {s.page} • By: {s.translator}</div>
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <pre className="whitespace-pre-wrap text-sm">{s.text}</pre>
            </div>
            <div className="flex gap-3 items-center">
              <button onClick={() => act(s.id, 'approved')} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm">Approve</button>
              <button onClick={() => act(s.id, 'rejected')} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm">Reject</button>
              <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">{s.status}</span>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}


