import { useCallback } from 'react';
import { sentenceSegmenter, SentenceSegment } from '@/utils/sentenceSegmenter';
import { advancedSentenceParser, SentenceSegment as AdvancedSentenceSegment } from '@/utils/advancedSentenceParser';

interface UseSentenceParsingReturn {
  parseSentences: (text: string) => Promise<SentenceSegment[]>;
  findSentenceAtPosition: (text: string, position: number) => Promise<SentenceSegment | null>;
  extractSentencesFromViewport: (doc: Document) => Promise<SentenceSegment[]>;
  handleTextClick: (event: MouseEvent, doc: Document, onSentenceSelect: (text: string) => void) => Promise<void>;
}

export const useSentenceParsing = (): UseSentenceParsingReturn => {
  // Parse sentences from text
  const parseSentences = useCallback(async (text: string): Promise<SentenceSegment[]> => {
    try {
      // Use advanced parser for better sentence detection
      const sentenceSegments = await advancedSentenceParser.getSentences(text, {
        minLength: 5,
        maxLength: 1000,
        minConfidence: 0.3
      });
      
      // Convert to the expected format
      return sentenceSegments.map(seg => ({
        text: seg.text,
        start: seg.start,
        end: seg.end
      }));
    } catch (error) {
      console.warn('Advanced parsing failed, using fallback:', error);
      // Fallback to original segmenter
      return await sentenceSegmenter.segment(text);
    }
  }, []);

  // Find sentence at specific position
  const findSentenceAtPosition = useCallback(async (text: string, position: number): Promise<SentenceSegment | null> => {
    try {
      return await sentenceSegmenter.findSentenceAtPosition(text, position);
    } catch (error) {
      console.warn('Failed to find sentence at position:', error);
      return null;
    }
  }, []);

  // Extract sentences from viewport
  const extractSentencesFromViewport = useCallback(async (doc: Document): Promise<SentenceSegment[]> => {
    const textContent = doc.body.textContent || '';
    if (!textContent.trim()) return [];

    try {
      // Use advanced parser for better sentence detection
      const sentenceSegments = await advancedSentenceParser.getSentences(textContent, {
        minLength: 5,
        maxLength: 1000,
        minConfidence: 0.3
      });
      
      // Convert to the expected format
      return sentenceSegments.map(seg => ({
        text: seg.text,
        start: seg.start,
        end: seg.end
      }));
    } catch (error) {
      console.warn('Advanced parsing failed, using fallback:', error);
      // Fallback to original segmenter
      return await sentenceSegmenter.segment(textContent);
    }
  }, []);

  // Handle click-based sentence selection
  const handleTextClick = useCallback(async (
    event: MouseEvent, 
    doc: Document, 
    onSentenceSelect: (text: string) => void
  ) => {
    console.log('Click event triggered', event);
    try {
      const target = event.target as HTMLElement;
      console.log('Click target:', target.tagName, target.textContent?.substring(0, 100));

      // Get the text content of the clicked element
      let textToUse = '';
      
      // Try to get text from the clicked element first
      if (target.textContent && target.textContent.trim()) {
        textToUse = target.textContent.trim();
        console.log('Using target text:', textToUse.substring(0, 100));
      } else {
        // Find the containing paragraph
        const paragraph = target.closest('p, li, blockquote, h1, h2, h3, h4, h5, h6, div') as HTMLElement;
        if (paragraph) {
          textToUse = paragraph.innerText || paragraph.textContent || '';
          console.log('Using paragraph text:', textToUse.substring(0, 100));
        }
      }
      
      if (!textToUse.trim()) {
        console.log('No text found');
        return;
      }

      // Clean up the text - remove common Gutenberg headers/footers
      let cleanText = textToUse
        .replace(/^\*+.*?\*+$/gm, '') // Remove lines with only asterisks
        .replace(/^START OF THE PROJECT GUTENBERG.*$/gm, '') // Remove Gutenberg headers
        .replace(/^END OF THE PROJECT GUTENBERG.*$/gm, '') // Remove Gutenberg footers
        .replace(/^\s*$/gm, '') // Remove empty lines
        .trim();

      // If text is too long, try to find a reasonable sentence
      if (cleanText.length > 500) {
        // Look for the first sentence that ends with proper punctuation
        const sentenceMatch = cleanText.match(/[^.!?]*[.!?]/);
        if (sentenceMatch) {
          cleanText = sentenceMatch[0].trim();
        } else {
          // If no proper sentence found, take first 200 characters
          cleanText = cleanText.substring(0, 200).trim();
        }
      }

      console.log('Cleaned text:', cleanText.substring(0, 200));

      // Use advanced sentence parser to find the best sentence
      if (cleanText.length > 0) {
        console.log('Using advanced parser for:', cleanText.substring(0, 100));
        
        try {
          // Get all sentences first
          const allSentences = await advancedSentenceParser.getSentences(cleanText, {
            minLength: 5,
            maxLength: 1000,
            minConfidence: 0.3
          });
          
          console.log('Found', allSentences.length, 'sentences');
          
          if (allSentences.length > 0) {
            // If we have multiple sentences, try to find the one closest to the click position
            let bestSentence = allSentences[0];
            
            if (allSentences.length > 1) {
              // Try to find the sentence that contains the clicked text
              const clickedText = target.textContent?.trim() || '';
              if (clickedText) {
                const containingSentence = allSentences.find(s => 
                  s.text.toLowerCase().includes(clickedText.toLowerCase()) ||
                  clickedText.toLowerCase().includes(s.text.toLowerCase())
                );
                if (containingSentence) {
                  bestSentence = containingSentence;
                }
              }
            }
            
            // Prefer complete sentences over fragments
            const completeSentences = allSentences.filter(s => 
              s.type !== 'fragment' && s.confidence && s.confidence > 0.6
            );
            
            if (completeSentences.length > 0) {
              bestSentence = completeSentences[0];
            }
            
            console.log('✅ SELECTED ADVANCED SENTENCE:', bestSentence.text);
            console.log('Sentence type:', bestSentence.type, 'Confidence:', bestSentence.confidence);
            onSentenceSelect(bestSentence.text);
          } else {
            // Fallback to using the cleaned text directly
            console.log('✅ SELECTED FALLBACK TEXT:', cleanText);
            onSentenceSelect(cleanText);
          }
        } catch (error) {
          console.warn('Advanced parsing failed, using fallback:', error);
          console.log('✅ SELECTED FALLBACK TEXT:', cleanText);
          onSentenceSelect(cleanText);
        }
      }

    } catch (err) {
      console.error('Sentence click selection failed:', err);
    }
  }, []);

  return {
    parseSentences,
    findSentenceAtPosition,
    extractSentencesFromViewport,
    handleTextClick
  };
};

