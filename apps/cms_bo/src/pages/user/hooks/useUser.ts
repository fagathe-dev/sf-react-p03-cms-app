import { fetchUserById } from '@/services/user.api';
import { User } from '@/types';
import { useEffect, useState } from 'react';

interface UserResult {
  id: string;
  user: User | null;
  error: string | null;
}

/**
 * Charge un membre par UUID pour les pages de détail et d'édition
 */
export const useUser = (id?: string) => {
  const [result, setResult] = useState<UserResult | null>(null);

  useEffect(() => {
    if (!id) return;

    let cancelled = false;

    fetchUserById(id)
      .then((user) => {
        if (!cancelled) setResult({ id, user, error: null });
      })
      .catch((err) => {
        if (!cancelled) {
          setResult({ id, user: null, error: err instanceof Error ? err.message : 'Erreur lors du chargement' });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (!id) {
    return { user: null, isLoading: false, error: 'Identifiant manquant' };
  }

  const isLoading = result?.id !== id;

  return {
    user: isLoading ? null : result.user,
    isLoading,
    error: isLoading ? null : result.error,
  };
};
