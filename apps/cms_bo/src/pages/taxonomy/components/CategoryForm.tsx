import { ApiError } from '@/services/apiError';
import { createCategory, updateCategory } from '@/services/category.api';
import { Category, SaveCategoryPayload } from '@/types';
import { Alert, Button, Card, Icon, TextareaField, TextField, ToggleField } from '@/ui/components';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { COLOR_VALUES } from '../constants';
import { slugSchema } from '../schemas';
import { ColorPicker } from './ColorPicker';
import * as S from './Taxonomy.styles';

const categorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Le nom de la catégorie doit contenir au moins 2 caractères')
    .max(100, 'Le nom de la catégorie ne peut pas dépasser 100 caractères'),
  slug: slugSchema(120),
  description: z.string().trim(),
  icon: z.string().trim().max(60, "Le nom de l'icône ne peut pas dépasser 60 caractères"),
  color: z.enum(COLOR_VALUES).nullable(),
  isFeatured: z.boolean(),
});

type CategoryFormData = z.infer<typeof categorySchema>;

// Champs du formulaire pouvant recevoir une violation renvoyée par l'API
const API_FIELDS: (keyof CategoryFormData)[] = ['name', 'slug', 'description'];

interface CategoryFormProps {
  category?: Category;
}

export const CategoryForm = ({ category }: CategoryFormProps) => {
  const [apiError, setApiError] = useState<string | null>(null);
  const navigate = useNavigate();
  const isEdit = Boolean(category);

  const {
    register,
    control,
    watch,
    setError,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: category?.name ?? '',
      slug: category?.slug ?? '',
      description: category?.description ?? '',
      icon: category?.settings.icon ?? '',
      color: (COLOR_VALUES as string[]).includes(category?.settings.color ?? '')
        ? (category?.settings.color as CategoryFormData['color'])
        : null,
      isFeatured: category?.settings.is_featured ?? false,
    },
  });

  const icon = watch('icon');

  const onSubmit = async (data: CategoryFormData) => {
    setApiError(null);

    const payload: SaveCategoryPayload = {
      name: data.name,
      slug: data.slug || null,
      description: data.description || null,
      settings: {
        ...category?.settings,
        icon: data.icon || null,
        color: data.color,
        is_featured: data.isFeatured,
      },
    };

    try {
      const saved = category ? await updateCategory(category.id, payload) : await createCategory(payload);

      navigate('/categories', {
        state: {
          successMessage: isEdit
            ? `La catégorie « ${saved.name} » a été mise à jour.`
            : `La catégorie « ${saved.name} » a été créée.`,
        },
      });
    } catch (err) {
      if (err instanceof ApiError) {
        API_FIELDS.forEach((field) => {
          const message = err.violations[field];
          if (message) setError(field, { message });
        });
      }
      setApiError(err instanceof Error ? err.message : "Erreur lors de l'enregistrement de la catégorie");
    }
  };

  return (
    <Card elevation="sm">
      <Card.Header>
        <Card.Title>{isEdit ? 'Informations de la catégorie' : 'Nouvelle catégorie'}</Card.Title>
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
            placeholder="Ex : Développement web"
            error={errors.name?.message}
            {...register('name')}
          />

          <TextField
            label="Slug"
            placeholder="Ex : developpement-web"
            hint="Laissez vide pour le générer automatiquement à partir du nom."
            error={errors.slug?.message}
            {...register('slug')}
          />

          <TextareaField
            label="Description"
            rows={3}
            placeholder="Courte présentation de la thématique"
            error={errors.description?.message}
            {...register('description')}
          />

          <TextField
            label="Icône"
            placeholder="Ex : folder-outline"
            hint="Nom d'une icône Material Design Icons (sans le préfixe mdi-)."
            error={errors.icon?.message}
            {...register('icon')}
          />
          {icon && (
            <div style={{ marginBottom: '1rem' }}>
              <Icon name={icon} size={24} />
            </div>
          )}

          <Controller
            control={control}
            name="color"
            render={({ field }) => (
              <ColorPicker
                label="Couleur"
                value={field.value}
                onChange={field.onChange}
                error={errors.color?.message}
              />
            )}
          />

          <ToggleField label="Mettre en avant cette catégorie" {...register('isFeatured')} />

          <S.FormActions>
            <Button type="button" variant="ghost" onClick={() => navigate('/categories')}>
              Annuler
            </Button>
            <Button type="submit" loading={isSubmitting}>
              {isEdit ? 'Enregistrer' : 'Créer la catégorie'}
            </Button>
          </S.FormActions>
        </form>
      </Card.Body>
    </Card>
  );
};
