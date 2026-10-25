import { Button } from '@/ui/components/Base/Button';
import { Icon } from '@/ui/components/Base/Icon';
import { BaseComponentProps } from '@/ui/types';
import { useState } from 'react';
import styled from 'styled-components';
import { BlockTypeDefinition, DEFAULT_CMS_BLOCKS } from './blockDefaults';

export interface BlockPickerProps extends BaseComponentProps {
  onSelectBlock: (type: string) => void;
  availableBlocks?: BlockTypeDefinition[];
  /**
   * `button` (défaut) : bouton « Ajouter un bloc de contenu ».
   * `inline` : séparateur discret avec un « + », à placer entre deux blocs pour insérer à cet endroit.
   */
  variant?: 'button' | 'inline';
  /** Libellé accessible du « + » en variante `inline` */
  inlineLabel?: string;
}

const PickerContainer = styled.div<{ $inline: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: ${({ theme, $inline }) => ($inline ? `-${theme.spacing[2]} 0` : `${theme.spacing[3]} 0`)};
`;

const InlineTrigger = styled.div<{ $isOpen: boolean }>`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: ${({ theme }) => theme.spacing[6]};
  /* Discret entre les blocs, visible au survol ou au focus clavier */
  opacity: ${({ $isOpen }) => ($isOpen ? 1 : 0)};
  transition: opacity 0.15s ease;

  &:hover,
  &:focus-within {
    opacity: 1;
  }

  &::before {
    content: '';
    position: absolute;
    inset: 50% 0 auto;
    border-top: 1px dashed ${({ theme }) => theme.colors.primary.base};
  }
`;

const InlineButton = styled.button`
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: 1px solid ${({ theme }) => theme.colors.primary.base};
  border-radius: ${({ theme }) => theme.radii.full};
  background-color: ${({ theme }) => theme.colors.background.surface};
  color: ${({ theme }) => theme.colors.primary.base};
  cursor: pointer;

  &:hover {
    background-color: ${({ theme }) => theme.colors.primary.subtle};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.primary.base};
    outline-offset: 2px;
  }
`;

const GridMenu = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: ${({ theme }) => theme.spacing[2]};
  width: 100%;
  margin-top: ${({ theme }) => theme.spacing[2.5]};
  padding: ${({ theme }) => theme.spacing[3]};
  background-color: ${({ theme }) => theme.colors.background.surface};
  border: 1px solid ${({ theme }) => theme.colors.border.default};
  border-radius: ${({ theme }) => theme.radii.lg};
  box-shadow: ${({ theme }) => theme.shadows.base};
`;

const BlockOptionBtn = styled.button`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing[1.5]};
  padding: ${({ theme }) => theme.spacing[3]};
  background-color: ${({ theme }) => theme.colors.background.surfaceHover};
  border: 1px solid transparent;
  border-radius: ${({ theme }) => theme.radii.base};
  color: ${({ theme }) => theme.colors.text.body};
  font-family: inherit;
  font-size: ${({ theme }) => theme.typography.sizes.xs};
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary.base};
    background-color: ${({ theme }) => theme.colors.primary.subtle};
    color: ${({ theme }) => theme.colors.primary.dark};
  }
`;

const OptionDescription = styled.span`
  font-weight: ${({ theme }) => theme.typography.weights.regular};
  color: ${({ theme }) => theme.colors.text.muted};
  text-align: center;
`;

export const BlockPicker = ({
  onSelectBlock,
  availableBlocks = DEFAULT_CMS_BLOCKS,
  variant = 'button',
  inlineLabel = 'Insérer un bloc ici',
  ...rest
}: BlockPickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const isInline = variant === 'inline';

  return (
    <PickerContainer $inline={isInline} {...rest}>
      {isInline ? (
        <InlineTrigger $isOpen={isOpen}>
          <InlineButton
            type="button"
            aria-label={isOpen ? 'Fermer' : inlineLabel}
            aria-expanded={isOpen}
            title={isOpen ? 'Fermer' : inlineLabel}
            onClick={() => setIsOpen((prev) => !prev)}
          >
            <Icon name={isOpen ? 'close' : 'plus'} size={16} />
          </InlineButton>
        </InlineTrigger>
      ) : (
        <Button variant={isOpen ? 'secondary' : 'outline'} size="sm" onClick={() => setIsOpen((prev) => !prev)}>
          <Icon name={isOpen ? 'close' : 'plus'} size={16} />
          {isOpen ? 'Fermer' : 'Ajouter un bloc de contenu'}
        </Button>
      )}

      {isOpen && (
        <GridMenu>
          {availableBlocks.map((b) => (
            <BlockOptionBtn
              key={b.type}
              type="button"
              onClick={() => {
                onSelectBlock(b.type);
                setIsOpen(false);
              }}
            >
              <Icon name={b.icon} size={22} />
              <span>{b.label}</span>
              {b.description && <OptionDescription>{b.description}</OptionDescription>}
            </BlockOptionBtn>
          ))}
        </GridMenu>
      )}
    </PickerContainer>
  );
};
