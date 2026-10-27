import { usePermissions } from '@/hooks/usePermissions';
import { Alert, Button, Icon, Loading, Text, Title } from '@/ui/components';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardKpis, ScreenOption, ScreenOptions, WelcomePanel, WidgetBox } from './components';
import * as S from './components/Dashboard.styles';
import { useDashboardData, useDashboardLayout } from './hooks';
import { getDisplayName } from './utils';
import { DASHBOARD_WIDGETS, DashboardColumn } from './widgets';

const SCREEN_OPTIONS_ID = 'dashboard-screen-options';
const WELCOME_OPTION_ID = 'welcome';
const COLUMNS: DashboardColumn[] = ['main', 'side'];

/**
 * Tableau de bord du back-office (page d'atterrissage après connexion), inspiré de wp-admin :
 * bienvenue, KPI, widgets réordonnables / repliables / masquables (préférences par utilisateur).
 */
export const DashboardPage = () => {
  const navigate = useNavigate();
  const { user } = usePermissions();
  const { data, isLoading, error, refreshError, retry, reload, dismissRefreshError } = useDashboardData();
  const layout = useDashboardLayout(user?.id);
  const [isScreenOptionsOpen, setIsScreenOptionsOpen] = useState(false);

  const displayName = getDisplayName(user);
  const availableWidgets = data ? DASHBOARD_WIDGETS.filter((widget) => widget.isAvailable(data)) : [];
  const showWelcome = !layout.prefs.welcomeDismissed;

  const screenOptions: ScreenOption[] = [
    { id: WELCOME_OPTION_ID, label: 'Bienvenue', checked: showWelcome },
    ...availableWidgets.map((widget) => ({ id: widget.id, label: widget.title, checked: !layout.isHidden(widget.id) })),
  ];

  const toggleScreenOption = (id: string, checked: boolean) => {
    if (id === WELCOME_OPTION_ID) layout.setWelcomeDismissed(!checked);
    else layout.setWidgetVisible(id, checked);
  };

  return (
    <S.PageWrapper>
      <S.HeaderRow>
        <div>
          <Title as="h1" style={{ margin: 0 }}>
            Tableau de bord
          </Title>
          <Text color="muted" size="sm">
            Bonjour {displayName || 'à vous'}, voici l'activité de votre blog.
          </Text>
        </div>
        <S.HeaderActions>
          <Button
            type="button"
            variant="outline"
            aria-expanded={isScreenOptionsOpen}
            aria-controls={SCREEN_OPTIONS_ID}
            disabled={!data}
            onClick={() => setIsScreenOptionsOpen((open) => !open)}
          >
            <Icon name="tune-variant" size={16} />
            Options de l'écran
          </Button>
          <Button type="button" onClick={() => navigate('/posts/new')}>
            <Icon name="plus" size={16} />
            Nouvel article
          </Button>
        </S.HeaderActions>
      </S.HeaderRow>

      {isScreenOptionsOpen && data && (
        <ScreenOptions id={SCREEN_OPTIONS_ID} options={screenOptions} onToggle={toggleScreenOption} />
      )}

      {isLoading && (
        <S.CenteredState>
          <Loading size="lg" label="Chargement du tableau de bord…" />
        </S.CenteredState>
      )}

      {!isLoading && error && (
        <Alert variant="danger" title="Tableau de bord indisponible">
          {error}{' '}
          <Button type="button" size="sm" variant="outline" onClick={retry}>
            Réessayer
          </Button>
        </Alert>
      )}

      {data && (
        <>
          {refreshError && (
            <Alert variant="warning" onClose={dismissRefreshError}>
              Les données n'ont pas pu être actualisées : {refreshError}
            </Alert>
          )}

          {showWelcome && <WelcomePanel onDismiss={() => layout.setWelcomeDismissed(true)} />}

          <DashboardKpis kpis={data.kpis} />

          <S.Columns>
            {COLUMNS.map((column) => {
              const widgets = layout.getColumnWidgets(availableWidgets, column);
              return (
                <S.Column key={column}>
                  {widgets.map(({ id, title, icon, Component }, index) => (
                    <WidgetBox
                      key={id}
                      id={id}
                      title={title}
                      icon={icon}
                      isCollapsed={layout.isCollapsed(id)}
                      onToggleCollapse={() => layout.setWidgetCollapsed(id, !layout.isCollapsed(id))}
                      canMoveUp={index > 0}
                      canMoveDown={index < widgets.length - 1}
                      onMoveUp={() => layout.moveWidget(widgets, column, id, -1)}
                      onMoveDown={() => layout.moveWidget(widgets, column, id, 1)}
                    >
                      <Component data={data} onDataChange={() => void reload()} />
                    </WidgetBox>
                  ))}
                </S.Column>
              );
            })}
          </S.Columns>
        </>
      )}
    </S.PageWrapper>
  );
};
