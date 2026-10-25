import { usePermissions } from '@/hooks/usePermissions';
import { Alert, BackButton, Button, Icon, Loading } from '@/ui/components';
import { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { DeleteUserButton, UserProfileCard } from './components';
import * as S from './components/User.styles';
import { useUser } from './hooks';

interface UserDetailsLocationState {
  successMessage?: string;
}

export const UserDetailsPage = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { canManageUser } = usePermissions();
  const { user, isLoading, error } = useUser(userId);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const successMessage = (location.state as UserDetailsLocationState | null)?.successMessage;

  return (
    <S.FormWrapper>
      <S.HeaderRow>
        <BackButton label="Retour à l'équipe" onClick={() => navigate('/users')} />

        {user && (
          <S.ActionsGroup style={{ gap: '0.5rem' }}>
            {canManageUser(user) && (
              <Button variant="outline" onClick={() => navigate(`/users/${user.id}/edit`)}>
                <Icon name="pencil-outline" size={18} />
                Modifier
              </Button>
            )}
            <DeleteUserButton
              user={user}
              appearance="button"
              onDeleted={(deleted) =>
                navigate('/users', {
                  replace: true,
                  state: { successMessage: `Le compte de ${deleted.displayName ?? deleted.username} a été supprimé.` },
                })
              }
              onError={setDeleteError}
            />
          </S.ActionsGroup>
        )}
      </S.HeaderRow>

      {successMessage && <Alert variant="success">{successMessage}</Alert>}

      {deleteError && (
        <Alert variant="danger" onClose={() => setDeleteError(null)}>
          {deleteError}
        </Alert>
      )}

      {isLoading && (
        <S.CenteredState>
          <Loading size="lg" label="Chargement du compte…" />
        </S.CenteredState>
      )}

      {error && <Alert variant="danger">{error}</Alert>}

      {user && <UserProfileCard user={user} />}
    </S.FormWrapper>
  );
};
