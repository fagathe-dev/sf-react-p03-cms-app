import { LogDate, LogEntry } from '@/types';
import { toApiError } from './apiError';
import { fetchAPI } from './fetchAPI';

/** Arborescence des fichiers de log groupés par date (ROLE_SUPER_ADMIN) */
export const fetchLogTree = async (): Promise<LogDate[]> => {
  const res = await fetchAPI<LogDate[]>('/admin/logs');
  if (!res.ok) throw toApiError(res.data, 'Erreur lors de la récupération des logs.');
  return res.data ?? [];
};

/** Entrées d'un fichier de log ; `path` est le chemin pointé (ex: service.post-service) */
export const fetchLogFile = async (date: string, path: string): Promise<LogEntry[]> => {
  const res = await fetchAPI<LogEntry[]>(`/admin/logs/${date}/${path}`);
  if (!res.ok) throw toApiError(res.data, 'Erreur lors de la lecture du fichier de log.');
  return res.data ?? [];
};
