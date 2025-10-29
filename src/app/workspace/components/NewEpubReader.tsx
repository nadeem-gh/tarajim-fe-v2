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
  sentence_hash?: string;
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
  const [showTranslationPanel, setShowTranslationPanel] = useState(true);
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
        // Clear translation text but keep panel visible
        setTranslationText('');
        // Keep selectedText and showTranslationPanel as they are
      },
    }
  );

  // Enhanced sentence extraction function
  const extractSentences = (text: string): string[] => {
    if (!text || text.trim().length === 0) return [];

    // Clean the text
    const cleanText = text.trim().replace(/\s+/g, ' ');
    
    // If the text is short and doesn't contain sentence endings, treat it as a single sentence
    if (cleanText.length < 100 && !/[.!?]/.test(cleanText)) {
      return [cleanText];
    }
    
    // Split by sentence boundaries (., !, ?, ;) but be careful with abbreviations
    const sentences: string[] = [];
    
    // First, try to split by sentence endings
    const sentenceEndings = /[.!?]+/g;
    const parts = cleanText.split(sentenceEndings);
    const endings = cleanText.match(sentenceEndings) || [];
    
    for (let i = 0; i < parts.length; i++) {
      let sentence = parts[i].trim();
      if (sentence.length === 0) continue;
      
      // Add the punctuation back if it exists
      if (endings[i]) {
        sentence += endings[i];
      }
      
      // Only include sentences that are substantial (more than 3 characters)
      if (sentence.length > 3) {
        sentences.push(sentence);
      }
    }
    
    // If no sentences found with punctuation, try to split by line breaks or create single sentence
    if (sentences.length === 0) {
      // Try splitting by line breaks
      const lines = cleanText.split(/\n+/).filter(line => line.trim().length > 3);
      if (lines.length > 0) {
        sentences.push(...lines);
      } else {
        // If still no good splits, use the whole text as one sentence
        sentences.push(cleanText);
      }
    }
    
    return sentences;
  };

  // Handle text selection using rendition events (simplified approach)
  const handleTextSelection = async (event?: Event, doc?: Document) => {
    console.log('🔍 Text selection triggered via rendition event', event?.type);
    
    // Use the document from the rendition event if available, otherwise fallback
    const targetDoc = doc || document;
    const selection = targetDoc.getSelection();
    
    console.log('📝 Selection object:', selection);
    console.log('📝 Selection string:', selection?.toString());
    console.log('📝 Selection is collapsed:', selection?.isCollapsed);
    
    if (!selection || selection.isCollapsed || !selection.toString().trim()) {
      console.log('❌ No text selected or empty selection');
      return;
    }
    
    const selectedText = selection.toString().trim();
    console.log('📄 Selected text:', selectedText);
    
    // First, try to extract sentences from just the selected text
    let sentences = extractSentences(selectedText);
    console.log('📝 Sentences from selected text:', sentences);
    
    let bestSentence = selectedText;
    
    // If we found sentences in the selected text, use the first one
    if (sentences.length > 0) {
      bestSentence = sentences[0];
      console.log('🎯 Using first sentence from selection:', bestSentence);
    } else {
      // If no sentences found in selection, get paragraph context and try again
      let paragraphText = selectedText;
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const paragraph = range.commonAncestorContainer.parentElement;
        paragraphText = paragraph?.textContent || selectedText;
      }
      
      console.log('📖 Paragraph context:', paragraphText);
      
      // Extract sentences from the paragraph context
      sentences = extractSentences(paragraphText);
      console.log('📝 Extracted sentences from paragraph:', sentences);
      
      if (sentences.length === 0) {
        console.log('❌ No valid sentences found');
        return;
      }
      
      // Find the sentence that contains the selected text or is closest to it
      // First, try to find a sentence that contains the selected text
      for (const sentence of sentences) {
        if (sentence.includes(selectedText)) {
          bestSentence = sentence;
          console.log('🎯 Found sentence containing selection:', bestSentence);
          break;
        }
      }
      
      // If no exact match, find the sentence that overlaps most with the selection
      if (bestSentence === selectedText) {
        let maxOverlap = 0;
        for (const sentence of sentences) {
          const overlap = calculateTextOverlap(selectedText, sentence);
          if (overlap > maxOverlap) {
            maxOverlap = overlap;
            bestSentence = sentence;
          }
        }
        console.log('🎯 Found best matching sentence by overlap:', bestSentence);
      }
    }
    
    setSelectedText(bestSentence);
    setShowTranslationPanel(true);
    console.log('🎯 Translation panel should be shown with sentence:', bestSentence);
  };

  // Calculate text overlap between two strings
  const calculateTextOverlap = (text1: string, text2: string): number => {
    const words1 = text1.toLowerCase().split(/\s+/);
    const words2 = text2.toLowerCase().split(/\s+/);
    
    let overlap = 0;
    for (const word of words1) {
      if (words2.includes(word)) {
        overlap++;
      }
    }
    
    return overlap / Math.max(words1.length, words2.length);
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

  // Check if Urdu language is supported
  const checkUrduSupport = () => {
    if ('speechSynthesis' in window) {
      const voices = speechSynthesis.getVoices();
      const urduVoices = voices.filter(voice => 
        voice.lang.startsWith('ur') || 
        voice.lang.includes('Urdu') ||
        voice.name.includes('Urdu')
      );
      console.log('🎤 Available voices:', voices.map(v => `${v.name} (${v.lang})`));
      console.log('🎤 Urdu voices found:', urduVoices.length);
      return urduVoices.length > 0;
    }
    return false;
  };

  // Handle speech-to-text
  const handleSpeechToText = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition not supported in this browser');
      return;
    }

    // Check Urdu support
    const urduSupported = checkUrduSupport();
    console.log('🎤 Urdu language support:', urduSupported);

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    // Store recognition instance globally for stopping
    (window as any).speechRecognitionInstance = recognition;
    
    recognition.continuous = true; // Keep recording until manually stopped
    recognition.interimResults = true; // Show interim results while speaking
    recognition.lang = 'ur-PK'; // Urdu (Pakistan)
    
    // Add fallback languages if Urdu is not supported
    recognition.alternatives = ['ur', 'hi-IN', 'en-US']; // Urdu, Hindi, English fallbacks

    setIsRecording(true);
    
    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';
      
      // Process all results
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }
      
      // Update translation text with accumulated results
      if (finalTranscript) {
        // Add final transcript to existing text
        setTranslationText(prev => prev + finalTranscript);
        console.log('🎤 STT Final (Urdu):', finalTranscript);
      }
      
      if (interimTranscript) {
        // Show interim results (this will be replaced by final results)
        console.log('🎤 STT Interim (Urdu):', interimTranscript);
      }
      
      // Don't stop recording automatically - only update text
    };

    recognition.onerror = (event: any) => {
      console.error('🎤 STT Error:', event.error);
      
      // Only stop recording for certain errors
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
      setIsRecording(false);
        alert('Microphone access denied. Please allow microphone access and try again.');
      } else if (event.error === 'language-not-supported' && recognition.lang !== 'en-US') {
        console.log('🔄 Trying fallback language: en-US');
        recognition.lang = 'en-US';
        recognition.start();
      }
      // For other errors (like 'no-speech'), keep recording
    };

    recognition.onend = () => {
      // Only restart if we're still supposed to be recording
      if (isRecording && (window as any).speechRecognitionInstance === recognition) {
        console.log('🎤 STT ended unexpectedly, restarting...');
        recognition.start();
      } else {
        console.log('🎤 STT stopped manually or instance changed');
        (window as any).speechRecognitionInstance = null;
      }
    };

    recognition.start();
  };

  // Handle stopping speech-to-text
  const handleStopRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      // Stop any active recognition
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        // Force stop by calling abort() if available
        if ((window as any).speechRecognitionInstance) {
          (window as any).speechRecognitionInstance.abort();
          (window as any).speechRecognitionInstance = null;
        }
      }
    }
  };

  // Compute sentence hash (same as backend)
  const computeSentenceHash = async (text: string): Promise<string> => {
    if (!text) return '';
    // Normalize: lowercase, strip whitespace
    const normalized = text.toLowerCase().trim();
    
    try {
      // Use Web Crypto API for SHA256
      const encoder = new TextEncoder();
      const data = encoder.encode(normalized);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      return hashHex;
    } catch (error) {
      console.warn('⚠️ Error computing SHA256 hash, falling back to simple hash:', error);
      // Fallback to simple hash
      return btoa(normalized);
    }
  };

  // Hash-based highlighting method that works better with EPUB content
  const highlightTranslatedTextSimple = async (doc: Document) => {
    if (!translations.length) return;

    console.log('🎨 Hash-based highlight process with', translations.length, 'translations');

    // Clear previous highlights
    const existingHighlights = doc.querySelectorAll('.translated-highlight');
    existingHighlights.forEach((el: Element) => {
      const element = el as HTMLElement;
      element.classList.remove('translated-highlight');
      element.style.backgroundColor = '';
      element.style.border = '';
      element.style.borderRadius = '';
      element.style.padding = '';
      element.title = '';
    });

    // Create a map of sentence hashes to translations for quick lookup
    const translationMap = new Map<string, EpubTranslation>();
    translations.forEach((translation: EpubTranslation) => {
      if (translation.sentence_hash) {
        translationMap.set(translation.sentence_hash, translation);
      }
    });

    console.log('🗂️ Created translation map with', translationMap.size, 'hashed translations');

    // Find all elements that might contain text
    const elements = doc.querySelectorAll('p, div, span, h1, h2, h3, h4, h5, h6, li, td, th');
    
    // Process elements asynchronously
    const elementPromises = Array.from(elements).map(async (element: Element) => {
      const htmlElement = element as HTMLElement;
      const text = htmlElement.textContent || '';
      
      if (!text.trim()) return;

      // Split text into sentences and check each one
      const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
      let hasHighlightedContent = false;
      let highlightedHTML = text;

      for (const sentence of sentences) {
        const trimmedSentence = sentence.trim();
        if (!trimmedSentence) continue;

        // Compute hash for this sentence
        const sentenceHash = await computeSentenceHash(trimmedSentence);
        
        // Check if this sentence hash exists in our translations
        const translation = translationMap.get(sentenceHash);
        if (translation) {
          console.log('✅ Found hash match for sentence:', trimmedSentence.substring(0, 50) + '...');
          
          // Replace the sentence with highlighted version
          const highlightedSentence = `<span class="translated-highlight" style="background-color: #dcfce7; border: 2px solid #16a34a; border-radius: 4px; padding: 2px 4px; display: inline-block; cursor: pointer;" title="Translated: ${translation.translated_text}" data-translation-id="${translation.id}">${trimmedSentence}</span>`;
          
          highlightedHTML = highlightedHTML.replace(
            new RegExp(trimmedSentence.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
            highlightedSentence
          );
          hasHighlightedContent = true;
        }
      }

      // Only update innerHTML if we found matches
      if (hasHighlightedContent) {
        htmlElement.innerHTML = highlightedHTML;
      }
    });

    // Wait for all elements to be processed
    await Promise.all(elementPromises);

    // Add hover functionality to highlighted elements
    const highlightedElements = doc.querySelectorAll('.translated-highlight');
    highlightedElements.forEach((element: Element) => {
      const span = element as HTMLElement;
      
      span.addEventListener('mouseenter', () => {
        // Create tooltip
        const tooltip = doc.createElement('div');
        tooltip.id = 'translation-tooltip';
        tooltip.style.position = 'absolute';
        tooltip.style.backgroundColor = '#1f2937';
        tooltip.style.color = 'white';
        tooltip.style.padding = '8px 12px';
        tooltip.style.borderRadius = '6px';
        tooltip.style.fontSize = '14px';
        tooltip.style.maxWidth = '300px';
        tooltip.style.zIndex = '1000';
        tooltip.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
        tooltip.innerHTML = `
          <div style="font-weight: bold; margin-bottom: 4px;">Translation:</div>
          <div>${span.title.replace('Translated: ', '')}</div>
        `;
        
        // Position tooltip
        const rect = span.getBoundingClientRect();
        tooltip.style.left = `${rect.left}px`;
        tooltip.style.top = `${rect.bottom + 5}px`;
        
        doc.body.appendChild(tooltip);
      });
      
      span.addEventListener('mouseleave', () => {
        const tooltip = doc.getElementById('translation-tooltip');
        if (tooltip) {
          tooltip.remove();
        }
      });
    });

    console.log('✅ Hash-based highlighted translated text in green');
  };

  // Highlight translated text in green
  const highlightTranslatedText = () => {
    if (!renditionRef.current || !translations.length) return;

    try {
      // Get the current rendition's document
      const rendition = renditionRef.current;
      if (!rendition || !rendition.manager || !rendition.manager.current) return;

      const contents = rendition.manager.current;
      const doc = contents.document;
      
      if (!doc) return;

      console.log('🎨 Starting highlight process with', translations.length, 'translations');

      // Clear previous highlights
      const existingHighlights = doc.querySelectorAll('.translated-highlight');
      existingHighlights.forEach((el: Element) => {
        const element = el as HTMLElement;
        element.classList.remove('translated-highlight');
        element.style.backgroundColor = '';
        element.style.border = '';
        element.style.borderRadius = '';
        element.style.padding = '';
        element.title = '';
      });

      // Highlight translated text
      translations.forEach((translation: EpubTranslation) => {
        const originalText = translation.original_text.trim();
        if (!originalText) return;

        console.log('🔍 Looking for text:', originalText);

        // Find all text nodes in the document
        const walker = doc.createTreeWalker(
          doc.body,
          NodeFilter.SHOW_TEXT,
          null,
          false
        );

        const textNodes: Text[] = [];
        let node;
        while (node = walker.nextNode()) {
          textNodes.push(node as Text);
        }

        console.log('📝 Found', textNodes.length, 'text nodes');

        // Search for translated text in text nodes
        textNodes.forEach(textNode => {
          const text = textNode.textContent || '';
          const index = text.toLowerCase().indexOf(originalText.toLowerCase());
          
          if (index !== -1) {
            console.log('✅ Found match in text:', text.substring(0, 50) + '...');
            
            // Create a wrapper span for the translated text
            const span = doc.createElement('span');
            span.className = 'translated-highlight';
            span.style.backgroundColor = '#dcfce7'; // Light green background
            span.style.border = '2px solid #16a34a'; // Green border
            span.style.borderRadius = '4px';
            span.style.padding = '2px 4px';
            span.style.display = 'inline-block';
            span.title = `Translated: ${translation.translated_text}`;
            
            // Add hover functionality
            span.addEventListener('mouseenter', () => {
              // Create tooltip
              const tooltip = doc.createElement('div');
              tooltip.id = 'translation-tooltip';
              tooltip.style.position = 'absolute';
              tooltip.style.backgroundColor = '#1f2937';
              tooltip.style.color = 'white';
              tooltip.style.padding = '8px 12px';
              tooltip.style.borderRadius = '6px';
              tooltip.style.fontSize = '14px';
              tooltip.style.maxWidth = '300px';
              tooltip.style.zIndex = '1000';
              tooltip.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
              tooltip.innerHTML = `
                <div style="font-weight: bold; margin-bottom: 4px;">Translation:</div>
                <div>${translation.translated_text}</div>
              `;
              
              // Position tooltip
              const rect = span.getBoundingClientRect();
              tooltip.style.left = `${rect.left}px`;
              tooltip.style.top = `${rect.bottom + 5}px`;
              
              doc.body.appendChild(tooltip);
            });
            
            span.addEventListener('mouseleave', () => {
              const tooltip = doc.getElementById('translation-tooltip');
              if (tooltip) {
                tooltip.remove();
              }
            });
            
            // Split the text and wrap the matching part
            const beforeText = text.substring(0, index);
            const matchText = text.substring(index, index + originalText.length);
            const afterText = text.substring(index + originalText.length);
            
            // Create text nodes
            const beforeNode = doc.createTextNode(beforeText);
            const afterNode = doc.createTextNode(afterText);
            
            // Set the matched text as the span content
            span.textContent = matchText;
            
            // Replace the original text node with the new structure
            const parent = textNode.parentNode;
            if (parent) {
              parent.insertBefore(beforeNode, textNode);
              parent.insertBefore(span, textNode);
              parent.insertBefore(afterNode, textNode);
              parent.removeChild(textNode);
            }
          }
        });
      });

      console.log('✅ Highlighted translated text in green');
    } catch (error) {
      console.warn('⚠️ Error highlighting translated text:', error);
    }
  };

  // Handle EPUB location change
  const handleLocationChange = (epubcifi: string) => {
    setLocation(epubcifi);
    // Extract chapter number from CFI (simplified)
    const chapterMatch = epubcifi.match(/chapter(\d+)/i);
    if (chapterMatch) {
      setCurrentChapter(parseInt(chapterMatch[1]));
    }
    
    // Highlight translated text when page changes
    setTimeout(async () => {
      if (renditionRef.current && renditionRef.current.manager && renditionRef.current.manager.current) {
        const doc = renditionRef.current.manager.current.document;
        if (doc) {
          await highlightTranslatedTextSimple(doc);
        }
      }
    }, 500); // Small delay to ensure content is rendered
  };

  // Debug logging
  useEffect(() => {
    console.log('NewEpubReader - Book data:', book);
    console.log('NewEpubReader - EPUB blob URL:', epubBlobUrl);
  }, [book, epubBlobUrl]);

  // Highlight translated text when translations change
  useEffect(() => {
    if (translations.length > 0) {
      setTimeout(async () => {
        if (renditionRef.current && renditionRef.current.manager && renditionRef.current.manager.current) {
          const doc = renditionRef.current.manager.current.document;
          if (doc) {
            await highlightTranslatedTextSimple(doc);
          }
        }
      }, 1000); // Delay to ensure content is rendered
    }
  }, [translations]);

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
            onClick={() => {
              setShowTranslations(!showTranslations);
              if (showTranslations) {
                // Clear highlights when hiding
                setTimeout(() => {
                  if (renditionRef.current) {
                    const rendition = renditionRef.current;
                    if (rendition.manager && rendition.manager.current) {
                      const doc = rendition.manager.current.document;
                      if (doc) {
                        const existingHighlights = doc.querySelectorAll('.translated-highlight');
                        existingHighlights.forEach((el: Element) => {
                          const element = el as HTMLElement;
                          element.classList.remove('translated-highlight');
                          element.style.backgroundColor = '';
                          element.style.border = '';
                          element.style.borderRadius = '';
                          element.style.padding = '';
                          element.title = '';
                        });
                      }
                    }
                  }
                }, 100);
              } else {
                // Show highlights when showing
                setTimeout(async () => {
                  if (renditionRef.current && renditionRef.current.manager && renditionRef.current.manager.current) {
                    const doc = renditionRef.current.manager.current.document;
                    if (doc) {
                      await highlightTranslatedTextSimple(doc);
                    }
                  }
                }, 100);
              }
            }}
            className="flex items-center space-x-1 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md"
          >
            {showTranslations ? (
              <EyeSlashIcon className="h-4 w-4" />
            ) : (
              <EyeIcon className="h-4 w-4" />
            )}
            <span>{showTranslations ? 'Hide' : 'Show'} Highlights</span>
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
        {/* EPUB Reader - 70% width */}
        <div className="w-[70%] relative">
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
                  
                  // Add CSS for better readability
                  rendition.themes.default({
                    'body': {
                      'font-size': '18px !important',
                      'line-height': '1.6 !important',
                      'max-width': '100% !important',
                      'margin': '0 auto !important',
                      'padding': '20px !important',
                    },
                    'p': {
                      'font-size': '18px !important',
                      'line-height': '1.6 !important',
                      'margin-bottom': '16px !important',
                    },
                    'h1, h2, h3, h4, h5, h6': {
                      'font-size': '24px !important',
                      'line-height': '1.4 !important',
                      'margin-bottom': '20px !important',
                    }
                  });
                  
                  rendition.hooks.content.register((contents: any) => {
                    const doc = contents.document;
                    
                    // Add event handlers for text selection using rendition events
                    doc.addEventListener('mouseup', (event: Event) => {
                      // Add a small delay to ensure selection is complete
                      setTimeout(() => handleTextSelection(event, doc), 100);
                    });
                    doc.addEventListener('dblclick', (event: Event) => {
                      // Double click for word selection
                      setTimeout(() => handleTextSelection(event, doc), 100);
                    });
                    
                    // Add click handler for text elements
                    doc.addEventListener('click', (event: Event) => {
                      const target = event.target as HTMLElement;
                      if (target && (target.tagName === 'P' || target.tagName === 'SPAN' || target.tagName === 'DIV')) {
                        console.log('🖱️ Clicked on text element:', target.textContent);
                        // Try to get selection after click
                        setTimeout(() => {
                          const selection = doc.getSelection();
                          if (selection && !selection.isCollapsed && selection.toString().trim()) {
                            handleTextSelection(event, doc);
                          } else {
                            // If no selection, try to select the clicked element's text
                            const range = doc.createRange();
                            range.selectNodeContents(target);
                            const newSelection = doc.getSelection();
                            if (newSelection) {
                              newSelection.removeAllRanges();
                              newSelection.addRange(range);
                              setTimeout(() => handleTextSelection(event, doc), 50);
                            }
                          }
                        }, 50);
                      }
                    });
                    doc.addEventListener('selectionchange', (event: Event) => {
                      // Only handle selection change if there's actually a selection
                      const selection = doc.getSelection();
                      if (selection && !selection.isCollapsed && selection.toString().trim()) {
                        setTimeout(() => handleTextSelection(event, doc), 50);
                      }
                    });
                    
                    // Highlight existing translations
                    if (showTranslations) {
                      setTimeout(async () => {
                        await highlightTranslatedTextSimple(doc);
                      }, 500);
                    }
                  });
                }}
                epubOptions={{
                  allowScriptedContent: true,
                  allowPopups: false,
                  spread: 'none', // Single page view instead of spread
                  manager: 'default', // Use default manager for better single page support
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

        {/* Translation Panel - 30% width */}
        <div className="w-[30%] bg-white border-l border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Translate Text</h3>
                <button
                  onClick={() => setShowTranslationPanel(!showTranslationPanel)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  {showTranslationPanel ? <XMarkIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {showTranslationPanel && (
              <div className="flex-1 p-4 space-y-4">
                {/* Original Text */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Original Text
                  </label>
                  <div className="p-3 bg-gray-50 rounded-md text-sm text-gray-700">
                    {selectedText || 'Select text from the book to translate'}
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
                    rows={18}
                  />
                </div>

              {/* Action Buttons */}
              <div className="flex space-x-2">
                <button
                  onClick={isRecording ? handleStopRecording : handleSpeechToText}
                  className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-md ${
                    isRecording 
                      ? 'bg-red-600 text-white hover:bg-red-700' 
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  <MicrophoneIcon className={`h-4 w-4 ${isRecording ? 'animate-pulse' : ''}`} />
                  <span>{isRecording ? 'Stop Recording' : 'Start Speech-to-Text'}</span>
                </button>
                <button
                  onClick={() => setTranslationText('')}
                  className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                  title="Clear translation text"
                >
                  <XMarkIcon className="h-4 w-4" />
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
            )}
          </div>
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
