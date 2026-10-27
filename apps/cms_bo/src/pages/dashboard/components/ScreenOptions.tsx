import { Card, CheckField } from '@/ui/components';
import styled from 'styled-components';

const Fieldset = styled.fieldset`
  margin: 0;
  padding: 0;
  border: none;
`;

const Legend = styled.legend`
  margin-bottom: ${({ theme }) => theme.spacing[2]};
  font-size: ${({ theme }) => theme.typography.sizes.sm};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  color: ${({ theme }) => theme.colors.text.heading};
`;

const Options = styled.div`
  display: flex;
  flex-wrap: wrap;
  column-gap: ${({ theme }) => theme.spacing[5]};
`;

export interface ScreenOption {
  id: string;
  label: string;
  checked: boolean;
}

interface ScreenOptionsProps {
  /** id du panneau, référencé par aria-controls du bouton « Options de l'écran » */
  id: string;
  options: ScreenOption[];
  onToggle: (id: string, checked: boolean) => void;
}

/**
 * Panneau « Options de l'écran » (WordPress) : une case par bloc ; décocher masque le bloc
 */
export const ScreenOptions = ({ id, options, onToggle }: ScreenOptionsProps) => (
  <Card id={id}>
    <Card.Body>
      <Fieldset>
        <Legend>Blocs affichés sur le tableau de bord</Legend>
        <Options>
          {options.map((option) => (
            <CheckField
              key={option.id}
              label={option.label}
              checked={option.checked}
              onChange={(event) => onToggle(option.id, event.target.checked)}
            />
          ))}
        </Options>
      </Fieldset>
    </Card.Body>
  </Card>
);
