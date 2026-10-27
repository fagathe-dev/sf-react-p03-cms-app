import { getColorHex } from '@/pages/taxonomy/constants';
import { UserRole } from '@/types';

export { ROLE_LABELS } from '@/layouts/AppLayout/sidebar_sections';
// Libellés et variantes de statut partagés avec le reste du back-office
export { COMMENT_STATUS_DISPLAY, POST_STATUS_DISPLAY } from '@/utils';

/** Ordre d'affichage des rôles (du plus élevé au plus bas) */
export const ROLE_ORDER: UserRole[] = [
  'ROLE_SUPER_ADMIN',
  'ROLE_ADMIN',
  'ROLE_MANAGER',
  'ROLE_MODERATOR',
  'ROLE_EDITOR',
  'ROLE_CONTRIBUTOR',
  'ROLE_USER',
];

/**
 * Couleur d'une catégorie / d'un tag (ColorEnum → teinte du domaine, voir pages/taxonomy/constants).
 * undefined : le composant retombe sur la couleur primaire du thème.
 */
export const resolveTaxonomyColor = (color: string | null | undefined): string | undefined => getColorHex(color);
