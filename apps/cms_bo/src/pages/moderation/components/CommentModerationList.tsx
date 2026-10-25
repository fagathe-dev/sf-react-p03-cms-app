import { fetchModerationQueue } from '@/services/comment.api';
import { Comment } from '@/types';
import { Alert, Card, EmptyState, Loading } from '@/ui/components';
import { useCallback } from 'react';
import { COMMENT_FILTER_STATUS, CommentQueueFilterValue, QueueFilter } from '../constants';
import { useModerationQueue } from '../hooks';
import { CommentModerationCard } from './CommentModerationCard';
import * as S from './Moderation.styles';

const QUEUE_LIMIT = 100;

interface CommentModerationListProps {
  filter: QueueFilter<CommentQueueFilterValue, Comment>;
}

export const CommentModerationList = ({ filter }: CommentModerationListProps) => {
  const loader = useCallback(
    () => fetchModerationQueue(filter.value === 'flagged', COMMENT_FILTER_STATUS[filter.value], QUEUE_LIMIT),
    [filter.value]
  );
  const { items, isLoading, error, applyUpdate, removeItem } = useModerationQueue(filter.value, loader);

  if (isLoading) {
    return (
      <S.CenteredState>
        <Loading size="lg" label="Chargement des commentaires…" />
      </S.CenteredState>
    );
  }

  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }

  if (items.length === 0) {
    return (
      <Card elevation="sm">
        <EmptyState icon="comment-check-outline" title={filter.emptyTitle} description={filter.emptyDescription} />
      </Card>
    );
  }

  return (
    <S.List>
      {items.map((comment) => (
        <CommentModerationCard
          key={comment.id}
          comment={comment}
          onModerated={(updated) => applyUpdate(updated, filter.matches(updated))}
          onDeleted={removeItem}
        />
      ))}
    </S.List>
  );
};
