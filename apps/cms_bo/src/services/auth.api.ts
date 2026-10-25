import {
  AuthResponse,
  ChangeEmailPayload,
  ChangePasswordPayload,
  ForgotPasswordPayload,
  LoginPayload,
  MessageResponse,
  RegisterPayload,
  RegisterResponse,
  ResendOtpPayload,
  ResetPasswordPayload,
  UpdateProfilePayload,
  User,
  VerifyOtpPayload,
} from '@/types';
import { encodeSecret } from '@/utils';
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
    throw new Error(extractErrorMessage(res.data, 'Identifiants invalides'));
  }

  return res.data;
};

export const fetchVerifyOtp = async (payload: VerifyOtpPayload): Promise<MessageResponse> => {
  const res = await fetchAPI<MessageResponse>(`${AUTH_BASE_URL}/verify-otp`, {
    method: 'POST',
    body: payload,
  });

  if (!res.ok) {
    throw new Error(extractErrorMessage(res.data, 'Code de vérification invalide'));
  }

  return res.data;
};

export const fetchResendOtp = async (payload: ResendOtpPayload): Promise<MessageResponse> => {
  const res = await fetchAPI<MessageResponse>(`${AUTH_BASE_URL}/resend-otp`, {
    method: 'POST',
    body: payload,
  });

  if (!res.ok) {
    throw new Error(extractErrorMessage(res.data, "Erreur lors de l'envoi du code"));
  }

  return res.data;
};

export const fetchForgotPassword = async (payload: ForgotPasswordPayload): Promise<MessageResponse> => {
  const res = await fetchAPI<MessageResponse>(`${AUTH_BASE_URL}/forgot-password`, {
    method: 'POST',
    body: payload,
  });

  if (!res.ok) {
    throw new Error(extractErrorMessage(res.data, 'Erreur lors de la demande de réinitialisation'));
  }

  return res.data;
};

export const fetchResetPassword = async (payload: ResetPasswordPayload): Promise<MessageResponse> => {
  const res = await fetchAPI<MessageResponse>(`${AUTH_BASE_URL}/reset-password`, {
    method: 'POST',
    body: { ...payload, password: encodeSecret(payload.password) },
  });

  if (!res.ok) {
    throw new Error(extractErrorMessage(res.data, 'Erreur lors de la réinitialisation du mot de passe'));
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

export const deleteAccount = async (): Promise<void> => {
  const res = await fetchAPI(`${ACCOUNT_BASE_URL}`, {
    method: 'DELETE',
  });

  if (!res.ok) {
    throw new Error(extractErrorMessage(res.data, 'Erreur lors de la suppression du compte'));
  }
};
