import { PostStatus, UserRole } from '@/types';

export type PostListFilterValue = 'all' | Extract<PostStatus, 'draft' | 'review' | 'rewriting' | 'published'>;

export interface PostListFilter {
  value: PostListFilterValue;
  label: string;
  icon: string;
  /** Statut transmis à l'API (`undefined` = tous) */
  status?: PostStatus;
}

/**
 * Filtres de la liste principale (les archives et la corbeille ont leurs propres pages)
 */
export const POST_LIST_FILTERS: PostListFilter[] = [
  { value: 'all', label: 'Tous', icon: 'file-document-multiple-outline' },
  { value: 'draft', label: 'Brouillons', icon: 'file-document-edit-outline', status: 'draft' },
  { value: 'review', label: 'En relecture', icon: 'file-eye-outline', status: 'review' },
  { value: 'rewriting', label: 'À réécrire', icon: 'file-undo-outline', status: 'rewriting' },
  { value: 'published', label: 'Publiés', icon: 'check-decagram-outline', status: 'published' },
];

export const findPostListFilter = (value: string | null): PostListFilter =>
  POST_LIST_FILTERS.find((filter) => filter.value === value) ?? POST_LIST_FILTERS[0]!;

/**
 * Statuts que l'auteur peut choisir dans l'éditeur, selon son rôle.
 * Un contributeur soumet en relecture ; la publication et l'archivage sont réservés aux éditeurs et plus.
 * (`rewriting` est posé par la modération, `trash` passe par la corbeille.)
 */
export const EDITOR_STATUSES: { value: PostStatus; minRole: UserRole }[] = [
  { value: 'draft', minRole: 'ROLE_CONTRIBUTOR' },
  { value: 'review', minRole: 'ROLE_CONTRIBUTOR' },
  { value: 'published', minRole: 'ROLE_EDITOR' },
  { value: 'archived', minRole: 'ROLE_EDITOR' },
];

/** Post::TRASH_RETENTION_DAYS */
export const TRASH_RETENTION_DAYS = 30;

export const POSTS_PAGE_SIZE = 20;
