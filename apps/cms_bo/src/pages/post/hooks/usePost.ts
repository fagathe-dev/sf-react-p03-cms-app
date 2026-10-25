import { fetchPostById } from '@/services/post.api';
import { Post } from '@/types';
import { useEffect, useState } from 'react';

interface PostResult {
  id: string;
  post: Post | null;
  error: string | null;
}

/**
 * Charge un article complet (blocs + médias) sans comptabiliser de vue (trackView=false)
 */
export const usePost = (id?: string) => {
  const [result, setResult] = useState<PostResult | null>(null);

  useEffect(() => {
    if (!id) return;

    let cancelled = false;

    fetchPostById(id, false)
      .then((post) => {
        if (!cancelled) setResult({ id, post, error: null });
      })
      .catch((err) => {
        if (!cancelled) {
          setResult({ id, post: null, error: err instanceof Error ? err.message : 'Erreur lors du chargement' });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (!id) {
    return { post: null, isLoading: false, error: 'Identifiant manquant' };
  }

  const isLoading = result?.id !== id;

  return {
    post: isLoading ? null : result.post,
    isLoading,
    error: isLoading ? null : result.error,
  };
};
