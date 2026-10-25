import { uploadPostThumbnail } from '@/services/media.api';
import { Alert, Button, Card, FileDropzone, Icon, Image } from '@/ui/components';
import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { PostMetaFormData } from '../../schemas';

interface PostThumbnailPanelProps {
  postId: string;
}

/**
 * Miniature de l'article : téléversée immédiatement (PostService::uploadThumbnail l'enregistre),
 * le retrait est appliqué au prochain enregistrement.
 */
export const PostThumbnailPanel = ({ postId }: PostThumbnailPanelProps) => {
  const { watch, setValue, resetField } = useFormContext<PostMetaFormData>();
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const thumbnail = watch('thumbnail');

  const handleFiles = async (files: File[]) => {
    const file = files[0];
    if (!file) return;

    setError(null);
    setIsUploading(true);
    try {
      const url = await uploadPostThumbnail(postId, file);
      // Déjà enregistrée côté API : nouvelle valeur de référence, pas une modification en attente
      resetField('thumbnail', { defaultValue: url });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'upload de la miniature");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card elevation="sm">
      <Card.Header>
        <Card.Title>Miniature</Card.Title>
      </Card.Header>
      <Card.Body>
        {error && (
          <div style={{ marginBottom: '1rem' }}>
            <Alert variant="danger" onClose={() => setError(null)}>
              {error}
            </Alert>
          </div>
        )}

        {thumbnail ? (
          <>
            <Image src={thumbnail} alt="Miniature de l'article" aspectRatio="16/9" fit="cover" radius="base" />
            <Button
              size="sm"
              variant="ghost"
              style={{ marginTop: '0.5rem' }}
              onClick={() => setValue('thumbnail', '', { shouldDirty: true })}
            >
              <Icon name="image-remove-outline" size={16} />
              Retirer la miniature
            </Button>
          </>
        ) : (
          <FileDropzone
            accept="image/png,image/jpeg,image/webp"
            label="Image de couverture"
            hint={isUploading ? 'Téléversement en cours…' : 'WebP, JPEG ou PNG — 10 Mo max, ratio 16:9 recommandé.'}
            maxSizeMb={10}
            disabled={isUploading}
            onFilesSelected={handleFiles}
          />
        )}
      </Card.Body>
    </Card>
  );
};
