import { fetchGlobalSearch, SEARCH_MIN_LENGTH } from '@/services/search.api';
import { GlobalSearchResponse } from '@/types';
import { useEffect, useState } from 'react';

interface SearchResult {
  query: string;
  data: GlobalSearchResponse | null;
  error: string | null;
}

/**
 * Lance la recherche globale dès que le terme atteint la longueur minimale de l'API
 */
export const useGlobalSearch = (query: string) => {
  const [result, setResult] = useState<SearchResult | null>(null);
  const isSearchable = query.length >= SEARCH_MIN_LENGTH;

  useEffect(() => {
    if (!isSearchable) return;

    let cancelled = false;

    fetchGlobalSearch(query)
      .then((data) => {
        if (!cancelled) setResult({ query, data, error: null });
      })
      .catch((err) => {
        if (!cancelled) {
          setResult({ query, data: null, error: err instanceof Error ? err.message : 'Erreur lors de la recherche' });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [query, isSearchable]);

  if (!isSearchable) {
    return { data: null, isLoading: false, error: null, isSearchable };
  }

  const isLoading = result?.query !== query;

  return {
    data: isLoading ? null : result.data,
    isLoading,
    error: isLoading ? null : result.error,
    isSearchable,
  };
};
