import { SEARCH_MIN_LENGTH } from '@/services/search.api';
import { Alert, Card, EmptyState, Lead, Loading, Title } from '@/ui/components';
import { useSearchParams } from 'react-router-dom';
import styled from 'styled-components';
import { PostResults, TaxonomyResults, UserResults } from './components';
import { useGlobalSearch } from './hooks';

const PageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[5]};
`;

const CenteredState = styled.div`
  display: grid;
  place-items: center;
  padding: ${({ theme }) => theme.spacing[7]} 0;
`;

export const SearchPage = () => {
  const [searchParams] = useSearchParams();
  // Le terme est saisi dans la barre de recherche de l'en-tête (AppLayout) → /search?q=
  const query = (searchParams.get('q') ?? '').trim();
  const { data, isLoading, error, isSearchable } = useGlobalSearch(query);

  const total = data ? data.posts.length + data.categories.length + data.tags.length + data.users.length : 0;

  return (
    <PageWrapper>
      <div>
        <Title as="h1">Recherche</Title>
        {isSearchable && (
          <Lead style={{ marginBottom: 0 }}>
            {data ? `${total} résultat${total > 1 ? 's' : ''} pour « ${query} »` : `Recherche de « ${query} »…`}
          </Lead>
        )}
      </div>

      {!isSearchable && (
        <Card elevation="sm">
          <EmptyState
            icon="magnify"
            title="Lancez une recherche"
            description={`Saisissez au moins ${SEARCH_MIN_LENGTH} caractères dans la barre de recherche pour trouver un article, une catégorie, un tag ou un utilisateur.`}
          />
        </Card>
      )}

      {isLoading && (
        <CenteredState>
          <Loading size="lg" label="Recherche en cours…" />
        </CenteredState>
      )}

      {error && <Alert variant="danger">{error}</Alert>}

      {data && total === 0 && (
        <Card elevation="sm">
          <EmptyState
            icon="file-search-outline"
            title="Aucun résultat"
            description={`Aucun contenu ne correspond à « ${query} ». Essayez avec d'autres mots-clés.`}
          />
        </Card>
      )}

      {data && total > 0 && (
        <>
          <PostResults posts={data.posts} />
          <TaxonomyResults categories={data.categories} tags={data.tags} />
          <UserResults users={data.users} />
        </>
      )}
    </PageWrapper>
  );
};
