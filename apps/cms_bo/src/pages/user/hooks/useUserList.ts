import { fetchUsers } from '@/services/user.api';
import { User, UserRole } from '@/types';
import { useCallback, useEffect, useState } from 'react';
import { USERS_PAGE_SIZE } from '../constants';

interface ListResult {
  key: string;
  users: User[];
  error: string | null;
}

/**
 * Charge une page de membres, filtrée par rôle. `hasNextPage` est déduit d'une page pleine
 * (l'API ne renvoie pas de total).
 */
export const useUserList = (page: number, role?: UserRole) => {
  const key = `${page}:${role ?? ''}`;
  const [result, setResult] = useState<ListResult | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetchUsers({ page, limit: USERS_PAGE_SIZE, role })
      .then((users) => {
        if (!cancelled) setResult({ key, users, error: null });
      })
      .catch((err) => {
        if (!cancelled) {
          setResult({ key, users: [], error: err instanceof Error ? err.message : 'Erreur lors du chargement' });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [key, page, role]);

  const removeUser = useCallback((id: string) => {
    setResult((current) => current && { ...current, users: current.users.filter((user) => user.id !== id) });
  }, []);

  const isLoading = result?.key !== key;
  const users = isLoading ? [] : result.users;

  return {
    users,
    isLoading,
    error: isLoading ? null : result.error,
    hasNextPage: !isLoading && users.length >= USERS_PAGE_SIZE,
    removeUser,
  };
};
