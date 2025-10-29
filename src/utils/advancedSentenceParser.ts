/**
 * Advanced sentence parsing using Compromise.js and other libraries
 */

interface SentenceSegment {
  text: string;
  start: number;
  end: number;
  confidence?: number;
  type?: 'statement' | 'question' | 'exclamation' | 'fragment';
}

class AdvancedSentenceParser {
  private compromise: any = null;
  private sbd: any = null;
  private initialized = false;

  constructor() {
    this.initialize();
  }

  private async initialize() {
    try {
      // Load Compromise.js
      const nlp = await import('compromise');
      this.compromise = nlp.default;
      console.log('Compromise.js loaded successfully');
    } catch (error) {
      console.warn('Compromise.js not available, using fallback');
    }

    try {
      // Load sbd as fallback
      const sbd = await import('sbd');
      this.sbd = sbd;
      console.log('SBD loaded successfully');
    } catch (error) {
      console.warn('SBD not available, using regex fallback');
    }

    this.initialized = true;
  }

  /**
   * Parse text into sentences with advanced analysis
   */
  async parseSentences(text: string): Promise<SentenceSegment[]> {
    if (!this.initialized) {
      await this.waitForInitialization();
    }

    if (!text || text.trim().length === 0) {
      return [];
    }

    console.log('AdvancedSentenceParser parsing:', text.substring(0, 100));

    // Try Compromise.js first
    if (this.compromise) {
      return this.parseWithCompromise(text);
    }

    // Fallback to SBD
    if (this.sbd) {
      return this.parseWithSBD(text);
    }

    // Final fallback to regex
    return this.parseWithRegex(text);
  }

  private parseWithCompromise(text: string): SentenceSegment[] {
    try {
      const doc = this.compromise(text);
      const sentences = doc.sentences();
      
      const segments: SentenceSegment[] = [];
      let currentPos = 0;

      sentences.forEach((sentence: any) => {
        const sentenceText = sentence.text().trim();
        if (sentenceText) {
          const start = text.indexOf(sentenceText, currentPos);
          const end = start + sentenceText.length;
          
          // Determine sentence type
          let type: 'statement' | 'question' | 'exclamation' | 'fragment' = 'statement';
          if (sentenceText.endsWith('?')) {
            type = 'question';
          } else if (sentenceText.endsWith('!')) {
            type = 'exclamation';
          } else if (!sentenceText.match(/[.!?]$/)) {
            type = 'fragment';
          }

          segments.push({
            text: sentenceText,
            start,
            end,
            confidence: 0.9, // Compromise is quite reliable
            type
          });
          
          currentPos = end;
        }
      });

      console.log('Compromise found', segments.length, 'sentences');
      return segments;
    } catch (error) {
      console.warn('Compromise parsing failed:', error);
      return this.parseWithSBD(text);
    }
  }

  private parseWithSBD(text: string): SentenceSegment[] {
    try {
      const sentences = this.sbd.sentences(text);
      
      const segments: SentenceSegment[] = [];
      let currentPos = 0;

      sentences.forEach((sentence: string) => {
        const trimmed = sentence.trim();
        if (trimmed) {
          const start = text.indexOf(trimmed, currentPos);
          const end = start + trimmed.length;
          
          let type: 'statement' | 'question' | 'exclamation' | 'fragment' = 'statement';
          if (trimmed.endsWith('?')) {
            type = 'question';
          } else if (trimmed.endsWith('!')) {
            type = 'exclamation';
          } else if (!trimmed.match(/[.!?]$/)) {
            type = 'fragment';
          }

          segments.push({
            text: trimmed,
            start,
            end,
            confidence: 0.7,
            type
          });
          
          currentPos = end;
        }
      });

      console.log('SBD found', segments.length, 'sentences');
      return segments;
    } catch (error) {
      console.warn('SBD parsing failed:', error);
      return this.parseWithRegex(text);
    }
  }

  private parseWithRegex(text: string): SentenceSegment[] {
    // Enhanced regex for better sentence detection
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

    const segments: SentenceSegment[] = [];
    let currentPos = 0;

    sentences.forEach((sentence) => {
      const trimmed = sentence.trim();
      if (trimmed) {
        const start = text.indexOf(trimmed, currentPos);
        const end = start + trimmed.length;
        
        let type: 'statement' | 'question' | 'exclamation' | 'fragment' = 'statement';
        if (trimmed.endsWith('?')) {
          type = 'question';
        } else if (trimmed.endsWith('!')) {
          type = 'exclamation';
        } else if (!trimmed.match(/[.!?]$/)) {
          type = 'fragment';
        }

        segments.push({
          text: trimmed,
          start,
          end,
          confidence: 0.5,
          type
        });
        
        currentPos = end;
      }
    });

    console.log('Regex found', segments.length, 'sentences');
    return segments;
  }

  /**
   * Find the best sentence containing a given position
   */
  async findSentenceAtPosition(text: string, position: number): Promise<SentenceSegment | null> {
    const segments = await this.parseSentences(text);
    
    for (const segment of segments) {
      if (position >= segment.start && position <= segment.end) {
        return segment;
      }
    }
    
    // If no exact match, return the closest sentence
    if (segments.length > 0) {
      let closest = segments[0];
      let minDistance = Math.abs(position - closest.start);
      
      for (const segment of segments) {
        const distance = Math.min(
          Math.abs(position - segment.start),
          Math.abs(position - segment.end)
        );
        if (distance < minDistance) {
          minDistance = distance;
          closest = segment;
        }
      }
      
      return closest;
    }
    
    return null;
  }

  /**
   * Get sentences with filtering options
   */
  async getSentences(
    text: string, 
    options: {
      minLength?: number;
      maxLength?: number;
      types?: ('statement' | 'question' | 'exclamation' | 'fragment')[];
      minConfidence?: number;
    } = {}
  ): Promise<SentenceSegment[]> {
    const segments = await this.parseSentences(text);
    
    return segments.filter(segment => {
      if (options.minLength && segment.text.length < options.minLength) return false;
      if (options.maxLength && segment.text.length > options.maxLength) return false;
      if (options.types && !options.types.includes(segment.type || 'statement')) return false;
      if (options.minConfidence && (segment.confidence || 0) < options.minConfidence) return false;
      return true;
    });
  }

  private async waitForInitialization(): Promise<void> {
    while (!this.initialized) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
}

// Export singleton instance
export const advancedSentenceParser = new AdvancedSentenceParser();

// Export types
export type { SentenceSegment };

