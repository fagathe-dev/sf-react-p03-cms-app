import { BackButton, Lead, Title } from '@/ui/components';
import { useNavigate } from 'react-router-dom';
import { CategoryForm } from '../components';
import * as S from '../components/Taxonomy.styles';

export const CategoryCreatePage = () => {
  const navigate = useNavigate();

  return (
    <S.FormWrapper>
      <div>
        <BackButton label="Retour aux catégories" onClick={() => navigate('/categories')} />
        <Title as="h1">Nouvelle catégorie</Title>
        <Lead style={{ marginBottom: 0 }}>Créez une thématique pour regrouper vos articles.</Lead>
      </div>

      <CategoryForm />
    </S.FormWrapper>
  );
};
