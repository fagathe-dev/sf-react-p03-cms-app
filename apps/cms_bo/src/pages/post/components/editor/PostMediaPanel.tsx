import { deletePostMedia } from '@/services/media.api';
import { PostMedia } from '@/types';
import { Alert, Card, ConfirmDialog, Icon, IconButton, Text, Tooltip } from '@/ui/components';
import { useState } from 'react';
import styled from 'styled-components';

const List = styled.ul`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[2]};
  margin: 0;
  padding: 0;
  list-style: none;
  max-height: 320px;
  overflow-y: auto;
`;

const Item = styled.li`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
`;

const Preview = styled.div`
  flex-shrink: 0;
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: ${({ theme }) => theme.radii.sm};
  overflow: hidden;
  background-color: ${({ theme }) => theme.colors.background.surfaceHover};
  color: ${({ theme }) => theme.colors.text.muted};

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const Name = styled.div`
  flex: 1;
  min-width: 0;

  span {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

const formatSize = (bytes: number) =>
  bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} Mo` : `${Math.max(1, Math.round(bytes / 1024))} Ko`;

const MEDIA_ICONS: Record<string, string> = {
  video: 'file-video-outline',
  audio: 'file-music-outline',
};

interface PostMediaPanelProps {
  postId: string;
  medias: PostMedia[];
  onDeleted: (mediaId: string) => void;
}

/**
 * Médiathèque de l'article : fichiers téléversés depuis les blocs (copie d'URL, suppression)
 */
export const PostMediaPanel = ({ postId, medias, onDeleted }: PostMediaPanelProps) => {
  const [toDelete, setToDelete] = useState<PostMedia | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyUrl = async (media: PostMedia) => {
    try {
      await navigator.clipboard.writeText(media.filePath);
      setCopiedId(media.id);
      window.setTimeout(() => setCopiedId((current) => (current === media.id ? null : current)), 1500);
    } catch {
      setError("Impossible de copier l'URL dans le presse-papiers.");
    }
  };

  const handleDelete = async () => {
    if (!toDelete) return;

    setIsDeleting(true);
    setError(null);
    try {
      await deletePostMedia(postId, toDelete.id);
      onDeleted(toDelete.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression du média');
    } finally {
      setIsDeleting(false);
      setToDelete(null);
    }
  };

  return (
    <Card elevation="sm">
      <Card.Header>
        <Card.Title>Médias ({medias.length})</Card.Title>
      </Card.Header>
      <Card.Body>
        {error && (
          <div style={{ marginBottom: '1rem' }}>
            <Alert variant="danger" onClose={() => setError(null)}>
              {error}
            </Alert>
          </div>
        )}

        {medias.length === 0 ? (
          <Text as="p" size="sm" style={{ margin: 0 }}>
            Les images et vidéos téléversées dans les blocs apparaîtront ici.
          </Text>
        ) : (
          <List>
            {medias.map((media) => (
              <Item key={media.id}>
                <Preview>
                  {media.type === 'image' ? (
                    <img src={media.filePath} alt={media.alt ?? ''} loading="lazy" />
                  ) : (
                    <Icon name={MEDIA_ICONS[media.type ?? ''] ?? 'file-outline'} size={20} />
                  )}
                </Preview>
                <Name>
                  <Text size="sm">{media.niceName || media.originalName}</Text>
                  <Text size="xs" color="muted">
                    {formatSize(media.size)}
                  </Text>
                </Name>
                <Tooltip content={copiedId === media.id ? 'Copiée !' : "Copier l'URL"}>
                  <IconButton
                    name={copiedId === media.id ? 'check' : 'content-copy'}
                    size="sm"
                    variant="ghost"
                    aria-label={`Copier l'URL de ${media.originalName}`}
                    onClick={() => copyUrl(media)}
                  />
                </Tooltip>
                <Tooltip content="Supprimer">
                  <IconButton
                    name="trash-can-outline"
                    size="sm"
                    variant="ghost"
                    aria-label={`Supprimer ${media.originalName}`}
                    onClick={() => setToDelete(media)}
                  />
                </Tooltip>
              </Item>
            ))}
          </List>
        )}
      </Card.Body>

      <ConfirmDialog
        isOpen={toDelete !== null}
        onClose={() => setToDelete(null)}
        onConfirm={handleDelete}
        title="Supprimer le média"
        message={`« ${toDelete?.originalName ?? ''} » sera supprimé du serveur. Les blocs qui l'utilisent afficheront une image cassée.`}
        confirmLabel="Supprimer"
        loading={isDeleting}
      />
    </Card>
  );
};
