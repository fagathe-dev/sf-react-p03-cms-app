import { BackButton, Lead, Title } from '@/ui/components';
import { useNavigate } from 'react-router-dom';
import { UserForm } from './components';
import * as S from './components/User.styles';

export const UserCreatePage = () => {
  const navigate = useNavigate();

  return (
    <S.FormWrapper>
      <div>
        <BackButton label="Retour à l'équipe" onClick={() => navigate('/users')} />
        <Title as="h1">Ajouter un membre</Title>
        <Lead style={{ marginBottom: 0 }}>
          Créez un compte du back-office. Vous ne pouvez attribuer que les rôles que vous gérez.
        </Lead>
      </div>

      <UserForm />
    </S.FormWrapper>
  );
};
