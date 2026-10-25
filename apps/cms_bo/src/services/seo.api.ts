import { GeneratedSeoPacket, SaveSeoMetadataPayload, SchemaType, SeoMetadata, SeoTargetType } from '@/types';
import { toApiError } from './apiError';
import { fetchAPI } from './fetchAPI';

const extractErrorMessage = (data: unknown, fallback: string): string => {
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    if (typeof obj.message === 'string') return obj.message;
  }
  return fallback;
};

export const fetchSeoByTarget = async (targetType: string, targetIdentifier: string): Promise<SeoMetadata> => {
  const res = await fetchAPI<SeoMetadata>(`/seo/target?targetType=${targetType}&targetIdentifier=${targetIdentifier}`);
  if (!res.ok) throw new Error(extractErrorMessage(res.data, 'Métadonnées introuvables'));
  return res.data;
};

/**
 * Variante de fetchSeoByTarget renvoyant null si aucune métadonnée n'existe encore pour la cible (404)
 */
export const findSeoByTarget = async (
  targetType: SeoTargetType,
  targetIdentifier: string
): Promise<SeoMetadata | null> => {
  const params = new URLSearchParams({ targetType, targetIdentifier });
  const res = await fetchAPI<SeoMetadata>(`/seo/target?${params.toString()}`);

  if (res.status === 404) return null;
  if (!res.ok) throw toApiError(res.data, 'Erreur lors du chargement des métadonnées SEO');
  return res.data;
};

export const saveSeo = async (payload: SaveSeoMetadataPayload): Promise<SeoMetadata> => {
  const res = await fetchAPI<SeoMetadata>('/seo', {
    method: 'POST',
    body: payload,
  });
  if (!res.ok) throw toApiError(res.data, 'Erreur de sauvegarde');
  return res.data;
};

export const deleteSeo = async (id: string): Promise<void> => {
  const res = await fetchAPI(`/seo/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(extractErrorMessage(res.data, 'Erreur de suppression'));
};

// --- Générateurs de schémas (Lecture publique) ---

// `path` omis = chemin par défaut calculé par l'API (ex. /blog/<slug>)
const pathQuery = (path?: string): string => (path ? `?${new URLSearchParams({ path }).toString()}` : '');

export const fetchArticleSchema = async (identifier: string, path?: string): Promise<GeneratedSeoPacket> => {
  const res = await fetchAPI<GeneratedSeoPacket>(`/posts/${identifier}/seo/schema${pathQuery(path)}`);
  if (!res.ok) throw new Error('Erreur de génération');
  return res.data;
};

export const fetchStaticPageSchema = async (
  pageKey: string,
  title: string,
  path: string,
  type: SchemaType
): Promise<GeneratedSeoPacket> => {
  const params = new URLSearchParams({ title, path, type });
  const res = await fetchAPI<GeneratedSeoPacket>(`/seo/static/${pageKey}/schema?${params.toString()}`);
  if (!res.ok) throw new Error('Erreur de génération');
  return res.data;
};

export const fetchTaxonomySchema = async (
  type: 'category' | 'tag',
  identifier: string,
  path?: string
): Promise<GeneratedSeoPacket> => {
  const res = await fetchAPI<GeneratedSeoPacket>(`/seo/taxonomy/${type}/${identifier}/schema${pathQuery(path)}`);
  if (!res.ok) throw new Error('Erreur de génération');
  return res.data;
};
