import { usePermissions } from '@/hooks/usePermissions';
import { deleteCategory, fetchCategories } from '@/services/category.api';
import { CategorySummary } from '@/types';
import {
  Alert,
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
import { useTaxonomyList } from '../hooks';
import { CategoryVisual } from './CategoryVisual';
import * as S from './Taxonomy.styles';

interface CategoryTableProps {
  query: string;
}

interface DeleteFeedback {
  variant: 'success' | 'danger';
  message: string;
}

export const CategoryTable = ({ query }: CategoryTableProps) => {
  const { canManageTaxonomies } = usePermissions();
  const navigate = useNavigate();
  const { items, isLoading, error, removeItem } = useTaxonomyList(fetchCategories, query);

  const [toDelete, setToDelete] = useState<CategorySummary | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [feedback, setFeedback] = useState<DeleteFeedback | null>(null);

  const handleDelete = async () => {
    if (!toDelete) return;

    setIsDeleting(true);
    setFeedback(null);
    try {
      await deleteCategory(toDelete.id);
      removeItem(toDelete.id);
      setFeedback({ variant: 'success', message: `La catégorie « ${toDelete.name} » a été supprimée.` });
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
        <Loading size="lg" label="Chargement des catégories…" />
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
            icon="folder-outline"
            title={query ? 'Aucune catégorie trouvée' : 'Aucune catégorie'}
            description={
              query
                ? `Aucune catégorie ne correspond à « ${query} ».`
                : 'Les catégories permettent de classer les articles par grande thématique.'
            }
          />
        ) : (
          <Table hoverable>
            <Thead>
              <TRow>
                <Th>Nom</Th>
                <Th>Slug</Th>
                {canManageTaxonomies && <Th align="right">Actions</Th>}
              </TRow>
            </Thead>
            <Tbody>
              {items.map((category) => (
                <TRow key={category.id}>
                  <Td>
                    <S.NameCell>
                      <CategoryVisual image={category.image} icon={category.settings?.icon} />
                      <div>
                        <Text weight="semibold">{category.name}</Text>
                        {category.description && (
                          <Text as="p" size="xs" style={{ margin: 0 }}>
                            {category.description}
                          </Text>
                        )}
                      </div>
                    </S.NameCell>
                  </Td>
                  <Td>
                    <S.Slug>{category.slug}</S.Slug>
                  </Td>
                  {canManageTaxonomies && (
                    <Td align="right" width={120}>
                      <S.ActionsGroup>
                        <Tooltip content="Modifier">
                          <IconButton
                            name="pencil-outline"
                            variant="ghost"
                            size="sm"
                            aria-label={`Modifier la catégorie ${category.name}`}
                            onClick={() => navigate(`/categories/${category.id}/edit`)}
                          />
                        </Tooltip>
                        <Tooltip content="Supprimer">
                          <IconButton
                            name="trash-can-outline"
                            variant="ghost"
                            size="sm"
                            aria-label={`Supprimer la catégorie ${category.name}`}
                            onClick={() => setToDelete(category)}
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
        title="Supprimer la catégorie"
        message={`La catégorie « ${toDelete?.name ?? ''} » sera définitivement supprimée. Cette action est irréversible.`}
        confirmLabel="Supprimer"
        loading={isDeleting}
      />
    </>
  );
};
