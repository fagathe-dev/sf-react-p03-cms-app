import { usePermissions } from '@/hooks/usePermissions';
import { UserRole } from '@/types';
import { ChoiceField } from '@/ui/components';
import { useSearchParams } from 'react-router-dom';
import { ROLE_LABELS } from '../constants';

interface UserRoleFilterProps {
  value?: UserRole;
}

/**
 * Filtre par rôle synchronisé avec `?role=` (limité aux rôles que l'opérateur peut consulter)
 */
export const UserRoleFilter = ({ value }: UserRoleFilterProps) => {
  const { manageableRoles } = usePermissions();
  const [, setSearchParams] = useSearchParams();

  return (
    <div style={{ minWidth: 240 }}>
      <ChoiceField
        label="Rôle"
        value={value ?? ''}
        onChange={(e) => setSearchParams(e.target.value ? { role: e.target.value } : {}, { replace: true })}
      >
        <option value="">Tous les rôles</option>
        {manageableRoles.map((role) => (
          <option key={role} value={role}>
            {ROLE_LABELS[role]}
          </option>
        ))}
      </ChoiceField>
    </div>
  );
};
