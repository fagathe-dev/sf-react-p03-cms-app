import { ROLE_LABELS } from '@/layouts/AppLayout/sidebar_sections';
import { UserRole } from '@/types';
import { BadgeVariant } from '@/ui/components';

export { ROLE_LABELS };

export const ROLE_BADGE_VARIANTS: Record<UserRole, BadgeVariant> = {
  ROLE_USER: 'neutral',
  ROLE_CONTRIBUTOR: 'secondary',
  ROLE_EDITOR: 'info',
  ROLE_MODERATOR: 'warning',
  ROLE_MANAGER: 'primary',
  ROLE_ADMIN: 'danger',
  ROLE_SUPER_ADMIN: 'danger',
};

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  ROLE_USER: 'Lecteur du blog : commente et réagit, sans accès au back-office.',
  ROLE_CONTRIBUTOR: 'Rédige ses propres articles et les soumet en relecture.',
  ROLE_EDITOR: 'Rédige et publie des articles.',
  ROLE_MODERATOR: 'Modère les commentaires et relit les articles soumis.',
  ROLE_MANAGER: 'Gère les taxonomies, le SEO et les membres de l’équipe.',
  ROLE_ADMIN: 'Administre le CMS, y compris les gestionnaires.',
  ROLE_SUPER_ADMIN: 'Administrateur technique : tous les droits.',
};

/** Nombre de membres chargés par page (l'API ne renvoie pas de total) */
export const USERS_PAGE_SIZE = 20;
