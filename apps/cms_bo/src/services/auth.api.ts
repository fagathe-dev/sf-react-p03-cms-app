import {
  AccountDeletionRequestResponse,
  AuthResponse,
  ChangeEmailPayload,
  ChangePasswordPayload,
  DeleteAccountPayload,
  ForgotPasswordPayload,
  IdentifierPayload,
  LoginCodePayload,
  LoginCodeRequestResponse,
  LoginPayload,
  MessageResponse,
  RegisterPayload,
  RegisterResponse,
  ResetPasswordPayload,
  UpdateProfilePayload,
  User,
  VerifyEmailPayload,
} from '@/types';
import { encodeSecret } from '@/utils';
import { toApiError } from './apiError';
import { fetchAPI } from './fetchAPI';

const AUTH_BASE_URL = '/auth';
const ACCOUNT_BASE_URL = '/account';

const extractErrorMessage = (data: unknown, fallback: string): string => {
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    if (typeof obj.message === 'string') return obj.message;
    if (obj.errors && typeof obj.errors === 'object') {
      const firstErr = Object.values(obj.errors)[0];
      if (typeof firstErr === 'string') return firstErr;
      if (Array.isArray(firstErr) && typeof firstErr[0] === 'string') return firstErr[0];
    }
  }
  return fallback;
};

// ─────────────────────────────────────────────────────────────────────────────
// Auth (/auth)
// ─────────────────────────────────────────────────────────────────────────────

export const fetchRegister = async (payload: RegisterPayload): Promise<RegisterResponse> => {
  const res = await fetchAPI<RegisterResponse>(`${AUTH_BASE_URL}/register`, {
    method: 'POST',
    body: { ...payload, password: encodeSecret(payload.password) },
  });

  if (!res.ok) {
    throw new Error(extractErrorMessage(res.data, "Erreur lors de l'inscription"));
  }

  return res.data;
};

export const fetchLogin = async (credentials: LoginPayload): Promise<AuthResponse> => {
  const res = await fetchAPI<AuthResponse>(`${AUTH_BASE_URL}/login`, {
    method: 'POST',
    body: { ...credentials, password: encodeSecret(credentials.password) },
  });

  if (!res.ok) {
    // ApiError : conserve le code métier (ex. `email_not_verified`)
    throw toApiError(res.data, 'Identifiants invalides');
  }

  return res.data;
};

/** Connexion sans mot de passe, étape 1 : envoi d'un code temporaire par e-mail */
export const fetchRequestLoginCode = async (payload: IdentifierPayload): Promise<LoginCodeRequestResponse> => {
  const res = await fetchAPI<LoginCodeRequestResponse>(`${AUTH_BASE_URL}/login-code`, {
    method: 'POST',
    body: payload,
  });

  if (!res.ok) {
    throw toApiError(res.data, "Impossible d'envoyer le code de connexion");
  }

  return res.data;
};

/** Connexion sans mot de passe, étape 2 : identifiant + code reçu */
export const fetchLoginWithCode = async (payload: LoginCodePayload): Promise<AuthResponse> => {
  const res = await fetchAPI<AuthResponse>(`${AUTH_BASE_URL}/login-code/verify`, {
    method: 'POST',
    body: payload,
  });

  if (!res.ok) {
    throw toApiError(res.data, 'Code invalide ou expiré');
  }

  return res.data;
};

/** Lien reçu à l'inscription : active le compte et renvoie une session (connexion automatique) */
export const fetchVerifyEmail = async (payload: VerifyEmailPayload): Promise<AuthResponse> => {
  const res = await fetchAPI<AuthResponse>(`${AUTH_BASE_URL}/verify-email`, {
    method: 'POST',
    body: payload,
  });

  if (!res.ok) {
    throw toApiError(res.data, 'Ce lien de vérification est invalide ou a expiré');
  }

  return res.data;
};

export const fetchResendVerification = async (payload: IdentifierPayload): Promise<MessageResponse> => {
  const res = await fetchAPI<MessageResponse>(`${AUTH_BASE_URL}/resend-verification`, {
    method: 'POST',
    body: payload,
  });

  if (!res.ok) {
    throw toApiError(res.data, "Erreur lors de l'envoi du lien de vérification");
  }

  return res.data;
};

export const fetchForgotPassword = async (payload: ForgotPasswordPayload): Promise<MessageResponse> => {
  const res = await fetchAPI<MessageResponse>(`${AUTH_BASE_URL}/forgot-password`, {
    method: 'POST',
    body: payload,
  });

  if (!res.ok) {
    throw toApiError(res.data, 'Erreur lors de la demande de réinitialisation');
  }

  return res.data;
};

export const fetchResetPassword = async (payload: ResetPasswordPayload): Promise<MessageResponse> => {
  const res = await fetchAPI<MessageResponse>(`${AUTH_BASE_URL}/reset-password`, {
    method: 'POST',
    body: { ...payload, password: encodeSecret(payload.password) },
  });

  if (!res.ok) {
    throw toApiError(res.data, 'Erreur lors de la réinitialisation du mot de passe');
  }

  return res.data;
};

// ─────────────────────────────────────────────────────────────────────────────
// Account & Profile (/account)
// ─────────────────────────────────────────────────────────────────────────────

export const fetchProfile = async (token?: string): Promise<User> => {
  const res = await fetchAPI<User>(`${ACCOUNT_BASE_URL}/profile`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  if (!res.ok) {
    throw new Error('Session expirée');
  }

  return res.data;
};

export const updateProfile = async (payload: UpdateProfilePayload): Promise<User> => {
  const res = await fetchAPI<User>(`${ACCOUNT_BASE_URL}/profile`, {
    method: 'PUT',
    body: payload,
  });

  if (!res.ok) {
    throw new Error(extractErrorMessage(res.data, 'Erreur lors de la mise à jour des informations'));
  }

  return res.data;
};

export const updateAvatar = async (file: File): Promise<User> => {
  const formData = new FormData();
  formData.append('avatar', file, file.name);

  const res = await fetchAPI<User>(`${ACCOUNT_BASE_URL}/avatar`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    throw new Error(extractErrorMessage(res.data, "Erreur lors de la mise à jour de l'avatar"));
  }

  return res.data;
};

export const updateEmail = async (payload: ChangeEmailPayload): Promise<User> => {
  const res = await fetchAPI<User>(`${ACCOUNT_BASE_URL}/email`, {
    method: 'PUT',
    body: payload,
  });

  if (!res.ok) {
    throw new Error(extractErrorMessage(res.data, "Erreur lors de la modification de l'adresse e-mail"));
  }

  return res.data;
};

export const updatePassword = async (payload: ChangePasswordPayload): Promise<{ message: string }> => {
  const res = await fetchAPI<{ message: string }>(`${ACCOUNT_BASE_URL}/password`, {
    method: 'PUT',
    body: {
      currentPassword: encodeSecret(payload.currentPassword),
      newPassword: encodeSecret(payload.newPassword),
    },
  });

  if (!res.ok) {
    throw new Error(extractErrorMessage(res.data, 'Erreur lors de la modification du mot de passe'));
  }

  return res.data;
};

/** Suppression du compte, étape 1 : envoi d'un code de confirmation (10 min) par e-mail */
export const requestAccountDeletion = async (): Promise<AccountDeletionRequestResponse> => {
  const res = await fetchAPI<AccountDeletionRequestResponse>(`${ACCOUNT_BASE_URL}/delete-request`, {
    method: 'POST',
  });

  if (!res.ok) {
    throw toApiError(res.data, "Impossible d'envoyer le code de confirmation");
  }

  return res.data;
};

/** Suppression du compte, étape 2 : suppression définitive avec le code reçu */
export const deleteAccount = async (payload: DeleteAccountPayload): Promise<void> => {
  const res = await fetchAPI(`${ACCOUNT_BASE_URL}`, {
    method: 'DELETE',
    body: payload,
  });

  if (!res.ok) {
    throw toApiError(res.data, 'Erreur lors de la suppression du compte');
  }
};
