import { useCallback, useEffect, useState } from 'react';

interface QueueItem {
  id: string;
}

interface QueueResult<T> {
  key: string;
  items: T[];
  error: string | null;
}

/**
 * Charge une file de modération et permet de la mettre à jour localement après une décision.
 * `key` identifie le filtre courant : la file est rechargée quand il change.
 */
export const useModerationQueue = <T extends QueueItem>(key: string, loader: () => Promise<T[]>) => {
  const [result, setResult] = useState<QueueResult<T> | null>(null);

  useEffect(() => {
    let cancelled = false;

    loader()
      .then((items) => {
        if (!cancelled) setResult({ key, items, error: null });
      })
      .catch((err) => {
        if (!cancelled) {
          setResult({ key, items: [], error: err instanceof Error ? err.message : 'Erreur lors du chargement' });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [key, loader]);

  /** Remplace l'élément mis à jour, ou le retire s'il ne correspond plus au filtre */
  const applyUpdate = useCallback((updated: T, keepInQueue: boolean) => {
    setResult(
      (current) =>
        current && {
          ...current,
          items: keepInQueue
            ? current.items.map((item) => (item.id === updated.id ? updated : item))
            : current.items.filter((item) => item.id !== updated.id),
        }
    );
  }, []);

  const removeItem = useCallback((id: string) => {
    setResult((current) => current && { ...current, items: current.items.filter((item) => item.id !== id) });
  }, []);

  const isLoading = result?.key !== key;

  return {
    items: isLoading ? [] : result.items,
    isLoading,
    error: isLoading ? null : result.error,
    applyUpdate,
    removeItem,
  };
};
