import { Icon } from '@/ui/components';
import styled from 'styled-components';

const Frame = styled.span<{ $size: number }>`
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: ${({ $size }) => `${$size}px`};
  height: ${({ $size }) => `${$size}px`};
  overflow: hidden;
  border-radius: ${({ theme }) => theme.radii.base};
  background-color: ${({ theme }) => theme.colors.background.surfaceHover};
  color: ${({ theme }) => theme.colors.text.muted};
`;

const Img = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

interface CategoryVisualProps {
  /** URL de l'image (absolue, ou blob: pour l'aperçu d'un fichier pas encore envoyé) */
  image?: string | null;
  /** Icône MDI affichée à défaut d'image */
  icon?: string | null;
  size?: number;
}

/**
 * Visuel d'une catégorie : son image, à défaut son icône, à défaut une icône de dossier
 */
export const CategoryVisual = ({ image, icon, size = 40 }: CategoryVisualProps) => (
  <Frame $size={size} aria-hidden="true">
    {image ? <Img src={image} alt="" loading="lazy" /> : <Icon name={icon || 'folder-outline'} size={Math.round(size * 0.55)} />}
  </Frame>
);
