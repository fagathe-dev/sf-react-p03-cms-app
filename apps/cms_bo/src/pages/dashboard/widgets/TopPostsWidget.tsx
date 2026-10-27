import { PostListItem } from '@/types';
import { Badge, Icon, SegmentedControl } from '@/ui/components';
import { useState } from 'react';
import styled from 'styled-components';
import * as S from '../components/Dashboard.styles';
import { formatNumber } from '../utils';
import { DashboardWidgetProps, IconName } from './types';

type Ranking = 'views' | 'likes';

interface RankingDefinition {
  label: string;
  icon: IconName;
  unit: (count: number) => string;
  select: (data: DashboardWidgetProps['data']) => PostListItem[];
  count: (post: PostListItem) => number;
}

/** Classements disponibles (ajouter un classement = ajouter une entrée) */
const RANKINGS: Record<Ranking, RankingDefinition> = {
  views: {
    label: 'Plus lus',
    icon: 'eye-outline',
    unit: (count) => (count >= 2 ? 'lectures' : 'lecture'),
    select: (data) => data.topViewedPosts,
    count: (post) => post.viewsCount,
  },
  likes: {
    label: 'Plus aimés',
    icon: 'heart-outline',
    unit: () => "j'aime",
    select: (data) => data.topLikedPosts,
    count: (post) => post.likesCount,
  },
};

const RANKING_OPTIONS = (Object.keys(RANKINGS) as Ranking[]).map((value) => ({ value, label: RANKINGS[value].label }));

const Ranks = styled.ol`
  list-style: none;
  margin: ${({ theme }) => `${theme.spacing[3]} 0 0`};
  padding: 0;
`;

const Rank = styled.li`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  padding: ${({ theme }) => `${theme.spacing[2]} 0`};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};

  &:last-child {
    border-bottom: none;
  }
`;

const Position = styled.span`
  flex-shrink: 0;
  min-width: 2ch;
  font-weight: ${({ theme }) => theme.typography.weights.bold};
  color: ${({ theme }) => theme.colors.text.muted};
`;

const RankTitle = styled.span`
  display: flex;
  flex: 1;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1.5]};
  min-width: 0;
  font-size: ${({ theme }) => theme.typography.sizes.sm};
`;

const Counter = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1]};
  flex-shrink: 0;
  font-size: ${({ theme }) => theme.typography.sizes.sm};
  color: ${({ theme }) => theme.colors.text.muted};
`;

/**
 * Palmarès des articles publiés : plus lus / plus aimés
 */
export const TopPostsWidget = ({ data }: DashboardWidgetProps) => {
  const [ranking, setRanking] = useState<Ranking>('views');
  const definition = RANKINGS[ranking];
  const posts = definition.select(data);

  return (
    <>
      <SegmentedControl
        aria-label="Classement des articles"
        size="sm"
        fullWidth
        options={RANKING_OPTIONS}
        value={ranking}
        onChange={setRanking}
      />

      {posts.length === 0 ? (
        <S.EmptyText>Aucun article publié pour le moment.</S.EmptyText>
      ) : (
        <Ranks aria-label={definition.label}>
          {posts.map((post, index) => {
            const count = definition.count(post);
            return (
              <Rank key={post.id}>
                <Position aria-hidden="true">#{index + 1}</Position>
                <RankTitle>
                  <S.TextLink to={`/posts/${post.id}/edit`}>{post.title}</S.TextLink>
                  {post.settings?.is_featured && (
                    <Badge variant="primary" pill>
                      À la une
                    </Badge>
                  )}
                </RankTitle>
                <Counter>
                  <Icon name={definition.icon} size={16} />
                  <span>
                    {formatNumber(count)}
                    <S.VisuallyHidden> {definition.unit(count)}</S.VisuallyHidden>
                  </span>
                </Counter>
              </Rank>
            );
          })}
        </Ranks>
      )}
    </>
  );
};
