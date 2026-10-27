import { fetchSystemHealth } from '@/services/dashboard.api';
import { HealthCheckResponse, UserRole } from '@/types';
import { Alert, Badge, Divider, Loading } from '@/ui/components';
import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { PersonCell } from '../components';
import * as S from '../components/Dashboard.styles';
import { formatNumber, ROLE_LABELS, ROLE_ORDER } from '../utils';
import { DashboardWidgetProps } from './types';

const InfoGrid = styled.dl`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: ${({ theme }) => `${theme.spacing[1.5]} ${theme.spacing[3]}`};
  margin: 0;
  font-size: ${({ theme }) => theme.typography.sizes.sm};

  dt {
    color: ${({ theme }) => theme.colors.text.muted};
  }

  dd {
    margin: 0;
    overflow-wrap: anywhere;
  }
`;

const RoleBadges = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing[1.5]};
  margin-bottom: ${({ theme }) => theme.spacing[3]};
`;

interface HealthState {
  health: HealthCheckResponse | null;
  error: string | null;
}

/** État technique, chargé dans le widget (disponible pour les managers uniquement) */
const SystemHealth = () => {
  const [state, setState] = useState<HealthState | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetchSystemHealth()
      .then((health) => {
        if (!cancelled) setState({ health, error: null });
      })
      .catch((err) => {
        if (!cancelled) {
          setState({ health: null, error: err instanceof Error ? err.message : "État technique indisponible." });
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (state === null) return <Loading size="sm" label="Vérification de l'état technique…" />;
  if (state.error || !state.health) return <Alert variant="warning">{state.error}</Alert>;

  const { health } = state;
  const isOk = health.status === 'ok';
  const latency = health.checks.database.latency_ms;

  return (
    <InfoGrid>
      <dt>API</dt>
      <dd>
        <Badge variant={isOk ? 'success' : 'danger'} pill>
          {isOk ? 'OK' : 'Dégradé'}
        </Badge>
      </dd>
      <dt>Base de données</dt>
      <dd>{latency === null ? 'Indisponible' : `${formatNumber(latency)} ms`}</dd>
      <dt>Écriture /var</dt>
      <dd>{health.checks.storage.var_writable ? 'Autorisée' : 'Impossible'}</dd>
      <dt>PHP</dt>
      <dd>
        {health.system.php_version} · {health.system.environment}
      </dd>
      <dt>Mémoire</dt>
      <dd>{formatNumber(health.system.memory_usage_mb)} Mo</dd>
    </InfoGrid>
  );
};

/**
 * État technique de l'API et équipe (rôles, derniers inscrits)
 */
export const SystemTeamWidget = ({ data }: DashboardWidgetProps) => {
  const overview = data.usersOverview;
  if (!overview) return null;

  const roles = ROLE_ORDER.filter((role: UserRole) => (overview.byRole[role] ?? 0) > 0);

  return (
    <>
      <S.SectionTitle>État technique</S.SectionTitle>
      <SystemHealth />

      <Divider />

      <S.SectionTitle>Équipe</S.SectionTitle>
      <RoleBadges>
        {roles.map((role) => (
          <Badge key={role} variant="neutral" pill>
            {ROLE_LABELS[role]} : {formatNumber(overview.byRole[role])}
          </Badge>
        ))}
      </RoleBadges>

      {overview.recentUsers.length === 0 ? (
        <S.EmptyText>Aucun inscrit récent.</S.EmptyText>
      ) : (
        <S.List aria-label="Derniers inscrits">
          {overview.recentUsers.map((user) => (
            <S.ListItem key={user.id}>
              <S.MetaLine>
                <PersonCell user={user} detail={`@${user.username} · ${user.email}`} />
              </S.MetaLine>
            </S.ListItem>
          ))}
        </S.List>
      )}

      <S.WidgetFooter>
        <S.TextLink to="/users">Gérer l'équipe</S.TextLink>
      </S.WidgetFooter>
    </>
  );
};
