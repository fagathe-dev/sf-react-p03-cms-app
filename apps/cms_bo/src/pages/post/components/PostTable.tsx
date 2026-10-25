import { usePermissions } from '@/hooks/usePermissions';
import { trashPost } from '@/services/post.api';
import { PostListItem, PostStatus } from '@/types';
import {
  Alert,
  Card,
  ConfirmDialog,
  EmptyState,
  Icon,
  IconButton,
  Loading,
  Pagination,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tooltip,
  TRow,
} from '@/ui/components';
import { formatDate } from '@/utils';
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { TRASH_RETENTION_DAYS } from '../constants';
import { usePostList } from '../hooks';
import * as S from './Post.styles';
import { PostStatusBadge } from './PostStatusBadge';

interface Feedback {
  variant: 'success' | 'danger';
  message: string;
}

interface PostTableProps {
  status?: PostStatus;
  query: string;
  page: number;
  excludeStatuses?: PostStatus[];
  emptyTitle: string;
  emptyDescription: string;
}

export const PostTable = ({ status, query, page, excludeStatuses, emptyTitle, emptyDescription }: PostTableProps) => {
  const { canEditPost, canDeletePost } = usePermissions();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { items, meta, isLoading, error, removeItem } = usePostList({ status, query, page, excludeStatuses });

  const [toTrash, setToTrash] = useState<PostListItem | null>(null);
  const [isTrashing, setIsTrashing] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const goToPage = (next: number) => {
    const params = new URLSearchParams(searchParams);
    if (next > 1) params.set('page', next.toString());
    else params.delete('page');
    setSearchParams(params);
  };

  const handleTrash = async () => {
    if (!toTrash) return;

    setIsTrashing(true);
    setFeedback(null);
    try {
      await trashPost(toTrash.id);
      removeItem(toTrash.id);
      setFeedback({ variant: 'success', message: `« ${toTrash.title} » a été déplacé dans la corbeille.` });
    } catch (err) {
      setFeedback({ variant: 'danger', message: err instanceof Error ? err.message : 'Erreur de mise à la corbeille' });
    } finally {
      setIsTrashing(false);
      setToTrash(null);
    }
  };

  if (isLoading) {
    return (
      <S.CenteredState>
        <Loading size="lg" label="Chargement des articles…" />
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
            icon="file-search-outline"
            title={query ? 'Aucun article trouvé' : emptyTitle}
            description={query ? `Aucun article ne correspond à « ${query} ».` : emptyDescription}
          />
        ) : (
          <Table hoverable>
            <Thead>
              <TRow>
                <Th>Article</Th>
                <Th>Statut</Th>
                <Th>Catégorie</Th>
                <Th>Auteur</Th>
                <Th align="right">Audience</Th>
                <Th>Date</Th>
                <Th align="right">Actions</Th>
              </TRow>
            </Thead>
            <Tbody>
              {items.map((post) => (
                <TRow key={post.id}>
                  <Td>
                    <S.TitleCell>
                      <S.Thumb>
                        {post.thumbnail ? (
                          <img src={post.thumbnail} alt="" loading="lazy" />
                        ) : (
                          <Icon name="image-off-outline" size={18} />
                        )}
                      </S.Thumb>
                      <div style={{ minWidth: 0 }}>
                        <Text weight="semibold">{post.title}</Text>
                        <Text as="p" size="xs" style={{ margin: 0 }}>
                          /{post.slug}
                        </Text>
                      </div>
                    </S.TitleCell>
                  </Td>
                  <Td>
                    <PostStatusBadge status={post.status} />
                  </Td>
                  <Td>
                    <Text size="sm">{post.category?.name ?? '—'}</Text>
                  </Td>
                  <Td>
                    <Text size="sm">{post.author ? (post.author.displayName ?? post.author.username) : '—'}</Text>
                  </Td>
                  <Td align="right">
                    <Text size="xs" color="muted">
                      <Icon name="eye-outline" size={14} /> {post.viewsCount} · <Icon name="heart-outline" size={14} />{' '}
                      {post.likesCount}
                    </Text>
                  </Td>
                  <Td>
                    <Text size="sm">{formatDate(post.publishedAt ?? post.createdAt)}</Text>
                  </Td>
                  <Td align="right" width={160}>
                    <S.ActionsGroup>
                      <Tooltip content="Aperçu">
                        <IconButton
                          name="eye-outline"
                          variant="ghost"
                          size="sm"
                          aria-label={`Aperçu de ${post.title}`}
                          onClick={() => navigate(`/posts/${post.id}`)}
                        />
                      </Tooltip>
                      {canEditPost(post) && (
                        <Tooltip content="Modifier">
                          <IconButton
                            name="pencil-outline"
                            variant="ghost"
                            size="sm"
                            aria-label={`Modifier ${post.title}`}
                            onClick={() => navigate(`/posts/${post.id}/edit`)}
                          />
                        </Tooltip>
                      )}
                      <Tooltip content="SEO">
                        <IconButton
                          name="search-web"
                          variant="ghost"
                          size="sm"
                          aria-label={`SEO de ${post.title}`}
                          onClick={() => navigate(`/posts/${post.id}/seo`)}
                        />
                      </Tooltip>
                      {canDeletePost(post) && (
                        <Tooltip content="Mettre à la corbeille">
                          <IconButton
                            name="trash-can-outline"
                            variant="ghost"
                            size="sm"
                            aria-label={`Mettre ${post.title} à la corbeille`}
                            onClick={() => setToTrash(post)}
                          />
                        </Tooltip>
                      )}
                    </S.ActionsGroup>
                  </Td>
                </TRow>
              ))}
            </Tbody>
          </Table>
        )}
      </Card>

      {meta && meta.pages > 1 && (
        <Pagination currentPage={meta.page} totalPages={meta.pages} onPageChange={goToPage} />
      )}

      <ConfirmDialog
        isOpen={toTrash !== null}
        onClose={() => setToTrash(null)}
        onConfirm={handleTrash}
        title="Mettre à la corbeille"
        message={`« ${toTrash?.title ?? ''} » sera retiré du site et conservé ${TRASH_RETENTION_DAYS} jours dans la corbeille avant suppression définitive.`}
        confirmLabel="Mettre à la corbeille"
        variant="warning"
        loading={isTrashing}
      />
    </>
  );
};
