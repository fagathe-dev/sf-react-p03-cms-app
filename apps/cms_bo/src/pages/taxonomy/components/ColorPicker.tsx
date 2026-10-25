import { ColorEnum } from '@/types';
import { Icon, Label } from '@/ui/components';
import { HelperText } from '@/ui/components/Forms/HelperText';
import { useId } from 'react';
import styled from 'styled-components';
import { TAXONOMY_COLORS } from '../constants';

const Wrapper = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing[4]};
`;

const Swatches = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing[2]};
  margin-top: ${({ theme }) => theme.spacing[2]};
`;

const Swatch = styled.button<{ $hex?: string; $selected: boolean }>`
  display: inline-grid;
  place-items: center;
  width: 2rem;
  height: 2rem;
  padding: 0;
  border-radius: ${({ theme }) => theme.radii.full};
  border: 2px solid
    ${({ theme, $selected }) => ($selected ? theme.colors.text.heading : theme.colors.border.default)};
  background-color: ${({ theme, $hex }) => $hex ?? theme.colors.background.surface};
  color: ${({ theme, $hex }) => ($hex ? '#ffffff' : theme.colors.text.muted)};
  cursor: pointer;
  transition: transform 0.15s ease;

  &:hover {
    transform: scale(1.1);
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.primary.base};
    outline-offset: 2px;
  }
`;

interface ColorPickerProps {
  label: string;
  value: ColorEnum | null;
  onChange: (value: ColorEnum | null) => void;
  error?: string;
  hint?: string;
  allowNone?: boolean;
}

export const ColorPicker = ({ label, value, onChange, error, hint, allowNone = true }: ColorPickerProps) => {
  const labelId = useId();

  return (
    <Wrapper>
      <Label id={labelId}>{label}</Label>
      <Swatches role="radiogroup" aria-labelledby={labelId}>
        {allowNone && (
          <Swatch
            type="button"
            role="radio"
            aria-checked={value === null}
            aria-label="Aucune couleur"
            title="Aucune couleur"
            $selected={value === null}
            onClick={() => onChange(null)}
          >
            <Icon name="cancel" size={16} />
          </Swatch>
        )}

        {TAXONOMY_COLORS.map((color) => (
          <Swatch
            key={color.value}
            type="button"
            role="radio"
            aria-checked={value === color.value}
            aria-label={color.label}
            title={color.label}
            $hex={color.hex}
            $selected={value === color.value}
            onClick={() => onChange(color.value)}
          >
            {value === color.value && <Icon name="check" size={16} />}
          </Swatch>
        ))}
      </Swatches>
      {error ? <HelperText state="invalid">{error}</HelperText> : hint && <HelperText>{hint}</HelperText>}
    </Wrapper>
  );
};
