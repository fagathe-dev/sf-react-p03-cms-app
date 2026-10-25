import { useEffect, useState } from 'react';

interface ItemResult<T> {
  identifier: string;
  item: T | null;
  error: string | null;
}

/**
 * Charge une taxonomie (catégorie, tag) par identifiant pour les pages d'édition
 */
export const useTaxonomyItem = <T>(fetcher: (identifier: string) => Promise<T>, identifier?: string) => {
  const [result, setResult] = useState<ItemResult<T> | null>(null);

  useEffect(() => {
    if (!identifier) return;

    let cancelled = false;

    fetcher(identifier)
      .then((item) => {
        if (!cancelled) setResult({ identifier, item, error: null });
      })
      .catch((err) => {
        if (!cancelled) {
          setResult({ identifier, item: null, error: err instanceof Error ? err.message : 'Erreur lors du chargement' });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [fetcher, identifier]);

  if (!identifier) {
    return { item: null, isLoading: false, error: 'Identifiant manquant' };
  }

  // Le résultat courant correspond-il à l'identifiant demandé ?
  const isLoading = result?.identifier !== identifier;

  return {
    item: isLoading ? null : result.item,
    isLoading,
    error: isLoading ? null : result.error,
  };
};
