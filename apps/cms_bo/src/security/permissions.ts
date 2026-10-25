// src/security/permissions.ts
import { Comment, Post, PostListItem, User, UserRole } from '@/types';

export const ROLE_HIERARCHY_RANKS: Record<UserRole, number> = {
  ROLE_USER: 1,
  ROLE_CONTRIBUTOR: 150,
  ROLE_EDITOR: 200,
  ROLE_MODERATOR: 250,
  ROLE_MANAGER: 500,
  ROLE_ADMIN: 750,
  ROLE_SUPER_ADMIN: 1000,
};

export const resolveUserRole = (user?: User | null): UserRole | null => {
  if (!user) return null;
  return user.role ?? user.roles?.[0] ?? 'ROLE_USER';
};

export const hasMinimumRole = (currentRole: UserRole | string | null | undefined, requiredRole: UserRole): boolean => {
  if (!currentRole) return false;
  const currentRank = ROLE_HIERARCHY_RANKS[currentRole as UserRole] ?? 0;
  const requiredRank = ROLE_HIERARCHY_RANKS[requiredRole] ?? Infinity;
  return currentRank >= requiredRank;
};

// --- Règles métier (Miroir des Voters Symfony) ---

export const canCreatePost = (user?: User | null): boolean => hasMinimumRole(resolveUserRole(user), 'ROLE_CONTRIBUTOR');

export const canEditPost = (user?: User | null, post?: Post | PostListItem | null): boolean => {
  if (!user || !post) return false;
  const role = resolveUserRole(user);

  if (hasMinimumRole(role, 'ROLE_MANAGER')) {
    return true;
  }

  return hasMinimumRole(role, 'ROLE_CONTRIBUTOR') && post.author?.id === user.id;
};

export const canReviewPost = (user?: User | null, post?: Post | PostListItem | null): boolean => {
  if (!user || !post) return false;
  const role = resolveUserRole(user);

  if (hasMinimumRole(role, 'ROLE_MANAGER')) {
    return true;
  }

  return hasMinimumRole(role, 'ROLE_MODERATOR') && post.author?.id !== user.id;
};

export const canDeletePost = (user?: User | null, post?: Post | PostListItem | null): boolean => {
  if (!user || !post) return false;
  const role = resolveUserRole(user);

  if (hasMinimumRole(role, 'ROLE_MODERATOR')) {
    return true;
  }

  return hasMinimumRole(role, 'ROLE_CONTRIBUTOR') && post.author?.id === user.id;
};

export const canManageComment = (user?: User | null, comment?: Comment | null): boolean => {
  if (!user || !comment) return false;
  const role = resolveUserRole(user);

  return comment.owner?.id === user.id || hasMinimumRole(role, 'ROLE_ADMIN');
};

export const canDeleteComment = (user?: User | null, comment?: Comment | null): boolean => {
  if (!user || !comment) return false;
  const role = resolveUserRole(user);

  return comment.owner?.id === user.id || hasMinimumRole(role, 'ROLE_MODERATOR');
};

export const canManageTargetUser = (operator?: User | null, target?: User | null): boolean => {
  if (!operator || !target) return false;
  const operatorRole = resolveUserRole(operator);

  if (operatorRole === 'ROLE_SUPER_ADMIN') {
    return true;
  }

  if (!hasMinimumRole(operatorRole, 'ROLE_MANAGER')) {
    return false;
  }

  // Ni Manager ni Admin ne gèrent les ROLE_USER du blog ou les ROLE_SUPER_ADMIN
  if (target.role === 'ROLE_USER' || target.role === 'ROLE_SUPER_ADMIN') {
    return false;
  }

  if (operatorRole === 'ROLE_ADMIN') {
    return true;
  }

  // ROLE_MANAGER ne peut pas gérer un ROLE_ADMIN
  return target.role !== 'ROLE_ADMIN';
};

/**
 * Miroir de UserService::getManageableRoles : rôles que l'opérateur peut consulter et attribuer
 */
const MANAGEABLE_ROLES: Partial<Record<UserRole, UserRole[]>> = {
  ROLE_SUPER_ADMIN: [
    'ROLE_USER',
    'ROLE_CONTRIBUTOR',
    'ROLE_EDITOR',
    'ROLE_MODERATOR',
    'ROLE_MANAGER',
    'ROLE_ADMIN',
    'ROLE_SUPER_ADMIN',
  ],
  ROLE_ADMIN: ['ROLE_CONTRIBUTOR', 'ROLE_EDITOR', 'ROLE_MODERATOR', 'ROLE_MANAGER', 'ROLE_ADMIN'],
  ROLE_MANAGER: ['ROLE_CONTRIBUTOR', 'ROLE_EDITOR', 'ROLE_MODERATOR', 'ROLE_MANAGER'],
};

export const getManageableRoles = (operator?: User | null): UserRole[] => {
  const role = resolveUserRole(operator);
  return role ? (MANAGEABLE_ROLES[role] ?? []) : [];
};

// UserVoter::DELETE : mêmes règles que la gestion, sans pouvoir se supprimer soi-même
export const canDeleteTargetUser = (operator?: User | null, target?: User | null): boolean =>
  canManageTargetUser(operator, target) && operator?.id !== target?.id;
