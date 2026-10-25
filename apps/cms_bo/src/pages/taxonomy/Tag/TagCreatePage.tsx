import { BackButton, Lead, Title } from '@/ui/components';
import { useNavigate } from 'react-router-dom';
import { TagForm } from '../components';
import * as S from '../components/Taxonomy.styles';

export const TagCreatePage = () => {
  const navigate = useNavigate();

  return (
    <S.FormWrapper>
      <div>
        <BackButton label="Retour aux tags" onClick={() => navigate('/tags')} />
        <Title as="h1">Nouveau tag</Title>
        <Lead style={{ marginBottom: 0 }}>Ajoutez un mot-clé pour relier vos articles entre eux.</Lead>
      </div>

      <TagForm />
    </S.FormWrapper>
  );
};
