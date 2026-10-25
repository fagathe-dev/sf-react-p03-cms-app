import { PostMedia, UploadPostMediaPayload } from '@/types';
import { toApiError } from './apiError';
import { fetchAPI } from './fetchAPI';

const extractErrorMessage = (data: unknown, fallback: string): string => {
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    if (typeof obj.message === 'string') return obj.message;
  }
  return fallback;
};

export const uploadPostThumbnail = async (postId: string, file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('thumbnail', file, file.name);

  const res = await fetchAPI<{ thumbnail: string }>(`/posts/${postId}/thumbnail`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    throw toApiError(res.data, "Erreur lors de l'upload de la miniature");
  }

  return res.data.thumbnail;
};

export const uploadPostMedia = async (postId: string, payload: UploadPostMediaPayload): Promise<PostMedia> => {
  const formData = new FormData();
  formData.append('media', payload.file, payload.file.name);
  if (payload.alt) formData.append('alt', payload.alt);
  if (payload.niceName) formData.append('niceName', payload.niceName);
  if (payload.isPinned !== undefined) formData.append('isPinned', payload.isPinned.toString());

  const res = await fetchAPI<PostMedia>(`/posts/${postId}/medias`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    throw toApiError(res.data, "Erreur lors de l'upload du média");
  }

  return res.data;
};

export const deletePostMedia = async (postId: string, mediaId: string): Promise<void> => {
  const res = await fetchAPI(`/posts/${postId}/medias/${mediaId}`, { method: 'DELETE' });

  if (!res.ok) {
    throw new Error(extractErrorMessage(res.data, 'Erreur lors de la suppression du média'));
  }
};
