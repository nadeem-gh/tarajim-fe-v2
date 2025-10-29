import React from 'react';

interface SentenceNavigationProps {
  currentIndex: number;
  totalSentences: number;
  onPrevious: () => void;
  onNext: () => void;
  disabled?: boolean;
}

export const SentenceNavigation: React.FC<SentenceNavigationProps> = ({
  currentIndex,
  totalSentences,
  onPrevious,
  onNext,
  disabled = false
}) => {
  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={onPrevious}
        disabled={disabled || currentIndex <= 0}
        className="px-3 py-1 text-sm bg-green-100 hover:bg-green-200 disabled:bg-gray-100 disabled:text-gray-400 rounded-md whitespace-nowrap"
      >
        ← Prev Sentence
      </button>
      <button
        onClick={onNext}
        disabled={disabled || currentIndex >= totalSentences - 1}
        className="px-3 py-1 text-sm bg-green-100 hover:bg-green-200 disabled:bg-gray-100 disabled:text-gray-400 rounded-md whitespace-nowrap"
      >
        Next Sentence →
      </button>
      <span className="text-sm text-gray-500">
        {currentIndex + 1}/{totalSentences}
      </span>
    </div>
  );
};

