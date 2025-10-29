import React from 'react';

interface EpubReaderFooterProps {
  currentChapter: number;
  translationsCount: number;
  currentSentenceIndex: number;
  totalSentences: number;
  currentLocation: string;
}

export const EpubReaderFooter: React.FC<EpubReaderFooterProps> = ({
  currentChapter,
  translationsCount,
  currentSentenceIndex,
  totalSentences,
  currentLocation
}) => {
  return (
    <div className="bg-white border-t border-gray-200 px-4 py-2">
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>Chapter {currentChapter}</span>
        <span>{translationsCount} translations saved</span>
        <span>Sentences: {currentSentenceIndex + 1}/{totalSentences}</span>
        <span>Location: {currentLocation || 'Loading...'}</span>
      </div>
    </div>
  );
};

