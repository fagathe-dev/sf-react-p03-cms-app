import { CreateUserPayload, UpdateUserPayload, User, UserRole } from '@/types';
import { toApiError } from './apiError';
import { fetchAPI } from './fetchAPI';

export interface FetchUsersParams {
  page?: number;
  limit?: number;
  role?: UserRole;
}

/**
 * Liste des membres gérables par l'opérateur (UserService::list) — tableau simple, sans total
 */
export const fetchUsers = async ({ page = 1, limit = 20, role }: FetchUsersParams = {}): Promise<User[]> => {
  const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
  if (role) params.append('role', role);

  const res = await fetchAPI<User[]>(`/users?${params.toString()}`);
  if (!res.ok) throw toApiError(res.data, 'Erreur lors de la récupération des utilisateurs');
  return res.data;
};

export const fetchUserById = async (id: string): Promise<User> => {
  const res = await fetchAPI<User>(`/users/${id}`);
  if (!res.ok) throw toApiError(res.data, 'Utilisateur introuvable');
  return res.data;
};

// Le mot de passe est transmis en clair : UserService le hache directement (pas de SecretDecoder)
export const createUser = async (payload: CreateUserPayload): Promise<User> => {
  const res = await fetchAPI<User>('/users', {
    method: 'POST',
    body: payload,
  });
  if (!res.ok) throw toApiError(res.data, "Erreur lors de la création de l'utilisateur");
  return res.data;
};

export const updateUser = async (id: string, payload: UpdateUserPayload): Promise<User> => {
  const res = await fetchAPI<User>(`/users/${id}`, {
    method: 'PUT',
    body: payload,
  });
  if (!res.ok) throw toApiError(res.data, "Erreur lors de la mise à jour de l'utilisateur");
  return res.data;
};

export const deleteUser = async (id: string): Promise<void> => {
  const res = await fetchAPI(`/users/${id}`, { method: 'DELETE' });
  if (!res.ok) throw toApiError(res.data, "Erreur lors de la suppression de l'utilisateur");
};
