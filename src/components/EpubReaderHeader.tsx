import React from 'react';
import { 
  BookOpenIcon, 
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';
import { SentenceNavigation } from './SentenceNavigation';
import { Book } from '@/types/translation';

interface EpubReaderHeaderProps {
  book: Book;
  currentSentenceIndex: number;
  totalSentences: number;
  showTranslations: boolean;
  onToggleTranslations: () => void;
  onPreviousSentence: () => void;
  onNextSentence: () => void;
  onTestTranslation: () => void;
  onClose: () => void;
}

export const EpubReaderHeader: React.FC<EpubReaderHeaderProps> = ({
  book,
  currentSentenceIndex,
  totalSentences,
  showTranslations,
  onToggleTranslations,
  onPreviousSentence,
  onNextSentence,
  onTestTranslation,
  onClose
}) => {
  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between flex-shrink-0">
      <div className="flex items-center space-x-3 min-w-0 flex-1">
        <BookOpenIcon className="h-6 w-6 text-blue-600 flex-shrink-0" />
        <div className="min-w-0 flex-1">
          <h1 className="text-lg font-semibold text-gray-900 truncate">{book.title}</h1>
          <p className="text-sm text-gray-500">EPUB Reader Mode</p>
        </div>
      </div>
      <div className="flex items-center space-x-2 flex-shrink-0">
        <button
          onClick={() => {
            // Navigation will be handled by EpubViewer
            const iframe = document.querySelector('#epub-viewer iframe') as HTMLIFrameElement;
            if (iframe && iframe.contentDocument) {
              // Trigger navigation through EpubViewer
              const event = new CustomEvent('epub-navigate', { detail: { direction: 'prev' } });
              window.dispatchEvent(event);
            }
          }}
          className="px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 rounded-md whitespace-nowrap"
        >
          ← Previous
        </button>
        <button
          onClick={() => {
            // Navigation will be handled by EpubViewer
            const iframe = document.querySelector('#epub-viewer iframe') as HTMLIFrameElement;
            if (iframe && iframe.contentDocument) {
              // Trigger navigation through EpubViewer
              const event = new CustomEvent('epub-navigate', { detail: { direction: 'next' } });
              window.dispatchEvent(event);
            }
          }}
          className="px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 rounded-md whitespace-nowrap"
        >
          Next →
        </button>
        <div className="h-6 w-px bg-gray-300"></div>
        
        <SentenceNavigation
          currentIndex={currentSentenceIndex}
          totalSentences={totalSentences}
          onPrevious={onPreviousSentence}
          onNext={onNextSentence}
        />
        
        <button
          onClick={onToggleTranslations}
          className="flex items-center space-x-1 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md whitespace-nowrap"
        >
          {showTranslations ? (
            <EyeSlashIcon className="h-4 w-4" />
          ) : (
            <EyeIcon className="h-4 w-4" />
          )}
          <span className="hidden sm:inline">{showTranslations ? 'Hide' : 'Show'} Translations</span>
        </button>
        <button
          onClick={onTestTranslation}
          className="px-3 py-1 text-sm bg-yellow-100 hover:bg-yellow-200 rounded-md whitespace-nowrap"
        >
          Test Translation
        </button>
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md whitespace-nowrap"
        >
          Close Reader
        </button>
      </div>
    </div>
  );
};

