import { CategoryVisual } from '@/pages/taxonomy/components';
import { Divider } from '@/ui/components';
import styled from 'styled-components';
import * as S from '../components/Dashboard.styles';
import { formatCount, resolveTaxonomyColor } from '../utils';
import { DashboardWidgetProps } from './types';

const CategoryList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[3]};
`;

const CategoryItem = styled.li`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
`;

const CategoryBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[1]};
  min-width: 0;
  font-size: ${({ theme }) => theme.typography.sizes.sm};
`;

const Track = styled.div`
  height: 6px;
  overflow: hidden;
  border-radius: ${({ theme }) => theme.radii.full};
  background-color: ${({ theme }) => theme.colors.background.surfaceHover};
`;

const Bar = styled.div<{ $ratio: number; $color?: string }>`
  width: ${({ $ratio }) => `${Math.round($ratio * 100)}%`};
  height: 100%;
  border-radius: inherit;
  background-color: ${({ $color, theme }) => $color ?? theme.colors.primary.base};
`;

const Count = styled.span`
  font-size: ${({ theme }) => theme.typography.sizes.sm};
  color: ${({ theme }) => theme.colors.text.muted};
  white-space: nowrap;
`;

const TagCloud = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing[2]};
`;

const TagPill = styled.li<{ $color?: string }>`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1.5]};
  padding: ${({ theme }) => `${theme.spacing[1]} ${theme.spacing[2.5]}`};
  border: 1px solid ${({ theme }) => theme.colors.border.default};
  border-radius: ${({ theme }) => theme.radii.full};
  font-size: ${({ theme }) => theme.typography.sizes.xs};
  color: ${({ theme }) => theme.colors.text.body};

  &::before {
    content: '';
    width: 8px;
    height: 8px;
    border-radius: ${({ theme }) => theme.radii.full};
    background-color: ${({ $color, theme }) => $color ?? theme.colors.primary.base};
  }
`;

/**
 * Répartition des articles publiés par catégorie (barres proportionnelles) et nuage des tags populaires
 */
export const TaxonomyWidget = ({ data }: DashboardWidgetProps) => {
  const categories = data.categoriesDistribution;
  const maxCount = Math.max(1, ...categories.map((category) => category.postsCount));

  return (
    <>
      <S.SectionTitle>Catégories</S.SectionTitle>
      {categories.length === 0 ? (
        <S.EmptyText>Aucune catégorie pour le moment.</S.EmptyText>
      ) : (
        <CategoryList>
          {categories.map((category) => {
            const label = formatCount(category.postsCount, 'article publié', 'articles publiés');
            return (
              <CategoryItem key={category.id}>
                <CategoryVisual image={category.image} icon={category.icon} size={32} />
                <CategoryBody>
                  <span>{category.name}</span>
                  <Track
                    role="meter"
                    aria-label={`${category.name} : ${label}`}
                    aria-valuemin={0}
                    aria-valuemax={maxCount}
                    aria-valuenow={category.postsCount}
                  >
                    <Bar $ratio={category.postsCount / maxCount} $color={resolveTaxonomyColor(category.color)} />
                  </Track>
                </CategoryBody>
                <Count>{label}</Count>
              </CategoryItem>
            );
          })}
        </CategoryList>
      )}
      <S.WidgetFooter>
        <S.TextLink to="/categories">Gérer les catégories</S.TextLink>
      </S.WidgetFooter>

      <Divider />

      <S.SectionTitle>Tags populaires</S.SectionTitle>
      {data.popularTags.length === 0 ? (
        <S.EmptyText>Aucun tag utilisé par un article publié.</S.EmptyText>
      ) : (
        <TagCloud>
          {data.popularTags.map((tag) => (
            <TagPill key={tag.id} $color={resolveTaxonomyColor(tag.color)}>
              {tag.name} ({tag.postsCount})
            </TagPill>
          ))}
        </TagCloud>
      )}
      <S.WidgetFooter>
        <S.TextLink to="/tags">Gérer les tags</S.TextLink>
      </S.WidgetFooter>
    </>
  );
};
