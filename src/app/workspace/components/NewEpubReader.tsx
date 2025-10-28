'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ReactReader, ReactReaderStyle } from 'react-reader';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { 
  BookOpenIcon, 
  PencilIcon, 
  MicrophoneIcon,
  CheckIcon,
  XMarkIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';

interface Book {
  id: number;
  title: string;
  epub_file: string;
}

interface EpubTranslation {
  id: number;
  original_text: string;
  translated_text: string;
  chapter_number: number;
  chapter_title: string;
  position_in_chapter: number;
  cfi_range: string;
  word_count: number;
  translation_method: 'typing' | 'speech';
  created_at: string;
  updated_at: string;
}

interface NewEpubReaderProps {
  book: Book;
  onClose: () => void;
}

export default function NewEpubReader({ book, onClose }: NewEpubReaderProps) {
  const [location, setLocation] = useState<string | number>(0);
  const [selectedText, setSelectedText] = useState<string>('');
  const [showTranslationPanel, setShowTranslationPanel] = useState(false);
  const [translationText, setTranslationText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showTranslations, setShowTranslations] = useState(true);
  const [currentChapter, setCurrentChapter] = useState<number>(1);
  const [epubError, setEpubError] = useState<string | null>(null);
  const [epubBlobUrl, setEpubBlobUrl] = useState<string | null>(null);
  
  const renditionRef = useRef<any>(null);
  const queryClient = useQueryClient();

  // Use environment variable for API URL (public endpoint, no authentication needed)
  const epubUrl = `${process.env.NEXT_PUBLIC_API_URL}/workspace/books/${book.id}/epub-file/`;
  
  useEffect(() => {
    if (book.id) {
      setEpubBlobUrl(epubUrl);
    }
  }, [book.id, epubUrl]);

  // Fetch existing translations for this book
  const { data: translations = [], isLoading: translationsLoading } = useQuery(
    ['epub-translations', book.id],
    async () => {
      const response = await fetch(`/api/workspace/epub-translations/list/?book_id=${book.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch translations');
      return response.json();
    },
    {
      enabled: !!book.id,
    }
  );

  // Save translation mutation
  const saveTranslationMutation = useMutation(
    async (translationData: {
      book_id: number;
      original_text: string;
      translated_text: string;
      chapter_number: number;
      chapter_title: string;
      position_in_chapter: number;
      cfi_range: string;
      translation_method: 'typing' | 'speech';
    }) => {
      const response = await fetch('/api/workspace/epub-translations/', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify(translationData),
      });
      if (!response.ok) throw new Error('Failed to save translation');
      return response.json();
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['epub-translations', book.id]);
        setShowTranslationPanel(false);
        setSelectedText('');
        setTranslationText('');
      },
    }
  );

  // Handle text selection
  const handleTextSelection = () => {
    if (renditionRef.current) {
      const selection = renditionRef.current.getSelection();
      if (selection && selection.toString().trim()) {
        setSelectedText(selection.toString().trim());
        setShowTranslationPanel(true);
      }
    }
  };

  // Handle translation save
  const handleSaveTranslation = () => {
    if (!selectedText || !translationText.trim()) return;

    const translationData = {
      book_id: book.id,
      original_text: selectedText,
      translated_text: translationText.trim(),
      chapter_number: currentChapter,
      chapter_title: `Chapter ${currentChapter}`,
      position_in_chapter: 0, // This would need to be calculated from CFI
      cfi_range: location.toString(),
      translation_method: 'typing' as const,
    };

    saveTranslationMutation.mutate(translationData);
  };

  // Handle speech-to-text
  const handleSpeechToText = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition not supported in this browser');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    setIsRecording(true);
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setTranslationText(transcript);
      setIsRecording(false);
    };

    recognition.onerror = () => {
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.start();
  };

  // Handle EPUB location change
  const handleLocationChange = (epubcifi: string) => {
    setLocation(epubcifi);
    // Extract chapter number from CFI (simplified)
    const chapterMatch = epubcifi.match(/chapter(\d+)/i);
    if (chapterMatch) {
      setCurrentChapter(parseInt(chapterMatch[1]));
    }
  };

  // Debug logging
  useEffect(() => {
    console.log('NewEpubReader - Book data:', book);
    console.log('NewEpubReader - EPUB blob URL:', epubBlobUrl);
  }, [book, epubBlobUrl]);

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      if (epubBlobUrl) {
        URL.revokeObjectURL(epubBlobUrl);
      }
    };
  }, [epubBlobUrl]);

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <BookOpenIcon className="h-6 w-6 text-blue-600" />
          <div>
            <h1 className="text-lg font-semibold text-gray-900">{book.title}</h1>
            <p className="text-sm text-gray-500">EPUB Reader Mode</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowTranslations(!showTranslations)}
            className="flex items-center space-x-1 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md"
          >
            {showTranslations ? (
              <EyeSlashIcon className="h-4 w-4" />
            ) : (
              <EyeIcon className="h-4 w-4" />
            )}
            <span>{showTranslations ? 'Hide' : 'Show'} Translations</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md"
          >
            Close Reader
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* EPUB Reader */}
        <div className="flex-1 relative">
          <div className="h-full">
            {epubError ? (
              <div className="flex items-center justify-center h-full bg-gray-50">
                <div className="text-center">
                  <div className="text-red-600 text-lg font-medium mb-2">Error loading book</div>
                  <div className="text-gray-600 text-sm mb-4">{epubError}</div>
                  <button
                    onClick={() => {
                      setEpubError(null);
                      setLocation(0);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Retry
                  </button>
                </div>
              </div>
            ) : epubBlobUrl ? (
              <ReactReader
                url={epubBlobUrl}
                location={location}
                locationChanged={handleLocationChange}
                getRendition={(rendition) => {
                  renditionRef.current = rendition;
                  
                  rendition.hooks.content.register((contents: any) => {
                    const doc = contents.document;
                    
                    // Add click handler for text selection
                    doc.addEventListener('mouseup', handleTextSelection);
                    
                    // Highlight existing translations
                    if (showTranslations) {
                      translations.forEach((translation: EpubTranslation) => {
                        const elements = doc.querySelectorAll('*');
                        elements.forEach((element: any) => {
                          if (element.textContent?.includes(translation.original_text)) {
                            element.style.backgroundColor = '#fef3c7';
                            element.style.border = '1px solid #f59e0b';
                            element.title = `Translated: ${translation.translated_text}`;
                          }
                        });
                      });
                    }
                  });
                }}
                epubOptions={{
                  allowScriptedContent: true,
                  allowPopups: false,
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-full bg-gray-50">
                <div className="text-center">
                  <div className="text-gray-600">No EPUB file available</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Translation Panel */}
        {showTranslationPanel && (
          <div className="w-96 bg-white border-l border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Translate Text</h3>
                <button
                  onClick={() => setShowTranslationPanel(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 p-4 space-y-4">
              {/* Original Text */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Original Text
                </label>
                <div className="p-3 bg-gray-50 rounded-md text-sm text-gray-700">
                  {selectedText}
                </div>
              </div>

              {/* Translation Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Translation
                </label>
                <textarea
                  value={translationText}
                  onChange={(e) => setTranslationText(e.target.value)}
                  placeholder="Enter your translation..."
                  className="w-full p-3 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={4}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2">
                <button
                  onClick={handleSpeechToText}
                  disabled={isRecording}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  <MicrophoneIcon className={`h-4 w-4 ${isRecording ? 'animate-pulse' : ''}`} />
                  <span>{isRecording ? 'Recording...' : 'Speech-to-Text'}</span>
                </button>
              </div>

              {/* Save Button */}
              <button
                onClick={handleSaveTranslation}
                disabled={!translationText.trim() || saveTranslationMutation.isLoading}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                <CheckIcon className="h-4 w-4" />
                <span>
                  {saveTranslationMutation.isLoading ? 'Saving...' : 'Save Translation'}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Translation Stats */}
      <div className="bg-white border-t border-gray-200 px-4 py-2">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Chapter {currentChapter}</span>
          <span>{translations.length} translations saved</span>
          <span>Location: {location}</span>
        </div>
      </div>
    </div>
  );
}
