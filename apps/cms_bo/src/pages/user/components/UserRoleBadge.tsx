import { UserRole } from '@/types';
import { Badge } from '@/ui/components';
import { ROLE_BADGE_VARIANTS, ROLE_LABELS } from '../constants';

interface UserRoleBadgeProps {
  role: UserRole;
}

export const UserRoleBadge = ({ role }: UserRoleBadgeProps) => (
  <Badge variant={ROLE_BADGE_VARIANTS[role] ?? 'neutral'} pill>
    {ROLE_LABELS[role] ?? role}
  </Badge>
);

interface UserVerifiedBadgeProps {
  isVerified: boolean;
}

export const UserVerifiedBadge = ({ isVerified }: UserVerifiedBadgeProps) => (
  <Badge variant={isVerified ? 'success' : 'warning'} pill>
    {isVerified ? 'Vérifié' : 'Non vérifié'}
  </Badge>
);
