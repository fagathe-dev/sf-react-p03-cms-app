import { usePermissions } from '@/hooks/usePermissions';
import { Alert, BackButton, Lead, Loading, Title } from '@/ui/components';
import { useNavigate, useParams } from 'react-router-dom';
import { UserForm } from './components';
import * as S from './components/User.styles';
import { useUser } from './hooks';

export const UserEditPage = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { canManageUser } = usePermissions();
  const { user, isLoading, error } = useUser(userId);

  return (
    <S.FormWrapper>
      <div>
        <BackButton
          label="Retour à la fiche"
          onClick={() => navigate(userId ? `/users/${userId}` : '/users')}
        />
        <Title as="h1">Modifier le compte</Title>
        {user && <Lead style={{ marginBottom: 0 }}>{user.displayName ?? user.username}</Lead>}
      </div>

      {isLoading && (
        <S.CenteredState>
          <Loading size="lg" label="Chargement du compte…" />
        </S.CenteredState>
      )}

      {error && <Alert variant="danger">{error}</Alert>}

      {user &&
        (canManageUser(user) ? (
          <UserForm user={user} />
        ) : (
          <Alert variant="warning" title="Modification impossible">
            Votre rôle ne vous permet pas de modifier ce compte.
          </Alert>
        ))}
    </S.FormWrapper>
  );
};
