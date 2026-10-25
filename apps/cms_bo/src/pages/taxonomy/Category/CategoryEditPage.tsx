import { fetchCategoryById } from '@/services/category.api';
import { Alert, BackButton, Lead, Loading, Title } from '@/ui/components';
import { useNavigate, useParams } from 'react-router-dom';
import { CategoryForm } from '../components';
import * as S from '../components/Taxonomy.styles';
import { useTaxonomyItem } from '../hooks';

export const CategoryEditPage = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();
  const { item: category, isLoading, error } = useTaxonomyItem(fetchCategoryById, categoryId);

  return (
    <S.FormWrapper>
      <div>
        <BackButton label="Retour aux catégories" onClick={() => navigate('/categories')} />
        <Title as="h1">Modifier la catégorie</Title>
        {category && <Lead style={{ marginBottom: 0 }}>{category.name}</Lead>}
      </div>

      {isLoading && (
        <S.CenteredState>
          <Loading size="lg" label="Chargement de la catégorie…" />
        </S.CenteredState>
      )}

      {error && <Alert variant="danger">{error}</Alert>}

      {category && <CategoryForm category={category} />}
    </S.FormWrapper>
  );
};
