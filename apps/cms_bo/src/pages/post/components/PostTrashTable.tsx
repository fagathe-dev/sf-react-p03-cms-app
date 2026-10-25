import { usePermissions } from '@/hooks/usePermissions';
import { deletePostPermanently, restorePost } from '@/services/post.api';
import { PostListItem } from '@/types';
import {
  Alert,
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  Icon,
  Loading,
  Pagination,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  TRow,
} from '@/ui/components';
import { formatDate } from '@/utils';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { TRASH_RETENTION_DAYS } from '../constants';
import { usePostList } from '../hooks';
import * as S from './Post.styles';

const DAY_MS = 24 * 60 * 60 * 1000;

const daysLeft = (trashedAt: string | null): number | null => {
  if (!trashedAt) return null;
  const elapsed = Math.floor((Date.now() - new Date(trashedAt).getTime()) / DAY_MS);
  return Math.max(0, TRASH_RETENTION_DAYS - elapsed);
};

interface Feedback {
  variant: 'success' | 'danger';
  message: string;
}

interface PostTrashTableProps {
  query: string;
  page: number;
}

export const PostTrashTable = ({ query, page }: PostTrashTableProps) => {
  const { canDeletePost } = usePermissions();
  const [searchParams, setSearchParams] = useSearchParams();
  const { items, meta, isLoading, error, removeItem } = usePostList({ status: 'trash', query, page });

  const [toDelete, setToDelete] = useState<PostListItem | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const goToPage = (next: number) => {
    const params = new URLSearchParams(searchParams);
    if (next > 1) params.set('page', next.toString());
    else params.delete('page');
    setSearchParams(params);
  };

  const handleRestore = async (post: PostListItem) => {
    setPendingId(post.id);
    setFeedback(null);
    try {
      await restorePost(post.id);
      removeItem(post.id);
      setFeedback({ variant: 'success', message: `« ${post.title} » a été restauré en brouillon.` });
    } catch (err) {
      setFeedback({ variant: 'danger', message: err instanceof Error ? err.message : 'Erreur de restauration' });
    } finally {
      setPendingId(null);
    }
  };

  const handleDelete = async () => {
    if (!toDelete) return;

    setPendingId(toDelete.id);
    setFeedback(null);
    try {
      await deletePostPermanently(toDelete.id);
      removeItem(toDelete.id);
      setFeedback({ variant: 'success', message: `« ${toDelete.title} » a été supprimé définitivement.` });
    } catch (err) {
      setFeedback({ variant: 'danger', message: err instanceof Error ? err.message : 'Erreur de suppression' });
    } finally {
      setPendingId(null);
      setToDelete(null);
    }
  };

  if (isLoading) {
    return (
      <S.CenteredState>
        <Loading size="lg" label="Chargement de la corbeille…" />
      </S.CenteredState>
    );
  }

  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }

  return (
    <>
      {feedback && (
        <Alert variant={feedback.variant} onClose={() => setFeedback(null)}>
          {feedback.message}
        </Alert>
      )}

      <Card elevation="sm">
        {items.length === 0 ? (
          <EmptyState
            icon="trash-can-outline"
            title={query ? 'Aucun article trouvé' : 'La corbeille est vide'}
            description={
              query
                ? `Aucun article de la corbeille ne correspond à « ${query} ».`
                : `Les articles supprimés sont conservés ${TRASH_RETENTION_DAYS} jours avant leur suppression définitive.`
            }
          />
        ) : (
          <Table hoverable>
            <Thead>
              <TRow>
                <Th>Article</Th>
                <Th>Auteur</Th>
                <Th>Supprimé le</Th>
                <Th>Purge</Th>
                <Th align="right">Actions</Th>
              </TRow>
            </Thead>
            <Tbody>
              {items.map((post) => {
                const remaining = daysLeft(post.trashedAt);
                const canDelete = canDeletePost(post);

                return (
                  <TRow key={post.id}>
                    <Td>
                      <Text weight="semibold">{post.title}</Text>
                    </Td>
                    <Td>
                      <Text size="sm">{post.author ? (post.author.displayName ?? post.author.username) : '—'}</Text>
                    </Td>
                    <Td>
                      <Text size="sm">{formatDate(post.trashedAt)}</Text>
                    </Td>
                    <Td>
                      {remaining !== null && (
                        <Badge variant={remaining <= 3 ? 'danger' : 'neutral'} pill>
                          {remaining === 0 ? 'Imminente' : `Dans ${remaining} j`}
                        </Badge>
                      )}
                    </Td>
                    <Td align="right" width={260}>
                      {canDelete && (
                        <S.ActionsGroup>
                          <Button
                            size="sm"
                            variant="outline"
                            loading={pendingId === post.id && toDelete === null}
                            disabled={pendingId !== null}
                            onClick={() => handleRestore(post)}
                          >
                            <Icon name="restore" size={16} />
                            Restaurer
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            disabled={pendingId !== null}
                            onClick={() => setToDelete(post)}
                          >
                            <Icon name="delete-forever-outline" size={16} />
                            Supprimer
                          </Button>
                        </S.ActionsGroup>
                      )}
                    </Td>
                  </TRow>
                );
              })}
            </Tbody>
          </Table>
        )}
      </Card>

      {meta && meta.pages > 1 && (
        <Pagination currentPage={meta.page} totalPages={meta.pages} onPageChange={goToPage} />
      )}

      <ConfirmDialog
        isOpen={toDelete !== null}
        onClose={() => setToDelete(null)}
        onConfirm={handleDelete}
        title="Supprimer définitivement"
        message={`« ${toDelete?.title ?? ''} », ses blocs et ses médias seront supprimés définitivement. Cette action est irréversible.`}
        confirmLabel="Supprimer définitivement"
        loading={pendingId !== null}
      />
    </>
  );
};
