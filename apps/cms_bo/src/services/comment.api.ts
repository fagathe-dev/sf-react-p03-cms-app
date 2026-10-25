// src/api/comment.api.ts
import {
  Comment,
  CreateCommentPayload,
  FlagContentPayload,
  ModerateCommentPayload,
  UpdateCommentPayload,
} from '@/types';
import { fetchAPI } from './fetchAPI';

const extractErrorMessage = (data: unknown, fallback: string): string => {
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    if (typeof obj.message === 'string') return obj.message;
  }
  return fallback;
};

// --- Actions Publiques / Membres ---

export const fetchCommentsByPost = async (postId: string, onlyApproved = true): Promise<Comment[]> => {
  const res = await fetchAPI<Comment[]>(`/moderation/comments/post/${postId}?onlyApproved=${onlyApproved}`);
  if (!res.ok) throw new Error(extractErrorMessage(res.data, 'Erreur lors de la récupération des commentaires'));
  return res.data;
};

export const createComment = async (payload: CreateCommentPayload): Promise<Comment> => {
  const res = await fetchAPI<Comment>('/moderation/comments', {
    method: 'POST',
    body: payload,
  });
  if (!res.ok) throw new Error(extractErrorMessage(res.data, 'Erreur lors de la publication'));
  return res.data;
};

export const updateComment = async (id: string, payload: UpdateCommentPayload): Promise<Comment> => {
  const res = await fetchAPI<Comment>(`/moderation/comments/${id}`, {
    method: 'PUT',
    body: payload,
  });
  if (!res.ok) throw new Error(extractErrorMessage(res.data, 'Erreur lors de la mise à jour'));
  return res.data;
};

export const deleteOwnComment = async (id: string): Promise<void> => {
  const res = await fetchAPI(`/moderation/comments/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(extractErrorMessage(res.data, 'Erreur lors de la suppression'));
};

export const flagComment = async (
  id: string,
  payload: FlagContentPayload
): Promise<{ message: string; flags: number }> => {
  const res = await fetchAPI<{ message: string; flags: number }>(`/moderation/comments/${id}/flag`, {
    method: 'POST',
    body: payload,
  });
  if (!res.ok) throw new Error(extractErrorMessage(res.data, 'Erreur lors du signalement'));
  return res.data;
};

// --- Actions de Modération (Back-Office) ---

export const fetchModerationQueue = async (flagged = false, status?: string, limit = 50): Promise<Comment[]> => {
  const params = new URLSearchParams();
  if (flagged) params.append('flagged', 'true');
  if (status) params.append('status', status);
  params.append('limit', limit.toString());

  const res = await fetchAPI<Comment[]>(`/moderation/comments?${params.toString()}`);
  if (!res.ok) throw new Error(extractErrorMessage(res.data, 'Erreur de récupération'));
  return res.data;
};

export const moderateComment = async (id: string, payload: ModerateCommentPayload): Promise<Comment> => {
  const res = await fetchAPI<Comment>(`/moderation/comments/${id}/moderate`, {
    method: 'PATCH',
    body: payload,
  });
  if (!res.ok) throw new Error(extractErrorMessage(res.data, 'Erreur de modération'));
  return res.data;
};
