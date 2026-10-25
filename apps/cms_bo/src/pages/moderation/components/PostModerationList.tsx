import { fetchPostModerationQueue } from '@/services/post.api';
import { Post } from '@/types';
import { Alert, Card, EmptyState, Loading } from '@/ui/components';
import { useCallback } from 'react';
import { PostQueueFilterValue, QueueFilter } from '../constants';
import { useModerationQueue } from '../hooks';
import * as S from './Moderation.styles';
import { PostModerationCard } from './PostModerationCard';

const QUEUE_LIMIT = 100;

interface PostModerationListProps {
  filter: QueueFilter<PostQueueFilterValue, Post>;
}

export const PostModerationList = ({ filter }: PostModerationListProps) => {
  const loader = useCallback(() => fetchPostModerationQueue(filter.value === 'flagged', QUEUE_LIMIT), [filter.value]);
  const { items, isLoading, error, applyUpdate } = useModerationQueue(filter.value, loader);

  if (isLoading) {
    return (
      <S.CenteredState>
        <Loading size="lg" label="Chargement des articles…" />
      </S.CenteredState>
    );
  }

  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }

  if (items.length === 0) {
    return (
      <Card elevation="sm">
        <EmptyState icon="file-check-outline" title={filter.emptyTitle} description={filter.emptyDescription} />
      </Card>
    );
  }

  return (
    <S.List>
      {items.map((post) => (
        <PostModerationCard
          key={post.id}
          post={post}
          onReviewed={(updated) => applyUpdate(updated, filter.matches(updated))}
        />
      ))}
    </S.List>
  );
};
