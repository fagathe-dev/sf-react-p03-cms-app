import { getColorHex } from '@/pages/taxonomy/constants';
import { TagSummary } from '@/types';
import { Alert, Card, ChoiceField, TagInput, TagOption } from '@/ui/components';
import { useMemo } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { useTaxonomyOptions } from '../../hooks';
import { PostMetaFormData } from '../../schemas';

const toTagOption = (tag: TagSummary): TagOption => ({ id: tag.id, label: tag.name, color: getColorHex(tag.color) });

interface PostTaxonomyPanelProps {
  /** Tags déjà rattachés à l'article (affichés même s'ils sortent des 100 premiers) */
  currentTags: TagSummary[];
}

export const PostTaxonomyPanel = ({ currentTags }: PostTaxonomyPanelProps) => {
  const { categories, tags, isLoading, error } = useTaxonomyOptions();
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<PostMetaFormData>();

  const tagOptions = useMemo(() => {
    const byId = new Map<string, TagOption>();
    [...currentTags, ...tags].forEach((tag) => byId.set(tag.id, toTagOption(tag)));
    return byId;
  }, [currentTags, tags]);

  return (
    <Card elevation="sm">
      <Card.Header>
        <Card.Title>Classement</Card.Title>
      </Card.Header>
      <Card.Body>
        {error && (
          <div style={{ marginBottom: '1rem' }}>
            <Alert variant="danger">{error}</Alert>
          </div>
        )}

        <ChoiceField label="Catégorie" disabled={isLoading} error={errors.categoryId?.message} {...register('categoryId')}>
          <option value="">{isLoading ? 'Chargement…' : '— Aucune —'}</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </ChoiceField>

        <Controller
          control={control}
          name="tagIds"
          render={({ field }) => (
            <TagInput
              label="Tags"
              allowCreate={false}
              placeholder="Rechercher un tag…"
              hint="Seuls les tags existants peuvent être ajoutés."
              suggestions={[...tagOptions.values()]}
              value={field.value.map((id) => tagOptions.get(id)).filter((tag): tag is TagOption => Boolean(tag))}
              onChange={(selected) => field.onChange(selected.map((tag) => tag.id))}
            />
          )}
        />
      </Card.Body>
    </Card>
  );
};
