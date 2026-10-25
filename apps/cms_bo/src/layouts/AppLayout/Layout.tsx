// src/layouts/AppLayout/Layout.tsx
import { usePermissions } from '@/hooks/usePermissions';
import {
  Avatar,
  Badge,
  Container,
  Divider,
  Flex,
  Icon,
  Sidebar,
  SidebarFooter,
  SidebarHeader,
  SidebarItem,
  SidebarLink,
  SidebarNav,
  SidebarProvider,
  SidebarSection,
  SidebarToggle,
  ThemeModeSwitcher,
} from '@/ui/components';
import { Text } from '@/ui/components/Typo/Text';
import { FormEvent, Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  LayoutWrapper,
  MainColumn,
  MainViewport,
  SearchForm,
  SearchIconWrapper,
  SearchInput,
  TopHeader,
} from './AppLayout.styles';
import { NAV_SECTIONS, ROLE_LABELS } from './sidebar_sections';

export const AppLayout = () => {
  const { user, role, isGranted } = usePermissions();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('q') ?? '');

  // Synchronise le champ de recherche si l'URL change (ex: navigation arrière/avant)
  useEffect(() => {
    if (location.pathname === '/search') {
      setSearchQuery(searchParams.get('q') ?? '');
    }
  }, [location.pathname, searchParams]);

  // Filtre les sections et les liens accessibles selon les permissions de l'utilisateur
  const visibleSections = useMemo(() => {
    return NAV_SECTIONS.filter((section) => !section.minRole || isGranted(section.minRole)).map((section) => ({
      ...section,
      items: section.items.filter((item) => !item.minRole || isGranted(item.minRole)),
    }));
  }, [isGranted]);

  const handleSearchSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    if (trimmed.length >= 2) {
      navigate(`/search?q=${encodeURIComponent(trimmed)}`);
    }
  };

  const isRouteActive = useCallback(
    (to: string, exact?: boolean): boolean => {
      if (exact) {
        return location.pathname === to;
      }
      return location.pathname === to || location.pathname.startsWith(`${to}/`);
    },
    [location.pathname]
  );

  const displayName = user?.displayName ?? user?.username ?? 'Mon profil';
  const roleLabel = role ? (ROLE_LABELS[role] ?? role.replace('ROLE_', '')) : null;

  return (
    <SidebarProvider>
      <LayoutWrapper>
        {/* Barre latérale du Design System */}
        <Sidebar>
          <SidebarHeader>
            <Flex align="center" gap="0.625rem">
              <Icon name="feather" size={24} />
              <Text weight="bold" size="lg">
                CMS Admin
              </Text>
            </Flex>
          </SidebarHeader>

          <SidebarNav>
            {visibleSections.map((section) => (
              <Fragment key={section.title}>
                {/* SidebarSection est un intitulé de groupe : le titre est passé en enfant */}
                <SidebarSection>{section.title}</SidebarSection>
                {section.items.map((item) => {
                  const active = isRouteActive(item.to, item.exact);

                  return (
                    <SidebarItem key={item.label}>
                      <SidebarLink as={Link} to={item.to} active={active} icon={<Icon name={item.icon} size={18} />}>
                        {item.label}
                      </SidebarLink>
                    </SidebarItem>
                  );
                })}
              </Fragment>
            ))}
          </SidebarNav>

          <SidebarFooter>
            <Flex direction="column" gap="0.5rem">
              <SidebarLink
                as={Link}
                to="/profile"
                active={isRouteActive('/profile', true)}
                icon={<Avatar src={user?.avatar ?? undefined} name={displayName} size="sm" />}
              >
                {displayName}
              </SidebarLink>

              <Divider margin="0.25rem 0" />

              <SidebarLink as={Link} to="/logout" icon={<Icon name="logout" size={18} />}>
                Déconnexion
              </SidebarLink>
            </Flex>
          </SidebarFooter>
        </Sidebar>

        {/* Colonne principale : Header + Contenu */}
        <MainColumn>
          <TopHeader>
            <Flex align="center" gap="0.75rem" style={{ flex: 1 }}>
              <SidebarToggle aria-label="Ouvrir ou fermer le menu latéral" />

              <SearchForm onSubmit={handleSearchSubmit} role="search">
                <SearchIconWrapper>
                  <Icon name="magnify" size={18} />
                </SearchIconWrapper>
                <SearchInput
                  type="search"
                  aria-label="Rechercher dans le CMS"
                  placeholder="Rechercher un article, une catégorie, un tag…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </SearchForm>
            </Flex>

            <Flex align="center" gap="0.75rem">
              {roleLabel && (
                <Badge variant="neutral" pill>
                  {roleLabel}
                </Badge>
              )}
              <ThemeModeSwitcher size="sm" />
            </Flex>
          </TopHeader>

          <MainViewport>
            <Container fluid>
              <Outlet />
            </Container>
          </MainViewport>
        </MainColumn>
      </LayoutWrapper>
    </SidebarProvider>
  );
};
