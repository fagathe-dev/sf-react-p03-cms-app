import type { CommentStatus, FlagReason, PostStatus } from '@/types';
import type { BadgeVariant } from '@/ui/components/Base/Badge';

export interface StatusDisplay {
  label: string;
  variant: BadgeVariant;
}

/**
 * Libellés et variantes de badge des statuts d'article (Fagathe\CmsCore\Enum\Post\PostStatus)
 */
export const POST_STATUS_DISPLAY: Record<PostStatus, StatusDisplay> = {
  draft: { label: 'Brouillon', variant: 'neutral' },
  review: { label: 'En relecture', variant: 'info' },
  rewriting: { label: 'À réécrire', variant: 'warning' },
  published: { label: 'Publié', variant: 'success' },
  archived: { label: 'Archivé', variant: 'secondary' },
  trash: { label: 'Corbeille', variant: 'danger' },
};

/**
 * Libellés et variantes de badge des statuts de commentaire (Fagathe\CmsCore\Enum\CommentStatus)
 */
export const COMMENT_STATUS_DISPLAY: Record<CommentStatus, StatusDisplay> = {
  pending: { label: 'En attente', variant: 'warning' },
  approved: { label: 'Approuvé', variant: 'success' },
  rejected: { label: 'Rejeté', variant: 'danger' },
  spam: { label: 'Spam', variant: 'neutral' },
};

/**
 * Libellés des motifs de signalement (Fagathe\CmsCore\Enum\Post\FlagReason)
 */
export const FLAG_REASON_LABELS: Record<FlagReason, string> = {
  spam: 'Spam',
  inappropriate: 'Contenu inapproprié',
  harassment: 'Harcèlement',
  misinformation: 'Désinformation',
  copyright: "Droit d'auteur",
  other: 'Autre',
};

export const getFlagReasonLabel = (reason: string): string =>
  FLAG_REASON_LABELS[reason as FlagReason] ?? reason;
