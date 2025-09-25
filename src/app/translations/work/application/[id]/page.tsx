'use client';
import { useEffect, useState } from 'react';
import { apiFetch, updateSentence, getApplicationTranslations, getMe, whisperSTT } from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';

export default function ApplicationTranslationWorkPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const applicationId = params.id;

  const [applicationData, setApplicationData] = useState<any>(null);
  const [sentences, setSentences] = useState<any[]>([]);
  const [currentSentence, setCurrentSentence] = useState<any>(null);
  const [translatedText, setTranslatedText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    if (!applicationId) return;
    
    (async () => {
      try {
        const [appData, me] = await Promise.all([
          getApplicationTranslations(applicationId),
          getMe()
        ]);
        
        setApplicationData(appData);
        setSentences(appData.sentences || []);
        
        // Find the first untranslated sentence
        const untranslated = appData.sentences?.find((s: any) => !s.translated_text);
        setCurrentSentence(untranslated);
        
        if (untranslated) {
          setTranslatedText(untranslated.translated_text || '');
        }
        
        setUser(me);
      } catch (e: any) {
        setError(e.message || 'Failed to load translation data');
      }
    })();
  }, [applicationId, router]);

  // Cleanup effect to release microphone when component unmounts
  useEffect(() => {
    return () => {
      if (audioStream) {
        audioStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [audioStream]);

  async function handleSubmit() {
    if (!currentSentence || !translatedText.trim()) return;
    
    setError(null);
    try {
      await updateSentence(currentSentence.id, {
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
      
      // Refresh application data
      const updated = await getApplicationTranslations(applicationId);
      setApplicationData(updated);
      setSentences(updated.sentences || []);
    } catch (e: any) {
      setError(e.message || 'Failed to submit translation');
    }
  }

  async function handleSpeechToText() {
    setIsRecording(true);
    setError(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Audio recording not supported in this browser');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setAudioStream(stream);

      const recorder = new MediaRecorder(stream);
      setMediaRecorder(recorder);
      const audioChunks: BlobPart[] = [];

      recorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      recorder.onstop = async () => {
        try {
          const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
          const audioFile = new File([audioBlob], 'recording.wav', { type: 'audio/wav' });
          const targetLanguage = 'ur'; // Force Urdu language

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
          setMediaRecorder(null);
          stream.getTracks().forEach(track => track.stop());
          setAudioStream(null);
        }
      };
      recorder.start();
    } catch (e: any) {
      setError('Failed to start audio recording: ' + e.message);
      setIsRecording(false);
    }
  }

  function handleStopRecording() {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
    }
  }

  if (!applicationData) {
    return <main className="p-6">Loading...</main>;
  }

  if (error) {
    return (
      <main className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      </main>
    );
  }

  const progressPercentage = applicationData.progress_percentage || 0;
  const completedSentences = applicationData.completed_sentences || 0;
  const totalSentences = applicationData.total_sentences || 0;

  return (
    <main className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Translation Work</h1>
        <button 
          onClick={() => router.back()}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
        >
          ← Back
        </button>
      </div>

      {/* Progress Section */}
      <div className="bg-white border rounded-lg p-6 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium">Translation Progress</h2>
          <span className="text-sm text-gray-600">
            {completedSentences} / {totalSentences} sentences completed
          </span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
          <div 
            className="bg-blue-600 h-3 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
        
        <div className="text-center">
          <span className="text-2xl font-bold text-blue-600">
            {progressPercentage.toFixed(1)}%
          </span>
          <p className="text-sm text-gray-600 mt-1">
            {applicationData.status === 'completed' ? 'Translation Complete!' : 'Keep going!'}
          </p>
        </div>
      </div>

      {/* Translation Work Section */}
      {currentSentence ? (
        <div className="bg-white border rounded-lg p-6 shadow-sm">
          <div className="mb-4">
            <h3 className="text-lg font-medium mb-2">Current Sentence</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-800">{currentSentence.original_text}</p>
              <p className="text-sm text-gray-500 mt-2">
                Page {currentSentence.page_number}
              </p>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Translation (اردو):
            </label>
            <textarea
              value={translatedText}
              onChange={(e) => setTranslatedText(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={4}
              placeholder="Enter your translation here..."
            />
          </div>

          {/* Audio Recording Section */}
          <div className="mb-4 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-3">Audio Recording</h4>
            
            <div className="flex gap-2">
              {!isRecording ? (
                <button
                  onClick={handleSpeechToText}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  🎤 Start Recording
                </button>
              ) : (
                <button
                  onClick={handleStopRecording}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                >
                  ⏹️ Stop Recording
                </button>
              )}

              <div className="text-sm text-gray-600 flex items-center">
                <span className="mr-2">💡</span>
                {isRecording ? (
                  <span className="text-red-600 font-medium">Recording in progress... Click Stop when done</span>
                ) : (
                  <span>Record audio in Urdu (اردو)</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSubmit}
              disabled={!translatedText.trim()}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Submit Translation
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white border rounded-lg p-6 shadow-sm text-center">
          <div className="text-4xl mb-4">🎉</div>
          <h3 className="text-xl font-medium text-green-600 mb-2">Translation Complete!</h3>
          <p className="text-gray-600">
            All sentences have been translated. Great work!
          </p>
        </div>
      )}

      {/* Sentences List */}
      <div className="bg-white border rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-medium mb-4">All Sentences</h3>
        <div className="space-y-2">
          {sentences.map((sentence, index) => (
            <div 
              key={sentence.id} 
              className={`p-3 rounded-lg border ${
                sentence.translated_text 
                  ? 'bg-green-50 border-green-200' 
                  : sentence.id === currentSentence?.id 
                    ? 'bg-blue-50 border-blue-200' 
                    : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-1">
                    Sentence {index + 1} • Page {sentence.page_number}
                  </p>
                  <p className="text-gray-800 mb-2">{sentence.original_text}</p>
                  {sentence.translated_text && (
                    <p className="text-green-700 font-medium">{sentence.translated_text}</p>
                  )}
                </div>
                <div className="ml-4">
                  {sentence.translated_text ? (
                    <span className="text-green-600 text-sm">✓ Completed</span>
                  ) : sentence.id === currentSentence?.id ? (
                    <span className="text-blue-600 text-sm">🔄 Current</span>
                  ) : (
                    <span className="text-gray-500 text-sm">⏳ Pending</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
