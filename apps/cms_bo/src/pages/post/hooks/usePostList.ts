import { fetchPosts } from '@/services/post.api';
import { PaginationMeta, PostListItem, PostStatus } from '@/types';
import { useCallback, useEffect, useState } from 'react';
import { POSTS_PAGE_SIZE } from '../constants';

interface ListResult {
  key: string;
  items: PostListItem[];
  meta: PaginationMeta | null;
  error: string | null;
}

interface UsePostListOptions {
  status?: PostStatus;
  query?: string;
  page?: number;
  /** Statuts masqués de la liste (ex. corbeille dans « Tous ») */
  excludeStatuses?: PostStatus[];
}

/**
 * Charge une page d'articles (filtre de statut, recherche full-text) et permet de retirer
 * localement un article après une action (corbeille, restauration…)
 */
export const usePostList = ({ status, query = '', page = 1, excludeStatuses = [] }: UsePostListOptions) => {
  const excludeKey = excludeStatuses.join(',');
  const key = `${status ?? ''}:${query}:${page}:${excludeKey}`;
  const [result, setResult] = useState<ListResult | null>(null);

  useEffect(() => {
    let cancelled = false;
    const excluded = excludeKey ? excludeKey.split(',') : [];

    fetchPosts(query || undefined, page, POSTS_PAGE_SIZE, status)
      .then(({ items, meta }) => {
        if (!cancelled) {
          // L'API n'exclut aucun statut quand aucun filtre n'est demandé
          const visible = items.filter((post) => !excluded.includes(post.status));
          setResult({ key, items: visible, meta, error: null });
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setResult({ key, items: [], meta: null, error: err instanceof Error ? err.message : 'Erreur lors du chargement' });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [key, status, query, page, excludeKey]);

  const removeItem = useCallback((id: string) => {
    setResult((current) => current && { ...current, items: current.items.filter((post) => post.id !== id) });
  }, []);

  const isLoading = result?.key !== key;

  return {
    items: isLoading ? [] : result.items,
    meta: isLoading ? null : result.meta,
    isLoading,
    error: isLoading ? null : result.error,
    removeItem,
  };
};
