import {
  BlocContent,
  FlagContentPayload,
  PaginatedResponse,
  Post,
  PostListItem,
  ReviewPostPayload,
  SaveBlocContentPayload,
  SavePostPayload,
  ToggleLikeResponse,
} from '@/types';
import { toApiError } from './apiError';
import { fetchAPI } from './fetchAPI';

const extractErrorMessage = (data: unknown, fallback: string): string => {
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    if (typeof obj.message === 'string') return obj.message;
  }
  return fallback;
};

export const fetchPosts = async (
  q?: string,
  page = 1,
  limit = 20,
  status?: string,
  onlyPublished = false
): Promise<PaginatedResponse<PostListItem>> => {
  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('limit', limit.toString());
  if (q) params.append('q', q);
  if (status) params.append('status', status);
  if (onlyPublished) params.append('onlyPublished', 'true');

  const res = await fetchAPI<PaginatedResponse<PostListItem> | PostListItem[]>(`/posts?${params.toString()}`);
  if (!res.ok) throw new Error(extractErrorMessage(res.data, 'Erreur de récupération'));

  // Avec `q`, PostService::list renvoie un tableau simple (recherche full-text) : on le normalise
  if (Array.isArray(res.data)) {
    const items = status ? res.data.filter((post) => post.status === status) : res.data;
    return { items, meta: { page: 1, limit, total: items.length, pages: 1 } };
  }

  return res.data;
};

export const fetchPostById = async (identifier: string, trackView = true): Promise<Post> => {
  const res = await fetchAPI<Post>(`/posts/${identifier}?trackView=${trackView}`);
  if (!res.ok) throw new Error(extractErrorMessage(res.data, 'Article introuvable'));
  return res.data;
};

export const createPost = async (payload: SavePostPayload): Promise<Post> => {
  const res = await fetchAPI<Post>('/posts', { method: 'POST', body: payload });
  if (!res.ok) throw toApiError(res.data, "Erreur lors de la création de l'article");
  return res.data;
};

export const updatePost = async (id: string, payload: SavePostPayload): Promise<Post> => {
  const res = await fetchAPI<Post>(`/posts/${id}`, { method: 'PUT', body: payload });
  if (!res.ok) throw toApiError(res.data, "Erreur lors de l'enregistrement de l'article");
  return res.data;
};

// Groupe ['post.list'] : la réponse ne contient ni blocs ni médias
export const trashPost = async (id: string): Promise<PostListItem> => {
  const res = await fetchAPI<{ post: PostListItem }>(`/posts/${id}/trash`, { method: 'PATCH' });
  if (!res.ok) throw new Error(extractErrorMessage(res.data, 'Erreur de mise à la corbeille'));
  return res.data.post;
};

export const restorePost = async (id: string): Promise<PostListItem> => {
  const res = await fetchAPI<{ post: PostListItem }>(`/posts/${id}/restore`, { method: 'PATCH' });
  if (!res.ok) throw new Error(extractErrorMessage(res.data, 'Erreur de restauration'));
  return res.data.post;
};

export const deletePostPermanently = async (id: string): Promise<void> => {
  const res = await fetchAPI(`/posts/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(extractErrorMessage(res.data, 'Erreur de suppression'));
};

// --- Blocs de contenu ---

export const saveBlock = async (
  postId: string,
  payload: SaveBlocContentPayload,
  blockId?: string
): Promise<BlocContent> => {
  const url = blockId ? `/posts/${postId}/blocks/${blockId}` : `/posts/${postId}/blocks`;
  const res = await fetchAPI<BlocContent>(url, {
    method: blockId ? 'PUT' : 'POST',
    body: payload,
  });
  if (!res.ok) throw new Error(extractErrorMessage(res.data, 'Erreur lors de la sauvegarde du bloc'));
  return res.data;
};

export const removeBlock = async (postId: string, blockId: string): Promise<void> => {
  const res = await fetchAPI(`/posts/${postId}/blocks/${blockId}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(extractErrorMessage(res.data, 'Erreur lors de la suppression du bloc'));
};

// --- Actions front & Modération ---

export const togglePostLike = async (postId: string): Promise<ToggleLikeResponse> => {
  const res = await fetchAPI<ToggleLikeResponse>(`/posts/${postId}/like`, { method: 'POST' });
  if (!res.ok) throw new Error(extractErrorMessage(res.data, "Erreur lors de l'ajout de la mention J'aime"));
  return res.data;
};

export const flagPost = async (
  postId: string,
  payload: FlagContentPayload
): Promise<{ message: string; flags: number }> => {
  const res = await fetchAPI<{ message: string; flags: number }>(`/moderation/posts/${postId}/flag`, {
    method: 'POST',
    body: payload,
  });
  if (!res.ok) throw new Error(extractErrorMessage(res.data, 'Erreur lors du signalement'));
  return res.data;
};

/**
 * File de modération : articles signalés (flagged) ou en statut review / rewriting
 */
export const fetchPostModerationQueue = async (flagged = false, limit = 50): Promise<Post[]> => {
  const params = new URLSearchParams();
  if (flagged) params.append('flagged', 'true');
  params.append('limit', limit.toString());

  const res = await fetchAPI<Post[]>(`/moderation/posts?${params.toString()}`);
  if (!res.ok) throw new Error(extractErrorMessage(res.data, 'Erreur lors de la récupération des articles à modérer'));
  return res.data;
};

export const reviewPost = async (postId: string, payload: ReviewPostPayload): Promise<Post> => {
  const res = await fetchAPI<Post>(`/moderation/posts/${postId}/review`, {
    method: 'PATCH',
    body: payload,
  });
  if (!res.ok) throw new Error(extractErrorMessage(res.data, 'Erreur de modération'));
  return res.data;
};
