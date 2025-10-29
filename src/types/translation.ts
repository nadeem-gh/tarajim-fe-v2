export interface Book {
  id: number;
  title: string;
  epub_file: string;
}

export interface EpubTranslation {
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
  translated_by_name?: string;
  created_at: string;
  updated_at: string;
}

export interface SentenceSegment {
  text: string;
  start: number;
  end: number;
}

export interface TranslationData {
  book_id: number;
  original_text: string;
  translated_text: string;
  chapter_number: number;
  chapter_title: string;
  position_in_chapter: number;
  cfi_range: string;
  translation_method: 'typing' | 'speech';
}

export interface Suggestion {
  id: number;
  book_title: string;
  original_text: string;
  translated_text: string;
  translated_by_name: string;
  translation_method: string;
  created_at: string;
}

