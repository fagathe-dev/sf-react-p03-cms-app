import { useCallback, useEffect, useState } from 'react';

interface TaxonomyListItem {
  id: string;
}

interface ListResult<T> {
  query: string;
  items: T[];
  error: string | null;
}

/**
 * Charge une liste de taxonomies (catégories, tags) filtrée par la recherche full-text
 */
export const useTaxonomyList = <T extends TaxonomyListItem>(
  fetcher: (q?: string, limit?: number) => Promise<T[]>,
  query: string
) => {
  const [result, setResult] = useState<ListResult<T> | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetcher(query || undefined, 100)
      .then((items) => {
        if (!cancelled) setResult({ query, items, error: null });
      })
      .catch((err) => {
        if (!cancelled) {
          setResult({ query, items: [], error: err instanceof Error ? err.message : 'Erreur lors du chargement' });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [fetcher, query]);

  const removeItem = useCallback((id: string) => {
    setResult((current) => current && { ...current, items: current.items.filter((item) => item.id !== id) });
  }, []);

  // Le résultat courant correspond-il à la recherche demandée ?
  const isLoading = result?.query !== query;

  return {
    items: isLoading ? [] : result.items,
    isLoading,
    error: isLoading ? null : result.error,
    removeItem,
  };
};
