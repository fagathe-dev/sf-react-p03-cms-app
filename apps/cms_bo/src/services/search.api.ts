import { GlobalSearchResponse } from '@/types';
import { toApiError } from './apiError';
import { fetchAPI } from './fetchAPI';

export const SEARCH_MIN_LENGTH = 2;

/**
 * Recherche full-text globale (articles, catégories, tags, utilisateurs) — SearchService::globalSearch
 */
export const fetchGlobalSearch = async (q: string): Promise<GlobalSearchResponse> => {
  const params = new URLSearchParams({ q });

  const res = await fetchAPI<GlobalSearchResponse>(`/search?${params.toString()}`);
  if (!res.ok) throw toApiError(res.data, 'Erreur lors de la recherche');
  return res.data;
};
