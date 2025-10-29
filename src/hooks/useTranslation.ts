import { useState, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '@/lib/api';
import { EpubTranslation, TranslationData, Suggestion } from '@/types/translation';

interface UseTranslationProps {
  bookId: number;
}

interface UseTranslationReturn {
  translations: EpubTranslation[];
  isLoading: boolean;
  saveTranslation: (data: TranslationData) => Promise<void>;
  fetchSuggestions: (text: string) => Promise<Suggestion[]>;
  refreshTranslations: () => void;
  isSaving: boolean;
}

export const useTranslation = ({ bookId }: UseTranslationProps): UseTranslationReturn => {
  const [isSaving, setIsSaving] = useState(false);
  const queryClient = useQueryClient();
  const suggestionsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch existing translations for this book
  const { data: translations = [], isLoading } = useQuery(
    ['epub-translations', bookId],
    async () => {
      const { data } = await api.get('/workspace/epub-translations/list/', {
        params: { book_id: bookId },
      });
      console.log('📚 Loaded translations:', data.length, 'items');
      if (data.length > 0) {
        console.log('📝 First translation:', data[0]);
      }
      return data;
    },
    {
      enabled: !!bookId,
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    }
  );

  // Save translation mutation
  const saveTranslationMutation = useMutation(
    async (translationData: TranslationData) => {
      const { data } = await api.post('/workspace/epub-translations/', translationData);
      return data;
    },
    {
      onSuccess: () => {
        // Only invalidate if we have translations to avoid unnecessary refetch
        if (translations.length > 0) {
          queryClient.invalidateQueries(['epub-translations', bookId]);
        }
      },
    }
  );

  // Save translation function
  const saveTranslation = useCallback(async (data: TranslationData) => {
    setIsSaving(true);
    try {
      await saveTranslationMutation.mutateAsync(data);
    } finally {
      setIsSaving(false);
    }
  }, [saveTranslationMutation]);

  // Fetch translation suggestions with debouncing
  const fetchSuggestions = useCallback(async (text: string): Promise<Suggestion[]> => {
    // Clear existing timeout
    if (suggestionsTimeoutRef.current) {
      clearTimeout(suggestionsTimeoutRef.current);
    }

    return new Promise((resolve) => {
      suggestionsTimeoutRef.current = setTimeout(async () => {
        try {
          const { data } = await api.get('/workspace/epub-translations/suggestions/', {
            params: { text: text.trim() }
          });
          resolve(data || []);
        } catch (error) {
          console.error('Failed to fetch suggestions:', error);
          resolve([]);
        }
      }, 300); // 300ms debounce
    });
  }, []);

  // Refresh translations
  const refreshTranslations = useCallback(() => {
    queryClient.invalidateQueries(['epub-translations', bookId]);
  }, [queryClient, bookId]);

  return {
    translations,
    isLoading,
    saveTranslation,
    fetchSuggestions,
    refreshTranslations,
    isSaving
  };
};
