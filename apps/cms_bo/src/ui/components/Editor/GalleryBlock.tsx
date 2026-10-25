import { IconButton } from '@/ui/components/Base/IconButton';
import { Image } from '@/ui/components/Embed/Image';
import { ChoiceField } from '@/ui/components/Forms/Fields/ChoiceField';
import { TextField } from '@/ui/components/Forms/Fields/TextField';
import { Flex } from '@/ui/components/Grid/Flex';
import { BaseComponentProps } from '@/ui/types';
import styled from 'styled-components';
import { createBlockItemId } from './blockItemId';
import { MediaSourceField, MediaUploadHandler } from './MediaSourceField';

export interface GalleryImageItem {
  id: string;
  url: string;
  alt?: string;
  caption?: string;
}

export interface GalleryBlockData {
  images: GalleryImageItem[];
  columns: number;
}

export interface GalleryBlockProps extends BaseComponentProps {
  data: GalleryBlockData;
  onChange: (updated: GalleryBlockData) => void;
  /** Téléversement réel des images ; sans lui, seule la saisie d'URL est proposée */
  onUpload?: MediaUploadHandler;
}

const Thumbnails = styled.div<{ $columns: number }>`
  display: grid;
  grid-template-columns: repeat(${({ $columns }) => $columns}, minmax(0, 1fr));
  gap: ${({ theme }) => theme.spacing[3]};
`;

const Tile = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[1]};

  & > button {
    position: absolute;
    top: ${({ theme }) => theme.spacing[1]};
    right: ${({ theme }) => theme.spacing[1]};
  }

  input {
    font-size: ${({ theme }) => theme.typography.sizes.xs};
  }
`;

export const GalleryBlock = ({ data, onChange, onUpload, ...rest }: GalleryBlockProps) => {
  const images = data.images || [];
  const columns = data.columns || 3;

  const addImages = (urls: string[]) =>
    onChange({ ...data, images: [...images, ...urls.map((url) => ({ id: createBlockItemId(), url, alt: '' }))] });

  const updateImage = (id: string, patch: Partial<GalleryImageItem>) =>
    onChange({ ...data, images: images.map((image) => (image.id === id ? { ...image, ...patch } : image)) });

  const removeImage = (id: string) => onChange({ ...data, images: images.filter((image) => image.id !== id) });

  return (
    <Flex direction="column" gap="1rem" {...rest}>
      {images.length > 0 && (
        <Thumbnails $columns={columns}>
          {images.map((image, idx) => (
            <Tile key={image.id}>
              <Image src={image.url} alt={image.alt || ''} aspectRatio="1/1" fit="cover" radius="base" />
              <IconButton
                name="close"
                size="sm"
                variant="danger"
                round
                aria-label={`Retirer l'image ${idx + 1}`}
                onClick={() => removeImage(image.id)}
              />
              <TextField
                aria-label={`Texte alternatif de l'image ${idx + 1}`}
                placeholder="Texte alternatif"
                value={image.alt || ''}
                onChange={(e) => updateImage(image.id, { alt: e.target.value })}
              />
            </Tile>
          ))}
        </Thumbnails>
      )}

      <ChoiceField
        label="Colonnes"
        value={columns}
        onChange={(e) => onChange({ ...data, columns: Number(e.target.value) })}
      >
        <option value={2}>2 colonnes</option>
        <option value={3}>3 colonnes</option>
        <option value={4}>4 colonnes</option>
      </ChoiceField>

      <MediaSourceField
        multiple
        accept="image/*"
        label="Ajouter des images à la galerie"
        urlLabel="Ou ajouter une image par URL"
        onUpload={onUpload}
        onSelect={addImages}
      />
    </Flex>
  );
};
