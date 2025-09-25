'use client';
import { useEffect, useState } from 'react';
import { getReaderTranslations } from '@/lib/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ReaderPage() {
  const [translations, setTranslations] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentText, setCurrentText] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access');
      const role = localStorage.getItem('role');
      
      if (!token) {
        router.push('/login');
        return;
      }
      
      if (role !== 'reader') {
        router.push('/dashboard');
        return;
      }
    }
    
    (async () => {
      try {
        setLoading(true);
        const data = await getReaderTranslations();
        setTranslations(data);
      } catch (e: any) {
        console.error('Failed to load translations:', e);
        setError(e.message || 'Failed to load available translations');
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  async function handleTextToSpeech(text: string) {
    if (!('speechSynthesis' in window)) {
      setError('Text-to-speech not supported in this browser');
      return;
    }
    
    setIsPlaying(true);
    setCurrentText(text);
    setError(null);
    
    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => {
        setError('Text-to-speech error');
        setIsPlaying(false);
      };
      
      speechSynthesis.speak(utterance);
    } catch (e: any) {
      setError('Failed to start text-to-speech');
      setIsPlaying(false);
    }
  }

  function stopSpeech() {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
      setIsPlaying(false);
    }
  }

  if (loading) {
    return (
      <main className="max-w-6xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading available translations...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-6xl mx-auto p-6 bg-gradient-to-br from-indigo-400/10 to-purple-400/10 min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-500 mb-2">
          Reader Dashboard
        </h1>
        <p className="text-gray-600">Listen to approved translations and completed works</p>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <span className="text-red-600 mr-2">⚠️</span>
            <p className="text-red-800 font-medium">{error}</p>
          </div>
        </div>
      )}
      
      {translations && (
        <div className="space-y-8">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{translations.stats.total_approved_samples}</div>
              <div className="text-sm text-gray-600">Approved Samples</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{translations.stats.total_completed_translations}</div>
              <div className="text-sm text-gray-600">Completed Translations</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{translations.stats.total_available}</div>
              <div className="text-sm text-gray-600">Total Available</div>
            </div>
          </div>

          {/* Approved Samples */}
          {translations.approved_samples.length > 0 && (
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Approved Sample Translations</h2>
              <div className="grid gap-4">
                {translations.approved_samples.map((sample: any) => (
                  <div key={sample.id} className="border rounded-lg p-4 hover:shadow-md transition">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-lg">{sample.book_title}</h3>
                        <p className="text-sm text-gray-600">Page {sample.page_number} • {sample.language_pair}</p>
                        <p className="text-sm text-gray-500">by {sample.translator_username}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleTextToSpeech(sample.text_preview)}
                          disabled={isPlaying && currentText === sample.text_preview}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400"
                        >
                          {isPlaying && currentText === sample.text_preview ? '🔊 Playing...' : '🔊 Listen'}
                        </button>
                        {isPlaying && currentText === sample.text_preview && (
                          <button
                            onClick={stopSpeech}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                          >
                            ⏹️ Stop
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="text-gray-700 bg-gray-50 p-3 rounded">
                      {sample.text_preview}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Completed Translations */}
          {translations.completed_translations.length > 0 && (
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Completed Translations</h2>
              <div className="grid gap-4">
                {translations.completed_translations.map((translation: any) => (
                  <div key={translation.id} className="border rounded-lg p-4 hover:shadow-md transition">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-lg">{translation.book_title}</h3>
                        <p className="text-sm text-gray-600">{translation.language_pair}</p>
                        <p className="text-sm text-gray-500">by {translation.translator_username}</p>
                      </div>
                      <div className="flex gap-2">
                        <Link
                          href={`/books/${translation.book_id}`}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                        >
                          📖 Read Full Book
                        </Link>
                      </div>
                    </div>
                    <div className="text-sm text-green-600 font-medium">
                      ✓ Completed Translation
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {translations.stats.total_available === 0 && (
            <div className="text-center py-16">
              <div className="text-8xl mb-6">📚</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">No Translations Available Yet</h2>
              <p className="text-lg text-gray-600 mb-6">
                There are no approved translations or completed works available at the moment.
              </p>
              <Link
                href="/books"
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all duration-200 font-medium"
              >
                Browse Books
              </Link>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
