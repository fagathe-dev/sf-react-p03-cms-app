import { SaveTagPayload, Tag, TagSummary } from '@/types';
import { toApiError } from './apiError';
import { fetchAPI } from './fetchAPI';

export const fetchTags = async (q?: string, limit = 50): Promise<TagSummary[]> => {
  const params = new URLSearchParams();
  if (q) params.append('q', q);
  params.append('limit', limit.toString());

  const res = await fetchAPI<TagSummary[]>(`/tags?${params.toString()}`);
  if (!res.ok) throw toApiError(res.data, 'Erreur lors de la récupération des tags');
  return res.data;
};

export const fetchTagById = async (identifier: string): Promise<Tag> => {
  const res = await fetchAPI<Tag>(`/tags/${identifier}`);
  if (!res.ok) throw toApiError(res.data, 'Tag introuvable');
  return res.data;
};

export const createTag = async (payload: SaveTagPayload): Promise<Tag> => {
  const res = await fetchAPI<Tag>('/tags', {
    method: 'POST',
    body: payload,
  });
  if (!res.ok) throw toApiError(res.data, 'Erreur lors de la création');
  return res.data;
};

export const updateTag = async (id: string, payload: SaveTagPayload): Promise<Tag> => {
  const res = await fetchAPI<Tag>(`/tags/${id}`, {
    method: 'PUT',
    body: payload,
  });
  if (!res.ok) throw toApiError(res.data, 'Erreur lors de la mise à jour');
  return res.data;
};

export const deleteTag = async (id: string): Promise<void> => {
  const res = await fetchAPI(`/tags/${id}`, { method: 'DELETE' });
  if (!res.ok) throw toApiError(res.data, 'Erreur lors de la suppression');
};
