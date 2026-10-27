import { SeoAlertsSummary } from '@/types';
import { Badge, Icon } from '@/ui/components';
import styled from 'styled-components';
import * as S from '../components/Dashboard.styles';
import { formatCount } from '../utils';
import { DashboardWidgetProps, IconName } from './types';

interface SeoCheck {
  label: string;
  icon: IconName;
  failing: (alerts: SeoAlertsSummary) => number;
}

/** Contrôles affichés (ajouter un contrôle = ajouter une ligne) */
const SEO_CHECKS: SeoCheck[] = [
  { label: 'Miniature renseignée', icon: 'image-outline', failing: (alerts) => alerts.publishedWithoutThumbnail },
  { label: 'Extrait renseigné', icon: 'text-short', failing: (alerts) => alerts.publishedWithoutExcerpt },
  { label: 'Métadonnées SEO', icon: 'search-web', failing: (alerts) => alerts.publishedWithoutSeoMeta },
];

const Status = styled.div<{ $good: boolean }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  margin-bottom: ${({ theme }) => theme.spacing[3]};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  color: ${({ $good, theme }) => ($good ? theme.colors.success.dark : theme.colors.warning.dark)};
`;

const CheckRow = styled.li`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing[3]};
  padding: ${({ theme }) => `${theme.spacing[2.5]} 0`};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
  font-size: ${({ theme }) => theme.typography.sizes.sm};

  &:last-child {
    border-bottom: none;
  }
`;

const CheckLabel = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
`;

/**
 * Santé & couverture SEO (esprit « Santé du site » de WordPress) sur les articles publiés
 */
export const SeoHealthWidget = ({ data }: DashboardWidgetProps) => {
  const alerts = data.seoAlerts;
  if (!alerts) return null;

  const results = SEO_CHECKS.map((check) => ({ ...check, count: check.failing(alerts) }));
  const isGood = results.every((result) => result.count === 0);

  return (
    <>
      <Status $good={isGood} role="status">
        <Icon name={isGood ? 'check-circle-outline' : 'alert-outline'} size={20} />
        État général : {isGood ? 'Bon' : 'À améliorer'}
      </Status>

      <S.List>
        {results.map((result) => (
          <CheckRow key={result.label}>
            <CheckLabel>
              <Icon name={result.icon} size={18} />
              {result.label}
            </CheckLabel>
            {result.count === 0 ? (
              <Badge variant="success" pill>
                100 % conforme
              </Badge>
            ) : (
              <Badge variant="warning" pill>
                {formatCount(result.count, 'article')}
              </Badge>
            )}
          </CheckRow>
        ))}
      </S.List>

      <S.WidgetFooter>
        <S.TextLink to="/posts">Voir les articles</S.TextLink>
        <S.TextLink to="/seo">SEO & schémas JSON-LD</S.TextLink>
      </S.WidgetFooter>
    </>
  );
};
