import { useState, useCallback } from 'react';
import { EpubTranslation } from '@/types/translation';

interface UseHighlightingProps {
  translations: EpubTranslation[];
}

interface UseHighlightingReturn {
  highlightTranslations: (doc: Document) => Promise<void>;
  clearHighlights: (doc: Document) => void;
  highlightSelectedText: (text: string) => void;
  debouncedHighlight: (doc: Document) => void;
}

export const useHighlighting = ({ translations }: UseHighlightingProps): UseHighlightingReturn => {
  const [highlightTimeout, setHighlightTimeout] = useState<NodeJS.Timeout | null>(null);

  // Clear existing highlights
  const clearHighlights = useCallback((doc: Document) => {
    const existingHighlights = doc.querySelectorAll('.translation-translated');
    console.log('🧹 Clearing', existingHighlights.length, 'existing highlights');
    existingHighlights.forEach(el => {
      const htmlEl = el as HTMLElement;
      htmlEl.classList.remove('translation-translated');
      htmlEl.style.backgroundColor = '';
      htmlEl.style.border = '';
      htmlEl.style.borderRadius = '';
      htmlEl.style.padding = '';
      htmlEl.title = '';
    });
  }, []);

  // Highlight existing translations
  const highlightTranslations = useCallback(async (doc: Document) => {
    console.log('🎯 highlightTranslations called with', translations.length, 'translations');
    
    // Only proceed if we have translations
    if (translations.length === 0) {
      console.log('❌ No translations to highlight');
      return;
    }
    
    // Clear existing highlights first
    clearHighlights(doc);
    
    // Wait a bit before applying new highlights to prevent conflicts
    await new Promise(resolve => setTimeout(resolve, 100));

    // Simple approach: highlight based on original text matching
    let highlightedCount = 0;
    for (const translation of translations) {
      if (!translation.original_text || !translation.sentence_hash) continue;
      
      const originalText = translation.original_text.trim();
      console.log('🔍 Looking for text to highlight:', originalText.substring(0, 50));
      
      // Find all text nodes and check if they contain the original text
      const walker = doc.createTreeWalker(
        doc.body,
        NodeFilter.SHOW_TEXT,
        null
      );

      let node;
      while (node = walker.nextNode()) {
        const text = node.textContent?.trim();
        if (text && text.includes(originalText)) {
          console.log('✅ Found matching text, highlighting...');
          
          // Find the parent element to highlight
          let parent = node.parentElement;
          while (parent && parent !== doc.body) {
            // Check if this parent contains the full text
            if (parent.textContent && parent.textContent.includes(originalText)) {
              // Only highlight if not already highlighted
              if (!parent.classList.contains('translation-translated')) {
                // Add highlighting
                parent.classList.add('translation-translated');
                parent.style.backgroundColor = '#dcfce7';
                parent.style.border = '1px solid #16a34a';
                parent.style.borderRadius = '4px';
                parent.style.padding = '2px';
                parent.title = `Translated: ${translation.translated_text || 'Previously translated'}`;
                console.log('🎨 Highlighted element:', parent.tagName, parent.textContent?.substring(0, 50));
                highlightedCount++;
              }
              break;
            }
            parent = parent.parentElement;
          }
          break; // Found and highlighted, move to next translation
        }
      }
    }
    
    console.log('✅ Highlighting complete. Highlighted', highlightedCount, 'elements');
  }, [translations, clearHighlights]);

  // Debounced highlighting function
  const debouncedHighlight = useCallback((doc: Document) => {
    // Clear existing timeout
    if (highlightTimeout) {
      clearTimeout(highlightTimeout);
    }
    
    // Set new timeout
    const timeout = setTimeout(() => {
      highlightTranslations(doc);
    }, 1000); // Increased to 1 second to reduce calls
    
    setHighlightTimeout(timeout);
  }, [highlightTimeout, highlightTranslations]);

  // Highlight selected text in iframe
  const highlightSelectedText = useCallback((text: string) => {
    try {
      const iframe = document.querySelector('#epub-viewer iframe') as HTMLIFrameElement;
      if (iframe && iframe.contentDocument) {
        const doc = iframe.contentDocument;
        
        // Remove previous highlights
        const previousHighlights = doc.querySelectorAll('.translation-selected');
        previousHighlights.forEach(el => {
          el.classList.remove('translation-selected');
        });
        
        // Find and highlight the text
        const walker = doc.createTreeWalker(
          doc.body,
          NodeFilter.SHOW_TEXT,
          null
        );
        
        let node;
        while (node = walker.nextNode()) {
          if (node.textContent && node.textContent.includes(text)) {
            const parent = node.parentElement;
            if (parent) {
              parent.classList.add('translation-selected');
            }
          }
        }
      }
    } catch (error) {
      console.warn('Could not highlight selected text:', error);
    }
  }, []);

  return {
    highlightTranslations,
    clearHighlights,
    highlightSelectedText,
    debouncedHighlight
  };
};
