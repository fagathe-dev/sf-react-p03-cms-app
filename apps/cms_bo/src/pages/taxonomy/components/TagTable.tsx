import { usePermissions } from '@/hooks/usePermissions';
import { deleteTag, fetchTags } from '@/services/tag.api';
import { TagSummary } from '@/types';
import {
  Alert,
  Badge,
  Card,
  ConfirmDialog,
  EmptyState,
  IconButton,
  Loading,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tooltip,
  TRow,
} from '@/ui/components';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getColorHex } from '../constants';
import { useTaxonomyList } from '../hooks';
import * as S from './Taxonomy.styles';

interface TagTableProps {
  query: string;
}

interface DeleteFeedback {
  variant: 'success' | 'danger';
  message: string;
}

export const TagTable = ({ query }: TagTableProps) => {
  const { canManageTaxonomies } = usePermissions();
  const navigate = useNavigate();
  const { items, isLoading, error, removeItem } = useTaxonomyList(fetchTags, query);

  const [toDelete, setToDelete] = useState<TagSummary | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [feedback, setFeedback] = useState<DeleteFeedback | null>(null);

  const handleDelete = async () => {
    if (!toDelete) return;

    setIsDeleting(true);
    setFeedback(null);
    try {
      await deleteTag(toDelete.id);
      removeItem(toDelete.id);
      setFeedback({ variant: 'success', message: `Le tag « ${toDelete.name} » a été supprimé.` });
    } catch (err) {
      setFeedback({
        variant: 'danger',
        message: err instanceof Error ? err.message : 'Erreur lors de la suppression',
      });
    } finally {
      setIsDeleting(false);
      setToDelete(null);
    }
  };

  if (isLoading) {
    return (
      <S.CenteredState>
        <Loading size="lg" label="Chargement des tags…" />
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
            icon="tag-outline"
            title={query ? 'Aucun tag trouvé' : 'Aucun tag'}
            description={
              query
                ? `Aucun tag ne correspond à « ${query} ».`
                : 'Les tags permettent de croiser les articles par mots-clés transverses.'
            }
          />
        ) : (
          <Table hoverable>
            <Thead>
              <TRow>
                <Th>Tag</Th>
                <Th>Slug</Th>
                <Th>Description</Th>
                {canManageTaxonomies && <Th align="right">Actions</Th>}
              </TRow>
            </Thead>
            <Tbody>
              {items.map((tag) => (
                <TRow key={tag.id}>
                  <Td>
                    <Badge pill variant="neutral" color={getColorHex(tag.color)}>
                      {tag.name}
                    </Badge>
                  </Td>
                  <Td>
                    <S.Slug>{tag.slug}</S.Slug>
                  </Td>
                  <Td>
                    <Text size="sm" color="muted">
                      {tag.description || '—'}
                    </Text>
                  </Td>
                  {canManageTaxonomies && (
                    <Td align="right" width={120}>
                      <S.ActionsGroup>
                        <Tooltip content="Modifier">
                          <IconButton
                            name="pencil-outline"
                            variant="ghost"
                            size="sm"
                            aria-label={`Modifier le tag ${tag.name}`}
                            onClick={() => navigate(`/tags/${tag.id}/edit`)}
                          />
                        </Tooltip>
                        <Tooltip content="Supprimer">
                          <IconButton
                            name="trash-can-outline"
                            variant="ghost"
                            size="sm"
                            aria-label={`Supprimer le tag ${tag.name}`}
                            onClick={() => setToDelete(tag)}
                          />
                        </Tooltip>
                      </S.ActionsGroup>
                    </Td>
                  )}
                </TRow>
              ))}
            </Tbody>
          </Table>
        )}
      </Card>

      <ConfirmDialog
        isOpen={toDelete !== null}
        onClose={() => setToDelete(null)}
        onConfirm={handleDelete}
        title="Supprimer le tag"
        message={`Le tag « ${toDelete?.name ?? ''} » sera définitivement supprimé et retiré des articles associés.`}
        confirmLabel="Supprimer"
        loading={isDeleting}
      />
    </>
  );
};
