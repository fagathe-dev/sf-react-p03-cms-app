import { ApiError } from '@/services/apiError';
import { createTag, updateTag } from '@/services/tag.api';
import { SaveTagPayload, Tag } from '@/types';
import { Alert, Badge, Button, Card, TextareaField, TextField } from '@/ui/components';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { COLOR_VALUES, getColorHex } from '../constants';
import { slugSchema } from '../schemas';
import { ColorPicker } from './ColorPicker';
import * as S from './Taxonomy.styles';

const tagSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Le nom du tag doit contenir au moins 2 caractères')
    .max(50, 'Le nom du tag ne peut pas dépasser 50 caractères'),
  slug: slugSchema(80),
  color: z.enum(COLOR_VALUES).nullable(),
  description: z.string().trim(),
});

type TagFormData = z.infer<typeof tagSchema>;

// Champs du formulaire pouvant recevoir une violation renvoyée par l'API
const API_FIELDS: (keyof TagFormData)[] = ['name', 'slug', 'color', 'description'];

interface TagFormProps {
  tag?: Tag;
}

export const TagForm = ({ tag }: TagFormProps) => {
  const [apiError, setApiError] = useState<string | null>(null);
  const navigate = useNavigate();
  const isEdit = Boolean(tag);

  const {
    register,
    control,
    watch,
    setError,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TagFormData>({
    resolver: zodResolver(tagSchema),
    defaultValues: {
      name: tag?.name ?? '',
      slug: tag?.slug ?? '',
      color: tag?.color ?? null,
      description: tag?.description ?? '',
    },
  });

  const [previewName, previewColor] = watch(['name', 'color']);

  const onSubmit = async (data: TagFormData) => {
    setApiError(null);

    const payload: SaveTagPayload = {
      name: data.name,
      slug: data.slug || null,
      color: data.color,
      description: data.description || null,
    };

    try {
      const saved = tag ? await updateTag(tag.id, payload) : await createTag(payload);

      navigate('/tags', {
        state: {
          successMessage: isEdit
            ? `Le tag « ${saved.name} » a été mis à jour.`
            : `Le tag « ${saved.name} » a été créé.`,
        },
      });
    } catch (err) {
      if (err instanceof ApiError) {
        API_FIELDS.forEach((field) => {
          const message = err.violations[field];
          if (message) setError(field, { message });
        });
      }
      setApiError(err instanceof Error ? err.message : "Erreur lors de l'enregistrement du tag");
    }
  };

  return (
    <Card elevation="sm">
      <Card.Header>
        <Card.Title>{isEdit ? 'Informations du tag' : 'Nouveau tag'}</Card.Title>
      </Card.Header>
      <Card.Body>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          {apiError && (
            <div style={{ marginBottom: '1rem' }}>
              <Alert variant="danger">{apiError}</Alert>
            </div>
          )}

          <TextField
            label="Nom"
            required
            placeholder="Ex : Symfony"
            error={errors.name?.message}
            {...register('name')}
          />

          <TextField
            label="Slug"
            placeholder="Ex : symfony"
            hint="Laissez vide pour le générer automatiquement à partir du nom."
            error={errors.slug?.message}
            {...register('slug')}
          />

          <Controller
            control={control}
            name="color"
            render={({ field }) => (
              <ColorPicker
                label="Couleur"
                value={field.value}
                onChange={field.onChange}
                hint="Chaque couleur ne peut être utilisée qu'une seule fois parmi vos tags."
                error={errors.color?.message}
              />
            )}
          />

          <TextareaField
            label="Description"
            rows={3}
            placeholder="À quoi sert ce tag ?"
            error={errors.description?.message}
            {...register('description')}
          />

          <div style={{ marginBottom: '1rem' }}>
            <Badge pill variant="neutral" color={getColorHex(previewColor)}>
              {previewName.trim() || 'Aperçu du tag'}
            </Badge>
          </div>

          <S.FormActions>
            <Button type="button" variant="ghost" onClick={() => navigate('/tags')}>
              Annuler
            </Button>
            <Button type="submit" loading={isSubmitting}>
              {isEdit ? 'Enregistrer' : 'Créer le tag'}
            </Button>
          </S.FormActions>
        </form>
      </Card.Body>
    </Card>
  );
};
