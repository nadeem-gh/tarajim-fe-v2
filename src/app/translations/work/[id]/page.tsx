'use client';
import { useEffect, useState } from 'react';
import { apiFetch, submitSentence, getTranslation, getMe, whisperSTT } from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';

export default function TranslationWorkPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const translationId = params?.id as string;
  
  const [translation, setTranslation] = useState<any | null>(null);
  const [sentences, setSentences] = useState<any[]>([]);
  const [currentSentence, setCurrentSentence] = useState<any | null>(null);
  const [translatedText, setTranslatedText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    // Check authentication and role
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access');
      const role = localStorage.getItem('role');
      
      if (!token) {
        router.push('/login');
        return;
      }
      
      if (role !== 'translator') {
        router.push('/dashboard');
        return;
      }
      
      setUserRole(role);
    }
    
    if (!translationId) return;
    
    (async () => {
      try {
        const [t, me] = await Promise.all([
          getTranslation(translationId),
          getMe()
        ]);
        
        setTranslation(t);
        setSentences(t.sentences || []);
        
        // Find the first untranslated sentence
        const untranslated = t.sentences?.find((s: any) => !s.translated_text);
        setCurrentSentence(untranslated);
        
        if (untranslated) {
          setTranslatedText(untranslated.translated_text || '');
        }
      } catch (e: any) {
        setError(e.message || 'Failed to load translation');
      }
    })();
  }, [translationId, router]);

  async function handleSubmit() {
    if (!currentSentence || !translatedText.trim()) return;
    
    setError(null);
    try {
      await submitSentence({
        translation: translationId,
        sentence: currentSentence.id,
        translated_text: translatedText
      });
      
      // Move to next untranslated sentence
      const remaining = sentences.filter(s => s.id !== currentSentence.id);
      const next = remaining.find(s => !s.translated_text);
      
      if (next) {
        setCurrentSentence(next);
        setTranslatedText(next.translated_text || '');
      } else {
        setCurrentSentence(null);
        setTranslatedText('');
      }
      
      // Refresh sentences
      const updated = await getTranslation(translationId);
      setSentences(updated.sentences || []);
      
    } catch (e: any) {
      setError(e.message || 'Failed to submit translation');
    }
  }

  async function handleSpeechToText() {
    setIsRecording(true);
    setError(null);
    
    try {
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Audio recording not supported in this browser');
      }
      
      // Get user media for audio recording
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const audioChunks: BlobPart[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };
      
      mediaRecorder.onstop = async () => {
        try {
          // Create audio blob
          const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
          
          // Convert to File object
          const audioFile = new File([audioBlob], 'recording.wav', { type: 'audio/wav' });
          
          // Get target language for Whisper
          const targetLanguage = translation.request?.book_target_language || 'en';
          
          // Call Whisper STT API
          const result = await whisperSTT(audioFile, targetLanguage);
          
          if (result.success) {
            setTranslatedText(result.transcript);
          } else {
            setError('Transcription failed: ' + (result.error || 'Unknown error'));
          }
        } catch (e: any) {
          setError('Failed to process audio: ' + e.message);
        } finally {
          setIsRecording(false);
          // Stop all tracks to release microphone
          stream.getTracks().forEach(track => track.stop());
        }
      };
      
      // Start recording
      mediaRecorder.start();
      
      // Stop recording after 10 seconds or when user clicks stop
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
        }
      }, 10000);
      
    } catch (e: any) {
      setError('Failed to start audio recording: ' + e.message);
      setIsRecording(false);
    }
  }


  function handleNext() {
    const remaining = sentences.filter(s => s.id !== currentSentence?.id);
    const next = remaining.find(s => !s.translated_text);
    
    if (next) {
      setCurrentSentence(next);
      setTranslatedText(next.translated_text || '');
    }
  }

  function handlePrevious() {
    const currentIndex = sentences.findIndex(s => s.id === currentSentence?.id);
    if (currentIndex > 0) {
      const prev = sentences[currentIndex - 1];
      setCurrentSentence(prev);
      setTranslatedText(prev.translated_text || '');
    }
  }

  if (!translation) return <main className="p-6">Loading...</main>;

  const progress = sentences.filter(s => s.translated_text).length;
  const total = sentences.length;
  const progressPercent = total > 0 ? (progress / total) * 100 : 0;

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-semibold">Translation Work</h1>
          <div className="text-sm text-gray-600">
            {translation.request?.book_title} - {translation.request?.book_original_language} → {translation.request?.book_target_language}
          </div>
        </div>
        <div className="text-sm text-gray-600">
          Progress: {progress}/{total} ({Math.round(progressPercent)}%)
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        ></div>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      {currentSentence ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Original Text */}
          <div className="space-y-4">
            <h2 className="text-xl font-medium">Original Text</h2>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600 mb-2">Sentence {sentences.findIndex(s => s.id === currentSentence.id) + 1}</div>
              <div className="whitespace-pre-wrap">{currentSentence.original_text}</div>
            </div>
          </div>

          {/* Translation Input */}
          <div className="space-y-4">
            <h2 className="text-xl font-medium">Your Translation</h2>
            <div className="space-y-3">
              <textarea
                className="w-full border p-3 rounded-lg h-32 resize-none"
                placeholder="Enter your translation here..."
                value={translatedText}
                onChange={(e) => setTranslatedText(e.target.value)}
              />
              
              {/* Speech Controls */}
              <div className="space-y-3">
                <div className="flex gap-2">
                  <button
                    onClick={handleSpeechToText}
                    disabled={isRecording}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:bg-gray-400 hover:bg-blue-700 transition"
                  >
                    {isRecording ? '🎤 Recording...' : '🎤 Record Audio'}
                  </button>
                  
                  <div className="text-sm text-gray-600 flex items-center">
                    <span className="mr-2">💡</span>
                    Record audio in {translation.request?.book_target_language || 'target language'}
                  </div>
                </div>
                
                {/* Audio to Text Confirmation */}
                {translatedText && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="text-sm font-medium text-green-800 mb-2">
                      🎯 Audio converted to text:
                    </div>
                    <div className="text-sm text-green-700 bg-white p-2 rounded border">
                      "{translatedText}"
                    </div>
                    <div className="text-xs text-green-600 mt-2">
                      Review the text above and edit if needed, then submit your translation.
                    </div>
                  </div>
                )}
              </div>
              
              {/* Navigation */}
              <div className="flex gap-2">
                <button
                  onClick={handlePrevious}
                  disabled={sentences.findIndex(s => s.id === currentSentence.id) === 0}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg disabled:bg-gray-400 hover:bg-gray-700 transition"
                >
                  ← Previous
                </button>
                
                <button
                  onClick={handleNext}
                  disabled={sentences.findIndex(s => s.id === currentSentence.id) === sentences.length - 1}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg disabled:bg-gray-400 hover:bg-gray-700 transition"
                >
                  Next →
                </button>
              </div>
              
              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                disabled={!translatedText.trim()}
                className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg disabled:bg-gray-400 hover:shadow-lg transition"
              >
                Submit Translation
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-semibold mb-2">Translation Complete!</h2>
          <p className="text-gray-600">You have successfully translated all sentences.</p>
        </div>
      )}

      {/* Sentences Overview */}
      <div className="mt-8">
        <h3 className="text-lg font-medium mb-4">All Sentences</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {sentences.map((sentence, index) => (
            <div
              key={sentence.id}
              className={`p-3 rounded-lg border cursor-pointer transition ${
                sentence.id === currentSentence?.id
                  ? 'border-blue-500 bg-blue-50'
                  : sentence.translated_text
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-300 bg-gray-50'
              }`}
              onClick={() => {
                setCurrentSentence(sentence);
                setTranslatedText(sentence.translated_text || '');
              }}
            >
              <div className="text-sm font-medium">Sentence {index + 1}</div>
              <div className="text-xs text-gray-600 mt-1">
                {sentence.translated_text ? '✅ Translated' : '⏳ Pending'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
