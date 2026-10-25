import { ColorEnum } from '@/types';

export interface TaxonomyColorOption {
  value: ColorEnum;
  label: string;
  hex: string;
}

/**
 * Couleurs de Fagathe\CmsCore\Enum\ColorEnum avec leur rendu (teintes « 500 »)
 */
export const TAXONOMY_COLORS: TaxonomyColorOption[] = [
  { value: 'red', label: 'Rouge', hex: '#ef4444' },
  { value: 'orange', label: 'Orange', hex: '#f97316' },
  { value: 'yellow', label: 'Jaune', hex: '#eab308' },
  { value: 'green', label: 'Vert', hex: '#22c55e' },
  { value: 'blue', label: 'Bleu', hex: '#3b82f6' },
  { value: 'cyan', label: 'Cyan', hex: '#06b6d4' },
  { value: 'purple', label: 'Pourpre', hex: '#a855f7' },
  { value: 'violet', label: 'Violet', hex: '#8b5cf6' },
  { value: 'fuchsia', label: 'Fuchsia', hex: '#d946ef' },
  { value: 'pink', label: 'Rose', hex: '#ec4899' },
  { value: 'slate', label: 'Ardoise', hex: '#64748b' },
  { value: 'gray', label: 'Gris', hex: '#6b7280' },
  { value: 'stone', label: 'Pierre', hex: '#78716c' },
];

export const COLOR_VALUES = TAXONOMY_COLORS.map((color) => color.value) as [ColorEnum, ...ColorEnum[]];

export const getColorHex = (color?: string | null): string | undefined =>
  TAXONOMY_COLORS.find((option) => option.value === color)?.hex;
