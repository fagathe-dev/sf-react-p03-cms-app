import { UserRole } from '@/types';
import { Alert, Button, Icon, Lead, Title } from '@/ui/components';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { UserRoleFilter, UserTable } from './components';
import * as S from './components/User.styles';
import { ROLE_LABELS } from './constants';

interface UsersLocationState {
  successMessage?: string;
}

export const UsersPage = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  const roleParam = searchParams.get('role');
  const role = roleParam && roleParam in ROLE_LABELS ? (roleParam as UserRole) : undefined;
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const successMessage = (location.state as UsersLocationState | null)?.successMessage;

  return (
    <S.PageWrapper>
      <S.HeaderRow>
        <div>
          <Title as="h1">Équipe & comptes</Title>
          <Lead style={{ marginBottom: 0 }}>Gérez les membres du back-office et leurs rôles.</Lead>
        </div>
        <Button onClick={() => navigate('/users/new')}>
          <Icon name="account-plus-outline" size={18} />
          Ajouter un membre
        </Button>
      </S.HeaderRow>

      {successMessage && <Alert variant="success">{successMessage}</Alert>}

      <S.Toolbar>
        <UserRoleFilter value={role} />
      </S.Toolbar>

      <UserTable page={page} role={role} />
    </S.PageWrapper>
  );
};
