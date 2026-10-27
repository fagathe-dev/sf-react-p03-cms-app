import { Button, FileDropzone, Label, Text } from '@/ui/components';
import { useEffect, useMemo } from 'react';
import styled from 'styled-components';
import { CategoryVisual } from './CategoryVisual';

/** Formats acceptés par UploadCategoryImageDto (pas de SVG : risque XSS) */
const ACCEPTED_TYPES = 'image/jpeg,image/png,image/webp,image/gif,image/bmp,image/tiff,image/x-icon';
const MAX_SIZE_MB = 5;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[2]};
  margin-bottom: ${({ theme }) => theme.spacing[4]};
`;

const PreviewRow = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing[3]};
`;

interface CategoryImageFieldProps {
  /** URL de l'image enregistrée (null si aucune) */
  currentImage: string | null;
  /** Fichier choisi, envoyé après l'enregistrement de la catégorie */
  file: File | null;
  /** Retrait demandé de l'image enregistrée */
  isRemoved: boolean;
  /** Icône de repli, affichée à défaut d'image */
  icon: string;
  onFileChange: (file: File | null) => void;
  onRemoveChange: (removed: boolean) => void;
}

/**
 * Image de la catégorie (upload) avec aperçu ; sans image, l'icône est affichée.
 * Le fichier n'est envoyé qu'à l'enregistrement du formulaire : l'URL blob: ne sert qu'à l'aperçu.
 */
export const CategoryImageField = ({
  currentImage,
  file,
  isRemoved,
  icon,
  onFileChange,
  onRemoveChange,
}: CategoryImageFieldProps) => {
  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);

  useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl]
  );

  const displayedImage = previewUrl ?? (isRemoved ? null : currentImage);

  return (
    <Field>
      <Label>Image</Label>
      <PreviewRow>
        <CategoryVisual image={displayedImage} icon={icon} size={72} />

        {file && (
          <Button type="button" variant="ghost" size="sm" onClick={() => onFileChange(null)}>
            Annuler le changement
          </Button>
        )}
        {!file && currentImage && !isRemoved && (
          <Button type="button" variant="ghost" size="sm" onClick={() => onRemoveChange(true)}>
            Retirer l'image
          </Button>
        )}
        {!file && currentImage && isRemoved && (
          <Button type="button" variant="ghost" size="sm" onClick={() => onRemoveChange(false)}>
            Conserver l'image
          </Button>
        )}
      </PreviewRow>

      <FileDropzone
        accept={ACCEPTED_TYPES}
        maxSizeMb={MAX_SIZE_MB}
        onFilesSelected={([selected]) => {
          if (!selected) return;
          onFileChange(selected);
          onRemoveChange(false);
        }}
      />
      <Text size="xs" color="muted">
        JPG, PNG, WEBP ou GIF, {MAX_SIZE_MB} Mo maximum. Sans image, l'icône ci-dessous est affichée.
      </Text>
    </Field>
  );
};
