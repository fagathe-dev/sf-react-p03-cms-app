import { DashboardKpis as DashboardKpisData } from '@/types';
import { Badge } from '@/ui/components';
import styled from 'styled-components';
import { formatCount, formatNumber } from '../utils';
import { KpiCard } from './KpiCard';

const Grid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: ${({ theme }) => theme.spacing[4]};

  @media (min-width: ${({ theme }) => theme.breakpoints.sm}) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (min-width: ${({ theme }) => theme.breakpoints.xl}) {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
`;

const Heading = styled.h2`
  margin: 0 0 ${({ theme }) => theme.spacing[3]};
  font-size: ${({ theme }) => theme.typography.sizes.base};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  color: ${({ theme }) => theme.colors.text.heading};
`;

interface DashboardKpisProps {
  kpis: DashboardKpisData;
}

/**
 * Bandeau « D'un coup d'œil » : articles, audience, engagement, actions & alertes
 */
export const DashboardKpis = ({ kpis }: DashboardKpisProps) => {
  const { posts, audience, comments, flaggedPostsCount } = kpis;
  const averageViews = posts.published > 0 ? Math.round(audience.totalViews / posts.published) : 0;
  const alerts = comments.pendingCount + comments.flaggedCount + posts.review + posts.rewriting + flaggedPostsCount;

  // Détail des actions en attente (les lignes à 0 sont omises)
  const alertDetails = [
    { count: comments.pendingCount, singular: 'commentaire en attente', plural: 'commentaires en attente' },
    { count: comments.flaggedCount, singular: 'commentaire signalé', plural: 'commentaires signalés' },
    { count: posts.review, singular: 'article en relecture', plural: 'articles en relecture' },
    { count: posts.rewriting, singular: 'article à réécrire', plural: 'articles à réécrire' },
    { count: flaggedPostsCount, singular: 'article signalé', plural: 'articles signalés' },
  ].filter((detail) => detail.count > 0);

  return (
    <section aria-labelledby="dashboard-kpis-title">
      <Heading id="dashboard-kpis-title">D'un coup d'œil</Heading>
      <Grid>
        <KpiCard label="Articles" icon="file-document-multiple-outline" value={formatNumber(posts.total)}>
          <Badge variant="success" pill>
            {formatCount(posts.published, 'publié')}
          </Badge>
          <Badge variant="neutral" pill>
            {formatCount(posts.draft, 'brouillon')}
          </Badge>
          <Badge variant="warning" pill>
            {formatCount(posts.review, 'en relecture', 'en relecture')}
          </Badge>
        </KpiCard>

        <KpiCard label="Audience & lectures" icon="eye-outline" value={formatNumber(audience.totalViews)}>
          <span>{formatCount(averageViews, 'lecture')} en moyenne par article publié</span>
        </KpiCard>

        <KpiCard label="Engagement" icon="heart-outline" value={formatCount(audience.totalLikes, "j'aime", "j'aime")}>
          <span>{formatCount(comments.totalApproved, 'commentaire approuvé', 'commentaires approuvés')}</span>
        </KpiCard>

        <KpiCard label="Actions & alertes" icon="bell-alert-outline" value={formatNumber(alerts)}>
          {alerts === 0 ? (
            <Badge variant="success" pill>
              Rien à signaler
            </Badge>
          ) : (
            alertDetails.map((detail) => (
              <span key={detail.singular}>{formatCount(detail.count, detail.singular, detail.plural)}</span>
            ))
          )}
        </KpiCard>
      </Grid>
    </section>
  );
};
