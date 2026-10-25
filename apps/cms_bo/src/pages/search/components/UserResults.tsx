import { usePermissions } from '@/hooks/usePermissions';
import { ROLE_LABELS } from '@/layouts/AppLayout/sidebar_sections';
import { User } from '@/types';
import { Avatar, Badge, ListGroup, Text } from '@/ui/components';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { SearchResultSection } from './SearchResultSection';

const ItemContent = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
  width: 100%;
`;

const Identity = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
`;

interface UserResultsProps {
  users: User[];
}

export const UserResults = ({ users }: UserResultsProps) => {
  const { canManageUser } = usePermissions();
  const navigate = useNavigate();

  return (
    <SearchResultSection title="Utilisateurs" icon="account-group-outline" count={users.length}>
      <ListGroup>
        {users.map((user) => {
          const name = user.displayName ?? user.username;
          const canOpen = canManageUser(user);

          return (
            <ListGroup.Item
              key={user.id}
              action={canOpen}
              onClick={canOpen ? () => navigate(`/users/${user.id}`) : undefined}
            >
              <ItemContent>
                <Avatar src={user.avatar ?? undefined} name={name} size="sm" />
                <Identity>
                  <Text weight="semibold">{name}</Text>
                  <Text size="xs" color="muted">
                    @{user.username} · {user.email}
                  </Text>
                </Identity>
                <Badge variant="neutral" pill>
                  {ROLE_LABELS[user.role] ?? user.role}
                </Badge>
              </ItemContent>
            </ListGroup.Item>
          );
        })}
      </ListGroup>
    </SearchResultSection>
  );
};
