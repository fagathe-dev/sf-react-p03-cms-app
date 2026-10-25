import { usePermissions } from '@/hooks/usePermissions';
import { Post } from '@/types';
import { Alert, Badge, Button, Card, ChoiceField, Icon, Text } from '@/ui/components';
import { formatDateTime, POST_STATUS_DISPLAY } from '@/utils';
import { useFormContext } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { EDITOR_STATUSES } from '../../constants';
import { PostMetaFormData } from '../../schemas';
import * as S from '../Post.styles';

interface PostPublishPanelProps {
  post: Post;
  isDirty: boolean;
  isSaving: boolean;
  onSave: () => void;
}

export const PostPublishPanel = ({ post, isDirty, isSaving, onSave }: PostPublishPanelProps) => {
  const { isGranted } = usePermissions();
  const navigate = useNavigate();
  const {
    register,
    formState: { errors },
  } = useFormContext<PostMetaFormData>();

  // Statuts autorisés pour le rôle courant ; le statut actuel reste toujours sélectionnable
  const statuses = EDITOR_STATUSES.filter((option) => isGranted(option.minRole)).map((option) => option.value);
  if (!statuses.includes(post.status)) statuses.unshift(post.status);

  const moderationNote = post.settings?.moderation_note;

  return (
    <Card elevation="sm">
      <Card.Header>
        <Card.Title>Publication</Card.Title>
      </Card.Header>
      <Card.Body>
        {post.status === 'rewriting' && moderationNote && (
          <div style={{ marginBottom: '1rem' }}>
            <Alert variant="warning" title="Réécriture demandée">
              {moderationNote}
            </Alert>
          </div>
        )}

        <ChoiceField label="Statut" error={errors.status?.message} {...register('status')}>
          {statuses.map((status) => (
            <option key={status} value={status}>
              {POST_STATUS_DISPLAY[status].label}
            </option>
          ))}
        </ChoiceField>

        {!isGranted('ROLE_EDITOR') && (
          <Text as="p" size="xs" style={{ marginTop: 0 }}>
            Passez l'article « En relecture » pour le soumettre à la modération avant publication.
          </Text>
        )}

        <S.MetaRow style={{ marginBottom: '1rem' }}>
          {isDirty ? (
            <Badge variant="warning" pill>
              Modifications non enregistrées
            </Badge>
          ) : (
            <Badge variant="success" pill>
              Enregistré
            </Badge>
          )}
          <Text size="xs" color="muted">
            {formatDateTime(post.updatedAt ?? post.createdAt)}
          </Text>
        </S.MetaRow>

        <Button fullWidth onClick={onSave} loading={isSaving} disabled={!isDirty && !isSaving}>
          <Icon name="content-save-outline" size={18} />
          Enregistrer
          <Text size="xs" style={{ opacity: 0.7, color: 'inherit' }}>
            (Ctrl+S)
          </Text>
        </Button>
      </Card.Body>
      <Card.Footer>
        <S.ActionsGroup style={{ width: '100%', justifyContent: 'space-between' }}>
          <Button size="sm" variant="ghost" onClick={() => navigate(`/posts/${post.id}`)}>
            <Icon name="eye-outline" size={16} />
            Aperçu
          </Button>
          <Button size="sm" variant="ghost" onClick={() => navigate(`/posts/${post.id}/seo`)}>
            <Icon name="search-web" size={16} />
            SEO
          </Button>
        </S.ActionsGroup>
      </Card.Footer>
    </Card>
  );
};
