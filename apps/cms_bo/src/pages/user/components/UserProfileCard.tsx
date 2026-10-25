import { User } from '@/types';
import { Avatar, Card, Divider, Text, Title } from '@/ui/components';
import { formatDateTime } from '@/utils';
import styled from 'styled-components';
import { ROLE_DESCRIPTIONS } from '../constants';
import * as S from './User.styles';
import { UserRoleBadge, UserVerifiedBadge } from './UserRoleBadge';

const DetailsList = styled.dl`
  display: grid;
  grid-template-columns: minmax(140px, max-content) minmax(0, 1fr);
  gap: ${({ theme }) => `${theme.spacing[2]} ${theme.spacing[5]}`};
  margin: 0;

  dt {
    color: ${({ theme }) => theme.colors.text.muted};
    font-size: ${({ theme }) => theme.typography.sizes.sm};
  }

  dd {
    margin: 0;
    color: ${({ theme }) => theme.colors.text.body};
    font-size: ${({ theme }) => theme.typography.sizes.sm};
    word-break: break-word;
  }
`;

interface UserProfileCardProps {
  user: User;
}

export const UserProfileCard = ({ user }: UserProfileCardProps) => {
  const name = user.displayName ?? user.username;
  const fullName = [user.firstname, user.lastname].filter(Boolean).join(' ');

  return (
    <Card elevation="sm">
      <Card.Body>
        <S.Identity>
          <Avatar src={user.avatar ?? undefined} name={name} size="lg" />
          <S.IdentityText>
            <Title as="h2" style={{ margin: 0 }}>
              {name}
            </Title>
            <Text size="sm" color="muted">
              @{user.username}
            </Text>
            <S.Identity style={{ marginTop: '0.5rem', gap: '0.5rem' }}>
              <UserRoleBadge role={user.role} />
              <UserVerifiedBadge isVerified={user.isVerified} />
            </S.Identity>
          </S.IdentityText>
        </S.Identity>

        <Text as="p" size="sm">
          {ROLE_DESCRIPTIONS[user.role]}
        </Text>

        <Divider margin="1rem 0" />

        <DetailsList>
          <dt>Adresse e-mail</dt>
          <dd>{user.email}</dd>

          <dt>Nom complet</dt>
          <dd>{fullName || '—'}</dd>

          <dt>E-mail vérifié le</dt>
          <dd>{formatDateTime(user.emailVerifiedAt)}</dd>

          <dt>Inscription</dt>
          <dd>{formatDateTime(user.createdAt)}</dd>

          <dt>Dernière modification</dt>
          <dd>{formatDateTime(user.updatedAt)}</dd>

          <dt>Identifiant</dt>
          <dd>
            <code>{user.id}</code>
          </dd>
        </DetailsList>
      </Card.Body>
    </Card>
  );
};
