import { BackButton, Lead, Title } from '@/ui/components';
import { useNavigate } from 'react-router-dom';
import { PostCreateForm } from './components';
import * as S from './components/Post.styles';

export const PostCreatePage = () => {
  const navigate = useNavigate();

  return (
    <S.NarrowWrapper>
      <div>
        <BackButton label="Retour aux articles" onClick={() => navigate('/posts')} />
        <Title as="h1">Nouvel article</Title>
        <Lead style={{ marginBottom: 0 }}>
          Donnez un titre à votre brouillon : vous rédigerez ensuite son contenu bloc par bloc.
        </Lead>
      </div>

      <PostCreateForm />
    </S.NarrowWrapper>
  );
};
