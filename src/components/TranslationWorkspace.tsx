import React, { useState, useCallback } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import TranslationPanel from '@/app/workspace/components/TranslationPanel';
import TranslationSuggestions from '@/components/TranslationSuggestions';
import { SentenceSegment, Suggestion } from '@/types/translation';

interface TranslationWorkspaceProps {
  currentSentence: any;
  translationText: string;
  onTranslationUpdate: (text: string) => void;
  onSave: () => void;
  isSaving: boolean;
  suggestions: Suggestion[];
  showSuggestions: boolean;
  onAcceptSuggestion: (suggestion: Suggestion) => void;
  onImproveSuggestion: (suggestion: Suggestion) => void;
  onDismissSuggestions: () => void;
  onTestHighlighting: () => void;
  onClose: () => void;
}

export const TranslationWorkspace: React.FC<TranslationWorkspaceProps> = ({
  currentSentence,
  translationText,
  onTranslationUpdate,
  onSave,
  isSaving,
  suggestions,
  showSuggestions,
  onAcceptSuggestion,
  onImproveSuggestion,
  onDismissSuggestions,
  onTestHighlighting,
  onClose
}) => {
  return (
    <div className="w-80 lg:w-96 bg-white border-l border-gray-200 flex flex-col flex-shrink-0 overflow-hidden sticky top-0 h-screen">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Translate Text</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        {/* Debug button for testing highlighting */}
        <button
          onClick={onTestHighlighting}
          className="mt-2 px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
        >
          Test Highlighting
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {currentSentence ? (
          <div className="p-4">
            {/* Translation Suggestions */}
            {showSuggestions && (
              <TranslationSuggestions
                suggestions={suggestions}
                onAccept={onAcceptSuggestion}
                onImprove={onImproveSuggestion}
                onDismiss={onDismissSuggestions}
              />
            )}
            
            <TranslationPanel
              sentence={currentSentence}
              onTranslationUpdate={onTranslationUpdate}
              onSave={onSave}
              isSaving={isSaving}
            />
          </div>
        ) : (
          <div className="p-4 text-center text-gray-500">
            <p>No sentence selected</p>
            <p className="text-sm">Click on text to select a sentence for translation</p>
          </div>
        )}
      </div>
    </div>
  );
};

