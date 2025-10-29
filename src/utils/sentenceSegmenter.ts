/**
 * Sentence segmentation utility using Intl.Segmenter with tiny-sbd fallback
 */

// Type definitions for Intl.Segmenter (available in newer browsers)
interface IntlSegmenter {
  segment(text: string): { segment: string; index: number; isWordLike: boolean }[];
}

declare global {
  interface Intl {
    Segmenter?: new (locale?: string, options?: any) => IntlSegmenter;
  }
}

interface SentenceSegment {
  text: string;
  start: number;
  end: number;
}

class SentenceSegmenter {
  private segmenter: IntlSegmenter | null = null;
  private fallbackAvailable = false;

  constructor() {
    this.initializeSegmenter();
  }

  private async initializeSegmenter() {
    // Check if Intl.Segmenter is available
    if ((Intl as any).Segmenter) {
      try {
        this.segmenter = new (Intl as any).Segmenter('en', { granularity: 'sentence' });
      } catch (error) {
        console.warn('Intl.Segmenter not available, will use fallback');
      }
    }

    // Load sbd as fallback
    if (!this.segmenter) {
      try {
        // Dynamic import for better performance
        const sbd = await import('sbd');
        this.fallbackAvailable = true;
      } catch (error) {
        console.warn('sbd not available, using basic regex fallback');
      }
    }
  }

  /**
   * Segment text into sentences
   */
  async segment(text: string): Promise<SentenceSegment[]> {
    console.log('SentenceSegmenter.segment called with:', text.substring(0, 100));
    if (!text || text.trim().length === 0) {
      console.log('Empty text, returning empty array');
      return [];
    }

    if (this.segmenter) {
      console.log('Using Intl.Segmenter');
      return this.segmentWithIntl(text);
    } else if (this.fallbackAvailable) {
      console.log('Using sbd fallback');
      return this.segmentWithSbd(text);
    } else {
      console.log('Using regex fallback');
      return this.segmentWithRegex(text);
    }
  }

  /**
   * Find the sentence containing a given position
   */
  async findSentenceAtPosition(text: string, position: number): Promise<SentenceSegment | null> {
    const sentences = await this.segment(text);
    
    for (const sentence of sentences) {
      if (position >= sentence.start && position <= sentence.end) {
        return sentence;
      }
    }
    
    return null;
  }

  /**
   * Get all sentences from text
   */
  async getSentences(text: string): Promise<string[]> {
    const segments = await this.segment(text);
    return segments.map(segment => segment.text);
  }

  private segmentWithIntl(text: string): SentenceSegment[] {
    if (!this.segmenter) return [];

    const segments: SentenceSegment[] = [];
    const iterator = this.segmenter.segment(text);
    
    let currentStart = 0;
    let currentText = '';
    
    for (const segment of iterator) {
      if (segment.isWordLike) {
        currentText += segment.segment;
      } else {
        // End of sentence
        if (currentText.trim()) {
          segments.push({
            text: currentText.trim(),
            start: currentStart,
            end: currentStart + currentText.length
          });
        }
        currentStart += currentText.length + segment.segment.length;
        currentText = '';
      }
    }
    
    // Add last sentence if exists
    if (currentText.trim()) {
      segments.push({
        text: currentText.trim(),
        start: currentStart,
        end: currentStart + currentText.length
      });
    }
    
    return segments;
  }

  private async segmentWithSbd(text: string): Promise<SentenceSegment[]> {
    try {
      const sbd = await import('sbd');
      const sentences = sbd.sentences(text);
      
      const segments: SentenceSegment[] = [];
      let currentPos = 0;
      
      for (const sentence of sentences) {
        const start = text.indexOf(sentence, currentPos);
        const end = start + sentence.length;
        
        segments.push({
          text: sentence.trim(),
          start,
          end
        });
        
        currentPos = end;
      }
      
      return segments;
    } catch (error) {
      console.warn('sbd failed, falling back to regex');
      return this.segmentWithRegex(text);
    }
  }

  private segmentWithRegex(text: string): SentenceSegment[] {
    console.log('segmentWithRegex called with:', text.substring(0, 100));
    // Basic regex-based sentence segmentation
    const sentenceRegex = /[.!?]+/g;
    const sentences: string[] = [];
    let lastIndex = 0;
    let match;

    while ((match = sentenceRegex.exec(text)) !== null) {
      const sentence = text.slice(lastIndex, match.index + match[0].length).trim();
      if (sentence) {
        sentences.push(sentence);
      }
      lastIndex = match.index + match[0].length;
    }

    // Add remaining text as last sentence
    const remaining = text.slice(lastIndex).trim();
    if (remaining) {
      sentences.push(remaining);
    }

    console.log('Regex found sentences:', sentences.length, sentences);

    // Convert to segments with positions
    const segments: SentenceSegment[] = [];
    let currentPos = 0;

    for (const sentence of sentences) {
      const start = text.indexOf(sentence, currentPos);
      const end = start + sentence.length;
      
      segments.push({
        text: sentence,
        start,
        end
      });
      
      currentPos = end;
    }

    console.log('Regex segments:', segments);
    return segments;
  }
}

// Export singleton instance
export const sentenceSegmenter = new SentenceSegmenter();

// Export types
export type { SentenceSegment };
