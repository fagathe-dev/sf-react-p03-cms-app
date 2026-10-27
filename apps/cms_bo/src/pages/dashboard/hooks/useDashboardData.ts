import { fetchDashboardData } from '@/services/dashboard.api';
import { DashboardResponse } from '@/types';
import { useCallback, useEffect, useState } from 'react';

const errorMessage = (err: unknown): string =>
  err instanceof Error ? err.message : 'Erreur lors du chargement du tableau de bord.';

/**
 * Données du tableau de bord.
 * - premier chargement (isLoading / error + retry) ;
 * - reload() : rafraîchit sans repasser par le loader, les données restent affichées en cas d'échec (refreshError).
 */
export const useDashboardData = () => {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;

    fetchDashboardData()
      .then((response) => {
        if (!cancelled) setData(response);
      })
      .catch((err) => {
        if (!cancelled) setError(errorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [attempt]);

  /** Nouvel essai après l'échec du premier chargement */
  const retry = useCallback(() => {
    setIsLoading(true);
    setError(null);
    setAttempt((value) => value + 1);
  }, []);

  /** Rafraîchissement silencieux (ex. après une modération) */
  const reload = useCallback(async () => {
    try {
      setData(await fetchDashboardData());
      setRefreshError(null);
    } catch (err) {
      setRefreshError(errorMessage(err));
    }
  }, []);

  const dismissRefreshError = useCallback(() => setRefreshError(null), []);

  return { data, isLoading, error, refreshError, retry, reload, dismissRefreshError };
};
