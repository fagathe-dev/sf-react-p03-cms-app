import { moderateComment } from '@/services/comment.api';
import { Comment, CommentStatus } from '@/types';
import { Alert, Badge, Button } from '@/ui/components';
import { formatDateTime } from '@/utils';
import { useState } from 'react';
import styled from 'styled-components';
import { PersonCell } from '../components';
import * as S from '../components/Dashboard.styles';
import { COMMENT_STATUS_DISPLAY, excerpt, formatCount } from '../utils';
import { DashboardWidgetProps } from './types';

const CommentText = styled.p`
  margin: ${({ theme }) => `${theme.spacing[1.5]} 0`};
  font-size: ${({ theme }) => theme.typography.sizes.sm};
  color: ${({ theme }) => theme.colors.text.body};
  overflow-wrap: anywhere;
`;

const RowActions = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing[2]};
`;

/** Actions de ligne (comme dans WordPress) : approuver lève aussi les signalements côté API */
const ACTIONS: { status: Extract<CommentStatus, 'approved' | 'rejected'>; label: string; variant: 'outline' | 'ghost' }[] = [
  { status: 'approved', label: 'Approuver', variant: 'outline' },
  { status: 'rejected', label: 'Rejeter', variant: 'ghost' },
];

const StatusBadge = ({ comment }: { comment: Comment }) =>
  comment.flags > 0 ? (
    <Badge variant="danger" pill>
      {formatCount(comment.flags, 'signalement')}
    </Badge>
  ) : (
    <Badge variant={COMMENT_STATUS_DISPLAY[comment.status].variant} pill>
      {COMMENT_STATUS_DISPLAY[comment.status].label}
    </Badge>
  );

/**
 * Modération rapide : commentaires en attente ou signalés, avec actions Approuver / Rejeter
 */
export const ModerationQueueWidget = ({ data, onDataChange }: DashboardWidgetProps) => {
  const comments = data.moderationQueue ?? [];
  // Action en cours : tous les boutons sont désactivés, seul celui cliqué affiche le chargement
  const [pending, setPending] = useState<{ id: string; status: CommentStatus } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const moderate = async (comment: Comment, status: CommentStatus) => {
    setPending({ id: comment.id, status });
    setError(null);
    try {
      await moderateComment(comment.id, { status });
      onDataChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la modération du commentaire.');
    } finally {
      setPending(null);
    }
  };

  return (
    <>
      {error && (
        <Alert variant="danger" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {comments.length === 0 ? (
        <S.EmptyText>Aucun commentaire à modérer. Tout est à jour !</S.EmptyText>
      ) : (
        <S.List>
          {comments.map((comment) => {
            const postTitle = comment.postSummary?.title ?? 'article supprimé';
            return (
              <S.ListItem key={comment.id}>
                <S.MetaLine>
                  <PersonCell user={comment.owner} />
                  <span>
                    sur «{' '}
                    {comment.postSummary ? (
                      <S.TextLink to={`/posts/${comment.postSummary.id}`}>{postTitle}</S.TextLink>
                    ) : (
                      postTitle
                    )}{' '}
                    »
                  </span>
                  <span>· {formatDateTime(comment.createdAt)}</span>
                  <StatusBadge comment={comment} />
                </S.MetaLine>
                <CommentText>{excerpt(comment.content)}</CommentText>
                <RowActions>
                  {ACTIONS.map((action) => (
                    <Button
                      key={action.status}
                      type="button"
                      size="sm"
                      variant={action.variant}
                      disabled={pending !== null}
                      loading={pending?.id === comment.id && pending.status === action.status}
                      aria-label={`${action.label} le commentaire de ${comment.owner.username} sur « ${postTitle} »`}
                      onClick={() => void moderate(comment, action.status)}
                    >
                      {action.label}
                    </Button>
                  ))}
                </RowActions>
              </S.ListItem>
            );
          })}
        </S.List>
      )}

      <S.WidgetFooter>
        <S.TextLink to="/moderation/comments">Tous les commentaires à modérer</S.TextLink>
      </S.WidgetFooter>
    </>
  );
};
