import { fetchTagById } from '@/services/tag.api';
import { Alert, BackButton, Lead, Loading, Title } from '@/ui/components';
import { useNavigate, useParams } from 'react-router-dom';
import { TagForm } from '../components';
import * as S from '../components/Taxonomy.styles';
import { useTaxonomyItem } from '../hooks';

export const TagEditPage = () => {
  const { tagId } = useParams<{ tagId: string }>();
  const navigate = useNavigate();
  const { item: tag, isLoading, error } = useTaxonomyItem(fetchTagById, tagId);

  return (
    <S.FormWrapper>
      <div>
        <BackButton label="Retour aux tags" onClick={() => navigate('/tags')} />
        <Title as="h1">Modifier le tag</Title>
        {tag && <Lead style={{ marginBottom: 0 }}>{tag.name}</Lead>}
      </div>

      {isLoading && (
        <S.CenteredState>
          <Loading size="lg" label="Chargement du tag…" />
        </S.CenteredState>
      )}

      {error && <Alert variant="danger">{error}</Alert>}

      {tag && <TagForm tag={tag} />}
    </S.FormWrapper>
  );
};
