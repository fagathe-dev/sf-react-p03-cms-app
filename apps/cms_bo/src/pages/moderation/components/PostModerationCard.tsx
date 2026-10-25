import { reviewPost } from '@/services/post.api';
import { Post, ReviewPostPayload } from '@/types';
import { Alert, Avatar, Badge, Button, Card, Icon, Text, Title } from '@/ui/components';
import { formatDateTime, POST_STATUS_DISPLAY } from '@/utils';
import { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { FlagSummary } from './FlagSummary';
import * as S from './Moderation.styles';
import { ModerationDecision, ModerationNoteDialog } from './ModerationNoteDialog';

// ReviewPostDto::$moderationNote — Assert\Length(max: 1000)
const NOTE_MAX_LENGTH = 1000;

type ReviewStatus = ReviewPostPayload['status'];

const DIALOG_CONFIG: Record<
  ReviewStatus,
  { title: string; description: string; confirmLabel: string; noteRequired: boolean; variant: 'primary' | 'danger' | 'secondary' }
> = {
  published: {
    title: "Publier l'article",
    description: "L'article sera mis en ligne et ses signalements seront remis à zéro.",
    confirmLabel: 'Publier',
    noteRequired: false,
    variant: 'primary',
  },
  rewriting: {
    title: 'Demander une réécriture',
    description: "L'article est renvoyé à son auteur. Expliquez ce qui doit être corrigé.",
    confirmLabel: 'Renvoyer en réécriture',
    noteRequired: true,
    variant: 'danger',
  },
  review: {
    title: 'Remettre en relecture',
    description: "L'article repasse dans la file de relecture.",
    confirmLabel: 'Remettre en relecture',
    noteRequired: false,
    variant: 'secondary',
  },
};

interface PostModerationCardProps {
  post: Post;
  onReviewed: (post: Post) => void;
}

export const PostModerationCard = ({ post, onReviewed }: PostModerationCardProps) => {
  const [dialog, setDialog] = useState<ReviewStatus | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const navigate = useNavigate();

  const status = POST_STATUS_DISPLAY[post.status];
  const authorName = post.author ? (post.author.displayName ?? post.author.username) : 'Auteur inconnu';
  const moderationNote = post.settings?.moderation_note;

  const handleReview = async (newStatus: ReviewStatus, decision: ModerationDecision) => {
    setApiError(null);
    setIsSubmitting(true);
    try {
      const updated = await reviewPost(post.id, { status: newStatus, ...decision });
      setDialog(null);
      onReviewed(updated);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Erreur de modération');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card elevation="sm">
      <Card.Body>
        <S.MetaRow>
          <Badge variant={status.variant} pill>
            {status.label}
          </Badge>
          {post.category && (
            <Badge variant="neutral" pill>
              {post.category.name}
            </Badge>
          )}
          <Text size="xs" color="muted">
            Créé le {formatDateTime(post.createdAt)}
          </Text>
        </S.MetaRow>

        <Title as="h4" style={{ margin: '0.75rem 0 0.25rem' }}>
          <RouterLink to={`/posts/${post.id}`} style={{ color: 'inherit' }}>
            {post.title}
          </RouterLink>
        </Title>

        <S.MetaRow>
          <Avatar src={post.author?.avatar ?? undefined} name={authorName} size="sm" />
          <Text size="sm">{authorName}</Text>
        </S.MetaRow>

        {post.excerpt && <S.Quote>{post.excerpt}</S.Quote>}

        <FlagSummary flags={post.flags} flaggedBy={post.settings?.flagged_by} />

        {moderationNote && <S.Note>Dernière note de modération : {moderationNote}</S.Note>}

        {apiError && (
          <div style={{ marginTop: '1rem' }}>
            <Alert variant="danger" onClose={() => setApiError(null)}>
              {apiError}
            </Alert>
          </div>
        )}
      </Card.Body>

      <Card.Footer>
        <S.Actions style={{ width: '100%' }}>
          <Button size="sm" variant="ghost" style={{ marginRight: 'auto' }} onClick={() => navigate(`/posts/${post.id}`)}>
            <Icon name="eye-outline" size={16} />
            Voir l'article
          </Button>
          {post.status !== 'review' && (
            <Button size="sm" variant="outline" onClick={() => setDialog('review')} disabled={isSubmitting}>
              <Icon name="file-eye-outline" size={16} />
              Remettre en relecture
            </Button>
          )}
          {post.status !== 'rewriting' && (
            <Button size="sm" variant="danger" onClick={() => setDialog('rewriting')} disabled={isSubmitting}>
              <Icon name="file-undo-outline" size={16} />
              Réécriture
            </Button>
          )}
          <Button size="sm" onClick={() => setDialog('published')} disabled={isSubmitting}>
            <Icon name="check-circle-outline" size={16} />
            {post.status === 'published' ? 'Maintenir la publication' : 'Publier'}
          </Button>
        </S.Actions>
      </Card.Footer>

      {dialog && (
        <ModerationNoteDialog
          isOpen
          onClose={() => setDialog(null)}
          onConfirm={(decision) => handleReview(dialog, decision)}
          title={DIALOG_CONFIG[dialog].title}
          description={DIALOG_CONFIG[dialog].description}
          confirmLabel={DIALOG_CONFIG[dialog].confirmLabel}
          confirmVariant={DIALOG_CONFIG[dialog].variant}
          noteMaxLength={NOTE_MAX_LENGTH}
          noteRequired={DIALOG_CONFIG[dialog].noteRequired}
          showResetFlags={post.flags > 0 && dialog !== 'published'}
          loading={isSubmitting}
        />
      )}
    </Card>
  );
};
