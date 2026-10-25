// src/hooks/usePermissions.ts
import {
  canCreatePost,
  canDeleteComment,
  canDeletePost,
  canDeleteTargetUser,
  canEditPost,
  canManageComment,
  canManageTargetUser,
  canReviewPost,
  getManageableRoles,
  hasMinimumRole,
  resolveUserRole,
} from '@/security/permissions';
import { useAuthStore } from '@/stores/auth.store';
import { Comment, Post, PostListItem, User, UserRole } from '@/types';
import { useCallback, useMemo } from 'react';

export const usePermissions = () => {
  const user = useAuthStore((state) => state.user);
  const role = useMemo(() => resolveUserRole(user), [user]);

  const manageableRoles = useMemo(() => getManageableRoles(user), [user]);

  const isGranted = useCallback((minRole: UserRole) => hasMinimumRole(role, minRole), [role]);

  return {
    user,
    role,
    isGranted,
    // Droits transverses par niveau de rôle
    isBackOfficeMember: isGranted('ROLE_CONTRIBUTOR'),
    isEditor: isGranted('ROLE_EDITOR'),
    isModerator: isGranted('ROLE_MODERATOR'),
    isManager: isGranted('ROLE_MANAGER'),
    isAdmin: isGranted('ROLE_ADMIN'),
    isSuperAdmin: isGranted('ROLE_SUPER_ADMIN'),
    canManageTaxonomies: isGranted('ROLE_MANAGER'),
    canManageSeo: isGranted('ROLE_MANAGER'),
    canManageSettings: isGranted('ROLE_ADMIN'),
    // Droits contextuels sur les entités (Voters)
    canCreatePost: () => canCreatePost(user),
    canEditPost: (post?: Post | PostListItem | null) => canEditPost(user, post),
    canReviewPost: (post?: Post | PostListItem | null) => canReviewPost(user, post),
    canDeletePost: (post?: Post | PostListItem | null) => canDeletePost(user, post),
    canEditComment: (comment?: Comment | null) => canManageComment(user, comment),
    canDeleteComment: (comment?: Comment | null) => canDeleteComment(user, comment),
    canManageUser: (target?: User | null) => canManageTargetUser(user, target),
    canDeleteUser: (target?: User | null) => canDeleteTargetUser(user, target),
    manageableRoles,
  };
};
