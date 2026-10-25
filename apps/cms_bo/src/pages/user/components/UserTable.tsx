import { usePermissions } from '@/hooks/usePermissions';
import { UserRole } from '@/types';
import {
  Alert,
  Avatar,
  Button,
  Card,
  EmptyState,
  IconButton,
  Loading,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tooltip,
  TRow,
} from '@/ui/components';
import { formatDate } from '@/utils';
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useUserList } from '../hooks';
import { DeleteUserButton } from './DeleteUserButton';
import * as S from './User.styles';
import { UserRoleBadge, UserVerifiedBadge } from './UserRoleBadge';

interface Feedback {
  variant: 'success' | 'danger';
  message: string;
}

interface UserTableProps {
  page: number;
  role?: UserRole;
}

export const UserTable = ({ page, role }: UserTableProps) => {
  const { canManageUser, user: currentUser } = usePermissions();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { users, isLoading, error, hasNextPage, removeUser } = useUserList(page, role);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const goToPage = (next: number) => {
    const params = new URLSearchParams(searchParams);
    if (next > 1) params.set('page', next.toString());
    else params.delete('page');
    setSearchParams(params);
  };

  if (isLoading) {
    return (
      <S.CenteredState>
        <Loading size="lg" label="Chargement des membres…" />
      </S.CenteredState>
    );
  }

  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }

  return (
    <>
      {feedback && (
        <Alert variant={feedback.variant} onClose={() => setFeedback(null)}>
          {feedback.message}
        </Alert>
      )}

      <Card elevation="sm">
        {users.length === 0 ? (
          <EmptyState
            icon="account-search-outline"
            title="Aucun membre"
            description={
              page > 1 ? 'Cette page ne contient aucun membre.' : 'Aucun membre ne correspond à ce filtre.'
            }
          />
        ) : (
          <Table hoverable>
            <Thead>
              <TRow>
                <Th>Membre</Th>
                <Th>Rôle</Th>
                <Th>Statut</Th>
                <Th>Inscription</Th>
                <Th align="right">Actions</Th>
              </TRow>
            </Thead>
            <Tbody>
              {users.map((user) => {
                const name = user.displayName ?? user.username;
                const isSelf = user.id === currentUser?.id;

                return (
                  <TRow key={user.id}>
                    <Td>
                      <S.Identity>
                        <Avatar src={user.avatar ?? undefined} name={name} size="sm" />
                        <S.IdentityText>
                          <Text weight="semibold">
                            {name}
                            {isSelf && (
                              <Text size="xs" color="muted">
                                {' '}
                                (vous)
                              </Text>
                            )}
                          </Text>
                          <Text size="xs" color="muted">
                            {user.email}
                          </Text>
                        </S.IdentityText>
                      </S.Identity>
                    </Td>
                    <Td>
                      <UserRoleBadge role={user.role} />
                    </Td>
                    <Td>
                      <UserVerifiedBadge isVerified={user.isVerified} />
                    </Td>
                    <Td>
                      <Text size="sm">{formatDate(user.createdAt)}</Text>
                    </Td>
                    <Td align="right" width={140}>
                      <S.ActionsGroup>
                        <Tooltip content="Voir la fiche">
                          <IconButton
                            name="eye-outline"
                            variant="ghost"
                            size="sm"
                            aria-label={`Voir la fiche de ${name}`}
                            onClick={() => navigate(`/users/${user.id}`)}
                          />
                        </Tooltip>
                        {canManageUser(user) && (
                          <Tooltip content="Modifier">
                            <IconButton
                              name="pencil-outline"
                              variant="ghost"
                              size="sm"
                              aria-label={`Modifier le compte de ${name}`}
                              onClick={() => navigate(`/users/${user.id}/edit`)}
                            />
                          </Tooltip>
                        )}
                        <DeleteUserButton
                          user={user}
                          onDeleted={(deleted) => {
                            removeUser(deleted.id);
                            setFeedback({
                              variant: 'success',
                              message: `Le compte de ${deleted.displayName ?? deleted.username} a été supprimé.`,
                            });
                          }}
                          onError={(message) => setFeedback({ variant: 'danger', message })}
                        />
                      </S.ActionsGroup>
                    </Td>
                  </TRow>
                );
              })}
            </Tbody>
          </Table>
        )}
      </Card>

      {(page > 1 || hasNextPage) && (
        <S.Toolbar>
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => goToPage(page - 1)}>
            Page précédente
          </Button>
          <Text size="sm" color="muted">
            Page {page}
          </Text>
          <Button variant="outline" size="sm" disabled={!hasNextPage} onClick={() => goToPage(page + 1)}>
            Page suivante
          </Button>
        </S.Toolbar>
      )}
    </>
  );
};
