import { Alert } from '@/ui/components';
import { useLocation, useSearchParams } from 'react-router-dom';
import { CategoryTable, TaxonomyPageHeader, TaxonomySearchBar } from '../components';
import * as S from '../components/Taxonomy.styles';

interface CategoriesLocationState {
  successMessage?: string;
}

export const CategoriesPage = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();

  const query = searchParams.get('q') ?? '';
  const successMessage = (location.state as CategoriesLocationState | null)?.successMessage;

  return (
    <S.PageWrapper>
      <TaxonomyPageHeader
        title="Catégories"
        description="Grandes thématiques permettant de classer les articles du blog."
        createLabel="Nouvelle catégorie"
        createTo="/categories/new"
      />

      {successMessage && <Alert variant="success">{successMessage}</Alert>}

      <TaxonomySearchBar placeholder="Rechercher une catégorie…" />

      <CategoryTable query={query} />
    </S.PageWrapper>
  );
};
