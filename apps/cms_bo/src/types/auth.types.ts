// src/types/auth.types.ts
import { ConfigurableEntity, IsoDateString, Uuid } from './common.types';

export type UserRole =
  | 'ROLE_USER'
  | 'ROLE_CONTRIBUTOR'
  | 'ROLE_EDITOR'
  | 'ROLE_MODERATOR'
  | 'ROLE_MANAGER'
  | 'ROLE_ADMIN'
  | 'ROLE_SUPER_ADMIN';

/** @deprecated Alias de UserRole */
export type RoleEnum = UserRole;

export interface UserSettings {
  bio: string | null;
  website: string | null;
  email_notifications: boolean;
  [key: string]: unknown;
}

/**
 * Sous-ensemble de User exposé dans les groupes ['post.list', 'post.read', 'comment.read']
 */
export interface UserSummary {
  id: Uuid;
  username: string;
  firstname?: string | null;
  lastname?: string | null;
  avatar?: string | null;
  displayName?: string | null;
}

/**
 * Entité User complète exposée dans le groupe ['user.read']
 */
export interface User extends UserSummary, ConfigurableEntity<UserSettings> {
  email: string;
  role: UserRole;
  roles?: UserRole[];
  isVerified: boolean;
  emailVerifiedAt: IsoDateString | null;
  createdAt: IsoDateString;
  updatedAt: IsoDateString | null;
}

// --- Payloads AuthService ---

export interface LoginPayload {
  email?: string;
  username?: string;
  password: string;
}

/**
 * Réponse de POST /auth/login, /auth/login-code/verify et /auth/verify-email :
 * le token JWT est toujours présent en cas de succès
 */
export interface AuthResponse {
  token: string;
  user: User;
  message?: string;
}

/**
 * Réponse de POST /auth/register
 */
export interface RegisterResponse {
  user: User;
  message: string;
}

export interface RegisterPayload {
  email: string;
  username: string;
  password: string;
  firstname?: string | null;
  lastname?: string | null;
}

/**
 * Réponse générique ne contenant qu'un message (renvoi du lien, mot de passe oublié, réinitialisation…)
 */
export interface MessageResponse {
  message: string;
}

/** Payload de POST /auth/verify-email (jeton du lien reçu à l'inscription) */
export interface VerifyEmailPayload {
  token: string;
}

/** Payload de POST /auth/resend-verification et /auth/login-code (e-mail ou nom d'utilisateur) */
export interface IdentifierPayload {
  username: string;
}

/** Payload de POST /auth/login-code/verify */
export interface LoginCodePayload {
  username: string;
  code: string;
}

/** Réponse de POST /auth/login-code */
export interface LoginCodeRequestResponse extends MessageResponse {
  /** Validité du code, en secondes */
  expiresIn: number;
  /** Délai avant de pouvoir redemander un code, en secondes */
  resendAvailable: number;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  token: string;
  password: string;
}

// --- Payloads AccountService ---

export interface UpdateAccountPayload {
  username: string;
  firstname?: string | null;
  lastname?: string | null;
}

/** Payload de PUT /account/profile */
export type UpdateProfilePayload = UpdateAccountPayload;

export interface ChangeEmailPayload {
  email: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

/** Réponse de POST /account/delete-request (même forme que la demande de code de connexion) */
export type AccountDeletionRequestResponse = LoginCodeRequestResponse;

/** Payload de DELETE /account : code de confirmation reçu par e-mail */
export interface DeleteAccountPayload {
  code: string;
}

// --- Payloads UserService (Administration) ---

export interface CreateUserPayload {
  email: string;
  username: string;
  password: string;
  role: UserRole;
  firstname?: string | null;
  lastname?: string | null;
  isVerified?: boolean;
  settings?: Partial<UserSettings>;
}

export interface UpdateUserPayload {
  email: string;
  username: string;
  password?: string | null;
  role: UserRole;
  firstname?: string | null;
  lastname?: string | null;
  isVerified?: boolean;
  settings?: Partial<UserSettings>;
}
