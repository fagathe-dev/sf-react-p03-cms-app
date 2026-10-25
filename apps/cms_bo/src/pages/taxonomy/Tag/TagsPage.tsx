import { Alert } from '@/ui/components';
import { useLocation, useSearchParams } from 'react-router-dom';
import { TagTable, TaxonomyPageHeader, TaxonomySearchBar } from '../components';
import * as S from '../components/Taxonomy.styles';

interface TagsLocationState {
  successMessage?: string;
}

export const TagsPage = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();

  const query = searchParams.get('q') ?? '';
  const successMessage = (location.state as TagsLocationState | null)?.successMessage;

  return (
    <S.PageWrapper>
      <TaxonomyPageHeader
        title="Tags"
        description="Mots-clés transverses permettant de relier les articles entre eux."
        createLabel="Nouveau tag"
        createTo="/tags/new"
      />

      {successMessage && <Alert variant="success">{successMessage}</Alert>}

      <TaxonomySearchBar placeholder="Rechercher un tag…" />

      <TagTable query={query} />
    </S.PageWrapper>
  );
};
