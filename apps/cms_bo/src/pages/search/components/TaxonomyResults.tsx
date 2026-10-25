import { usePermissions } from '@/hooks/usePermissions';
import { CategorySummary, TagSummary } from '@/types';
import { Badge } from '@/ui/components';
import { Link as RouterLink } from 'react-router-dom';
import styled from 'styled-components';
import { getColorHex } from '@/pages/taxonomy/constants';
import { SearchResultSection } from './SearchResultSection';

const Chips = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing[2]};
`;

const ChipLink = styled(RouterLink)`
  text-decoration: none;
`;

interface TaxonomyResultsProps {
  categories: CategorySummary[];
  tags: TagSummary[];
}

/**
 * Catégories et tags trouvés : édition directe pour les gestionnaires, sinon filtre de la liste
 */
export const TaxonomyResults = ({ categories, tags }: TaxonomyResultsProps) => {
  const { canManageTaxonomies } = usePermissions();

  const categoryLink = (category: CategorySummary) =>
    canManageTaxonomies ? `/categories/${category.id}/edit` : `/categories?q=${encodeURIComponent(category.name)}`;
  const tagLink = (tag: TagSummary) =>
    canManageTaxonomies ? `/tags/${tag.id}/edit` : `/tags?q=${encodeURIComponent(tag.name)}`;

  return (
    <>
      <SearchResultSection title="Catégories" icon="folder-outline" count={categories.length}>
        <Chips>
          {categories.map((category) => (
            <ChipLink key={category.id} to={categoryLink(category)} title={category.description ?? undefined}>
              <Badge variant="primary" pill>
                {category.name}
              </Badge>
            </ChipLink>
          ))}
        </Chips>
      </SearchResultSection>

      <SearchResultSection title="Tags" icon="tag-multiple-outline" count={tags.length}>
        <Chips>
          {tags.map((tag) => (
            <ChipLink key={tag.id} to={tagLink(tag)} title={tag.description ?? undefined}>
              <Badge variant="neutral" pill color={getColorHex(tag.color)}>
                {tag.name}
              </Badge>
            </ChipLink>
          ))}
        </Chips>
      </SearchResultSection>
    </>
  );
};
