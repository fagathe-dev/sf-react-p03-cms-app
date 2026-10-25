import { Badge } from '@/ui/components/Base/Badge';
import { Icon } from '@/ui/components/Base/Icon';
import { IconButton } from '@/ui/components/Base/IconButton';
import { BaseComponentProps } from '@/ui/types';
import React from 'react';
import styled from 'styled-components';

export interface BlockWrapperProps extends BaseComponentProps {
  blockType: string;
  /** Libellé lisible du type (ex. « Citation ») ; à défaut, `blockType` en majuscules */
  blockLabel?: string;
  position: number;
  isFirst?: boolean;
  isLast?: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onDelete?: () => void;
  onOpenSettings?: () => void;
  /** Attributs et écouteurs de la poignée (ex. `{ ...attributes, ...listeners }` de `useSortable`) ; la poignée n'est affichée que s'ils sont fournis */
  dragHandleProps?: React.HTMLAttributes<HTMLSpanElement>;
  /** Ref de la poignée (ex. `setActivatorNodeRef` de `useSortable`) : rend le focus à la poignée après un déplacement au clavier */
  dragHandleRef?: React.Ref<HTMLSpanElement>;
  /** Bloc en cours de déplacement : mise en avant visuelle */
  isDragging?: boolean;
}

const Shell = styled.div<{ $isDragging?: boolean }>`
  position: relative;
  background-color: ${({ theme }) => theme.colors.background.surface};
  border: 1px solid ${({ theme }) => theme.colors.border.default};
  border-radius: ${({ theme }) => theme.radii.base};
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;

  &:hover,
  &:focus-within {
    border-color: ${({ theme }) => theme.colors.primary.base};
    box-shadow: ${({ theme }) => theme.shadows.sm};
  }

  ${({ $isDragging, theme }) =>
    $isDragging &&
    `
    border-color: ${theme.colors.primary.base};
    box-shadow: ${theme.shadows.lg};
    opacity: 0.95;
  `}
`;

const Toolbar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => `${theme.spacing[1.5]} ${theme.spacing[3]}`};
  background-color: ${({ theme }) => theme.colors.background.surfaceHover};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
  border-top-left-radius: inherit;
  border-top-right-radius: inherit;
`;

const LeftGroup = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
`;

const DragHandle = styled.span`
  display: inline-flex;
  color: ${({ theme }) => theme.colors.text.muted};
  border-radius: ${({ theme }) => theme.radii.sm};
  cursor: grab;
  /* Laisse le geste tactile au glisser-déposer plutôt qu'au défilement de la page */
  touch-action: none;

  &:hover {
    color: ${({ theme }) => theme.colors.text.body};
  }

  &:active {
    cursor: grabbing;
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.primary.base};
    outline-offset: 2px;
  }
`;

const RightActions = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1]};
`;

const Body = styled.div`
  padding: ${({ theme }) => theme.spacing[4]};
`;

export const BlockWrapper = ({
  blockType,
  blockLabel,
  position,
  isFirst = false,
  isLast = false,
  onMoveUp,
  onMoveDown,
  onDelete,
  onOpenSettings,
  dragHandleProps,
  dragHandleRef,
  isDragging = false,
  children,
  ...rest
}: BlockWrapperProps) => {
  return (
    <Shell $isDragging={isDragging} {...rest}>
      <Toolbar>
        <LeftGroup>
          {dragHandleProps && (
            <DragHandle ref={dragHandleRef} title="Glisser pour déplacer" {...dragHandleProps}>
              <Icon name="drag-vertical" size={18} />
            </DragHandle>
          )}
          <Badge variant="neutral">#{position}</Badge>
          <Badge variant="primary" pill>
            {blockLabel ?? blockType.toUpperCase()}
          </Badge>
        </LeftGroup>

        <RightActions>
          {onMoveUp && (
            <IconButton name="arrow-up" size="sm" aria-label="Monter le bloc" disabled={isFirst} onClick={onMoveUp} />
          )}
          {onMoveDown && (
            <IconButton
              name="arrow-down"
              size="sm"
              aria-label="Descendre le bloc"
              disabled={isLast}
              onClick={onMoveDown}
            />
          )}
          {onOpenSettings && (
            <IconButton name="cog-outline" size="sm" aria-label="Paramètres du bloc" onClick={onOpenSettings} />
          )}
          {onDelete && (
            <IconButton
              name="trash-can-outline"
              size="sm"
              variant="danger"
              aria-label="Supprimer le bloc"
              onClick={onDelete}
            />
          )}
        </RightActions>
      </Toolbar>
      <Body>{children}</Body>
    </Shell>
  );
};
