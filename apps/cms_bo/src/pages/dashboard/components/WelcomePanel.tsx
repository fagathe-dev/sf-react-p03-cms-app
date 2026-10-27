import { usePermissions } from '@/hooks/usePermissions';
import { Button, Card, Icon, Title } from '@/ui/components';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { IconName } from '../widgets/types';
import * as S from './Dashboard.styles';

const Header = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing[3]};
  margin-bottom: ${({ theme }) => theme.spacing[4]};
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: ${({ theme }) => theme.spacing[5]};

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
`;

const LinkList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[2]};
`;

const LinkItem = styled.li`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  font-size: ${({ theme }) => theme.typography.sizes.sm};
  color: ${({ theme }) => theme.colors.text.muted};
`;

interface WelcomeLink {
  label: string;
  to: string;
  icon: IconName;
}

interface WelcomePanelProps {
  onDismiss: () => void;
}

/**
 * Panneau de bienvenue (WordPress) : pour commencer, étapes suivantes, autres actions selon les droits
 */
export const WelcomePanel = ({ onDismiss }: WelcomePanelProps) => {
  const navigate = useNavigate();
  const { isModerator, isManager } = usePermissions();

  const nextSteps: WelcomeLink[] = [
    { label: 'Gérer les articles', to: '/posts', icon: 'file-document-multiple-outline' },
    { label: 'Organiser les catégories', to: '/categories', icon: 'folder-outline' },
    { label: 'Gérer les tags', to: '/tags', icon: 'tag-multiple-outline' },
  ];

  const otherActions: WelcomeLink[] = [
    ...(isModerator ? [{ label: 'Modérer les commentaires', to: '/moderation/comments', icon: 'comment-check-outline' }] : []),
    ...(isManager ? [{ label: 'Optimiser le référencement', to: '/seo', icon: 'search-web' }] : []),
    { label: 'Compléter mon profil', to: '/profile', icon: 'account-edit-outline' },
  ];

  const renderLinks = (links: WelcomeLink[]) => (
    <LinkList>
      {links.map((link) => (
        <LinkItem key={link.to}>
          <Icon name={link.icon} size={18} />
          <S.TextLink to={link.to}>{link.label}</S.TextLink>
        </LinkItem>
      ))}
    </LinkList>
  );

  return (
    <Card as="section" aria-labelledby="dashboard-welcome-title">
      <Card.Body>
        <Header>
          <Title as="h2" id="dashboard-welcome-title" style={{ margin: 0 }}>
            Bienvenue sur votre CMS
          </Title>
          <Button type="button" variant="ghost" size="sm" onClick={onDismiss}>
            <Icon name="close" size={16} />
            Ignorer
          </Button>
        </Header>

        <Grid>
          <div>
            <S.SectionTitle>Pour commencer</S.SectionTitle>
            <Button type="button" onClick={() => navigate('/posts/new')}>
              <Icon name="pencil-plus-outline" size={16} />
              Rédiger un article
            </Button>
          </div>
          <div>
            <S.SectionTitle>Étapes suivantes</S.SectionTitle>
            {renderLinks(nextSteps)}
          </div>
          <div>
            <S.SectionTitle>Autres actions</S.SectionTitle>
            {renderLinks(otherActions)}
          </div>
        </Grid>
      </Card.Body>
    </Card>
  );
};
