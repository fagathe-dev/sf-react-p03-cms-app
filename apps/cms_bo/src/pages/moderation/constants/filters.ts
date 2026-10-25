import { Comment, CommentStatus, Post } from '@/types';

export interface QueueFilter<TValue extends string, TItem> {
  value: TValue;
  label: string;
  icon: string;
  emptyTitle: string;
  emptyDescription: string;
  /** L'élément doit-il rester dans la file après une décision de modération ? */
  matches: (item: TItem) => boolean;
}

// --- Commentaires ---

export type CommentQueueFilterValue = 'flagged' | 'pending' | 'rejected' | 'spam' | 'all';

export const COMMENT_QUEUE_FILTERS: QueueFilter<CommentQueueFilterValue, Comment>[] = [
  {
    value: 'flagged',
    label: 'Signalés',
    icon: 'flag-outline',
    emptyTitle: 'Aucun commentaire signalé',
    emptyDescription: 'Les lecteurs n’ont signalé aucun commentaire pour le moment.',
    matches: (comment) => comment.flags > 0,
  },
  {
    value: 'pending',
    label: 'En attente',
    icon: 'clock-outline',
    emptyTitle: 'Aucun commentaire en attente',
    emptyDescription: 'Tous les commentaires ont été traités.',
    matches: (comment) => comment.status === 'pending',
  },
  {
    value: 'rejected',
    label: 'Rejetés',
    icon: 'close-circle-outline',
    emptyTitle: 'Aucun commentaire rejeté',
    emptyDescription: 'Aucun commentaire n’a été rejeté.',
    matches: (comment) => comment.status === 'rejected',
  },
  {
    value: 'spam',
    label: 'Spam',
    icon: 'email-alert-outline',
    emptyTitle: 'Aucun spam',
    emptyDescription: 'Aucun commentaire n’a été classé comme spam.',
    matches: (comment) => comment.status === 'spam',
  },
  {
    value: 'all',
    label: 'Tous',
    icon: 'comment-multiple-outline',
    emptyTitle: 'Aucun commentaire',
    emptyDescription: 'Aucun commentaire n’a encore été publié.',
    matches: () => true,
  },
];

/** Statut transmis à l'API pour un filtre (les signalements passent par ?flagged=true) */
export const COMMENT_FILTER_STATUS: Record<CommentQueueFilterValue, CommentStatus | undefined> = {
  flagged: undefined,
  pending: 'pending',
  rejected: 'rejected',
  spam: 'spam',
  all: undefined,
};

// --- Articles ---

export type PostQueueFilterValue = 'queue' | 'flagged';

export const POST_QUEUE_FILTERS: QueueFilter<PostQueueFilterValue, Post>[] = [
  {
    value: 'queue',
    label: 'À traiter',
    icon: 'file-eye-outline',
    emptyTitle: 'Aucun article à relire',
    emptyDescription: 'Aucun article n’est en relecture, à réécrire ou signalé.',
    matches: (post) => post.status === 'review' || post.status === 'rewriting' || post.flags > 0,
  },
  {
    value: 'flagged',
    label: 'Signalés',
    icon: 'flag-outline',
    emptyTitle: 'Aucun article signalé',
    emptyDescription: 'Les lecteurs n’ont signalé aucun article pour le moment.',
    matches: (post) => post.flags > 0,
  },
];

export const findFilter = <TValue extends string, TItem>(
  filters: QueueFilter<TValue, TItem>[],
  value: string | null
): QueueFilter<TValue, TItem> => filters.find((filter) => filter.value === value) ?? filters[0]!;
