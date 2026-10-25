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
 * Réponse de POST /auth/login : le token JWT est toujours présent en cas de succès
 */
export interface AuthResponse {
  token: string;
  user: User;
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
 * Réponse générique ne contenant qu'un message (OTP, mot de passe oublié, réinitialisation…)
 */
export interface MessageResponse {
  message: string;
}

export interface VerifyOtpPayload {
  code: string;
}

export interface ResendOtpPayload {
  email: string;
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
