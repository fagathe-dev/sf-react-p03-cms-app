import { Category, CategorySummary, SaveCategoryPayload } from '@/types';
import { toApiError } from './apiError';
import { fetchAPI } from './fetchAPI';

export const fetchCategories = async (q?: string, limit = 50): Promise<CategorySummary[]> => {
  const params = new URLSearchParams();
  if (q) params.append('q', q);
  params.append('limit', limit.toString());

  const res = await fetchAPI<CategorySummary[]>(`/categories?${params.toString()}`);
  if (!res.ok) throw toApiError(res.data, 'Erreur lors de la récupération des catégories');
  return res.data;
};

export const fetchCategoryById = async (identifier: string): Promise<Category> => {
  const res = await fetchAPI<Category>(`/categories/${identifier}`);
  if (!res.ok) throw toApiError(res.data, 'Catégorie introuvable');
  return res.data;
};

export const createCategory = async (payload: SaveCategoryPayload): Promise<Category> => {
  const res = await fetchAPI<Category>('/categories', {
    method: 'POST',
    body: payload,
  });
  if (!res.ok) throw toApiError(res.data, 'Erreur lors de la création');
  return res.data;
};

export const updateCategory = async (id: string, payload: SaveCategoryPayload): Promise<Category> => {
  const res = await fetchAPI<Category>(`/categories/${id}`, {
    method: 'PUT',
    body: payload,
  });
  if (!res.ok) throw toApiError(res.data, 'Erreur lors de la mise à jour');
  return res.data;
};

/** Upload ou remplacement de l'image (5 Mo max, pas de SVG) ; renvoie la catégorie à jour */
export const uploadCategoryImage = async (id: string, file: File): Promise<Category> => {
  const formData = new FormData();
  formData.append('image', file, file.name);

  const res = await fetchAPI<Category>(`/categories/${id}/image`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) throw toApiError(res.data, "Erreur lors de l'envoi de l'image");
  return res.data;
};

/** Retire l'image : l'icône de la catégorie est de nouveau affichée */
export const deleteCategoryImage = async (id: string): Promise<Category> => {
  const res = await fetchAPI<Category>(`/categories/${id}/image`, { method: 'DELETE' });
  if (!res.ok) throw toApiError(res.data, "Erreur lors de la suppression de l'image");
  return res.data;
};

export const deleteCategory = async (id: string): Promise<void> => {
  const res = await fetchAPI(`/categories/${id}`, { method: 'DELETE' });
  if (!res.ok) throw toApiError(res.data, 'Erreur lors de la suppression');
};
