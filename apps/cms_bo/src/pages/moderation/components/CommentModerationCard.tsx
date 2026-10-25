import { deleteOwnComment, moderateComment } from '@/services/comment.api';
import { Comment, CommentStatus } from '@/types';
import { Alert, Avatar, Badge, Button, Card, ConfirmDialog, Icon, Text } from '@/ui/components';
import { COMMENT_STATUS_DISPLAY, formatDateTime } from '@/utils';
import { useState } from 'react';
import { FlagSummary } from './FlagSummary';
import * as S from './Moderation.styles';
import { ModerationDecision, ModerationNoteDialog } from './ModerationNoteDialog';

// ModerateCommentDto::$moderationNote — Assert\Length(max: 500)
const NOTE_MAX_LENGTH = 500;

type DialogDecision = Extract<CommentStatus, 'rejected' | 'spam'>;

const DIALOG_CONFIG: Record<DialogDecision, { title: string; description: string; confirmLabel: string }> = {
  rejected: {
    title: 'Rejeter le commentaire',
    description: "Le commentaire ne sera plus visible sur l'article.",
    confirmLabel: 'Rejeter',
  },
  spam: {
    title: 'Marquer comme spam',
    description: "Le commentaire sera masqué et classé comme indésirable.",
    confirmLabel: 'Marquer comme spam',
  },
};

interface CommentModerationCardProps {
  comment: Comment;
  onModerated: (comment: Comment) => void;
  onDeleted: (id: string) => void;
}

export const CommentModerationCard = ({ comment, onModerated, onDeleted }: CommentModerationCardProps) => {
  const [dialog, setDialog] = useState<DialogDecision | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const status = COMMENT_STATUS_DISPLAY[comment.status];
  const authorName = comment.owner.displayName ?? comment.owner.username;
  const moderationNote = comment.settings?.moderation_note;

  const moderate = async (newStatus: CommentStatus, decision?: ModerationDecision) => {
    setApiError(null);
    setIsSubmitting(true);
    try {
      const updated = await moderateComment(comment.id, {
        status: newStatus,
        moderationNote: decision?.moderationNote ?? null,
        resetFlags: decision?.resetFlags ?? false,
      });
      setDialog(null);
      onModerated(updated);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Erreur de modération');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setApiError(null);
    setIsSubmitting(true);
    try {
      await deleteOwnComment(comment.id);
      setConfirmDelete(false);
      onDeleted(comment.id);
    } catch (err) {
      setConfirmDelete(false);
      setApiError(err instanceof Error ? err.message : 'Erreur lors de la suppression');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card elevation="sm">
      <Card.Body>
        <S.MetaRow>
          <Avatar src={comment.owner.avatar ?? undefined} name={authorName} size="sm" />
          <Text weight="semibold">{authorName}</Text>
          <Text size="xs" color="muted">
            {formatDateTime(comment.createdAt)}
          </Text>
          <Badge variant={status.variant} pill>
            {status.label}
          </Badge>
          {comment.settings?.is_edited && (
            <Text size="xs" color="muted">
              (modifié)
            </Text>
          )}
        </S.MetaRow>

        <S.Quote>{comment.content}</S.Quote>

        <FlagSummary flags={comment.flags} flaggedBy={comment.settings?.flagged_by} />

        {moderationNote && <S.Note>Note de modération : {moderationNote}</S.Note>}

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
          <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(true)} disabled={isSubmitting}>
            <Icon name="trash-can-outline" size={16} />
            Supprimer
          </Button>
          {comment.status !== 'spam' && (
            <Button size="sm" variant="outline" onClick={() => setDialog('spam')} disabled={isSubmitting}>
              <Icon name="email-alert-outline" size={16} />
              Spam
            </Button>
          )}
          {comment.status !== 'rejected' && (
            <Button size="sm" variant="danger" onClick={() => setDialog('rejected')} disabled={isSubmitting}>
              <Icon name="close-circle-outline" size={16} />
              Rejeter
            </Button>
          )}
          {(comment.status !== 'approved' || comment.flags > 0) && (
            <Button size="sm" onClick={() => moderate('approved')} loading={isSubmitting && dialog === null}>
              <Icon name="check-circle-outline" size={16} />
              Approuver
            </Button>
          )}
        </S.Actions>
      </Card.Footer>

      {dialog && (
        <ModerationNoteDialog
          isOpen
          onClose={() => setDialog(null)}
          onConfirm={(decision) => moderate(dialog, decision)}
          title={DIALOG_CONFIG[dialog].title}
          description={DIALOG_CONFIG[dialog].description}
          confirmLabel={DIALOG_CONFIG[dialog].confirmLabel}
          confirmVariant="danger"
          noteMaxLength={NOTE_MAX_LENGTH}
          showResetFlags={comment.flags > 0}
          loading={isSubmitting}
        />
      )}

      <ConfirmDialog
        isOpen={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        title="Supprimer le commentaire"
        message={`Le commentaire de ${authorName} et ses réponses seront définitivement supprimés.`}
        confirmLabel="Supprimer"
        loading={isSubmitting}
      />
    </Card>
  );
};
