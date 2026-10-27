import { Card, Icon, IconButton } from '@/ui/components';
import { ReactNode } from 'react';
import styled from 'styled-components';
import { IconName } from '../widgets/types';

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing[2]};
  padding: ${({ theme }) => `${theme.spacing[2.5]} ${theme.spacing[4]}`};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
`;

const Title = styled.h2`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  margin: 0;
  font-size: ${({ theme }) => theme.typography.sizes.base};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  color: ${({ theme }) => theme.colors.text.heading};
`;

const Controls = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[0.5]};
`;

const Content = styled.div`
  padding: ${({ theme }) => theme.spacing[4]};
`;

interface WidgetBoxProps {
  id: string;
  title: string;
  icon: IconName;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  children: ReactNode;
}

/**
 * Boîte de widget (« postbox » WordPress) : titre, réordonnancement par flèches (sans glisser-déposer) et repli
 */
export const WidgetBox = ({
  id,
  title,
  icon,
  isCollapsed,
  onToggleCollapse,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
  children,
}: WidgetBoxProps) => {
  const contentId = `dashboard-widget-${id}`;
  const titleId = `${contentId}-title`;

  return (
    <Card as="section" aria-labelledby={titleId}>
      <Header>
        <Title id={titleId}>
          <Icon name={icon} size={18} />
          {title}
        </Title>
        <Controls>
          <IconButton
            name="arrow-up"
            size="sm"
            aria-label={`Monter le bloc « ${title} »`}
            disabled={!canMoveUp}
            onClick={onMoveUp}
          />
          <IconButton
            name="arrow-down"
            size="sm"
            aria-label={`Descendre le bloc « ${title} »`}
            disabled={!canMoveDown}
            onClick={onMoveDown}
          />
          <IconButton
            name={isCollapsed ? 'chevron-down' : 'chevron-up'}
            size="sm"
            aria-label={isCollapsed ? `Déplier le bloc « ${title} »` : `Replier le bloc « ${title} »`}
            aria-expanded={!isCollapsed}
            aria-controls={contentId}
            onClick={onToggleCollapse}
          />
        </Controls>
      </Header>
      <Content id={contentId} hidden={isCollapsed}>
        {children}
      </Content>
    </Card>
  );
};
