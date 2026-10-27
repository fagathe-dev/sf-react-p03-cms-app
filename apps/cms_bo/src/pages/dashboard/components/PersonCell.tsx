import { UserSummary } from '@/types';
import { Avatar } from '@/ui/components';
import styled from 'styled-components';
import { getDisplayName } from '../utils';

const Cell = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1.5]};
  min-width: 0;
`;

const Name = styled.span`
  overflow-wrap: anywhere;
`;

interface PersonCellProps {
  user: UserSummary | null | undefined;
  /** Texte affiché sous / après le nom (ex. « @username · e-mail ») */
  detail?: string;
}

/**
 * Avatar + nom affiché d'une personne (seul composant du dashboard qui utilise <Avatar>)
 */
export const PersonCell = ({ user, detail }: PersonCellProps) => {
  if (!user) return <Name>Auteur inconnu</Name>;

  const name = getDisplayName(user);

  return (
    <Cell>
      <Avatar src={user.avatar ?? undefined} name={name} size="sm" />
      <Name>
        {name}
        {detail && <> · {detail}</>}
      </Name>
    </Cell>
  );
};
