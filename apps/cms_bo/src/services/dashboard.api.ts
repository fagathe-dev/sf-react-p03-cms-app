import { DashboardResponse, HealthCheckResponse } from '@/types';
import { fetchAPI } from './fetchAPI';

const extractErrorMessage = (data: unknown, fallback: string): string => {
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    if (typeof obj.message === 'string') return obj.message;
  }
  return fallback;
};

const isHealthCheckResponse = (data: unknown): data is HealthCheckResponse =>
  Boolean(data && typeof data === 'object' && typeof (data as Record<string, unknown>).status === 'string');

/** Sections du tableau de bord autorisées pour l'utilisateur connecté (GET /dashboard) */
export const fetchDashboardData = async (): Promise<DashboardResponse> => {
  const res = await fetchAPI<DashboardResponse>('/dashboard');
  if (!res.ok) throw new Error(extractErrorMessage(res.data, 'Erreur lors du chargement du tableau de bord.'));
  return res.data;
};

/** État technique de l'API (GET /health-check) ; un état « degraded » arrive avec un 503 et reste exploitable */
export const fetchSystemHealth = async (): Promise<HealthCheckResponse> => {
  const res = await fetchAPI<HealthCheckResponse>('/health-check');
  if (res.ok || isHealthCheckResponse(res.data)) return res.data;
  throw new Error(extractErrorMessage(res.data, "Impossible de récupérer l'état technique de l'API."));
};
