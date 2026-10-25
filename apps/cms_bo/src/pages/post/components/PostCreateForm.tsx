import { ApiError } from '@/services/apiError';
import { createPost } from '@/services/post.api';
import { Alert, Button, Card, ChoiceField, TextareaField, TextField } from '@/ui/components';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useTaxonomyOptions } from '../hooks';
import { PostCreateFormData, postCreateSchema } from '../schemas';
import * as S from './Post.styles';

const API_FIELDS: (keyof PostCreateFormData)[] = ['title', 'excerpt', 'categoryId'];

/**
 * Création d'un brouillon : l'article doit exister pour téléverser ses médias,
 * la rédaction se poursuit ensuite dans l'éditeur.
 */
export const PostCreateForm = () => {
  const [apiError, setApiError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { categories, isLoading: isLoadingCategories } = useTaxonomyOptions();

  const {
    register,
    setError,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PostCreateFormData>({
    resolver: zodResolver(postCreateSchema),
    defaultValues: {
      title: '',
      excerpt: '',
      categoryId: '',
    },
  });

  const onSubmit = async (data: PostCreateFormData) => {
    setApiError(null);
    try {
      const post = await createPost({
        title: data.title,
        excerpt: data.excerpt || null,
        categoryId: data.categoryId || null,
        status: 'draft',
      });
      navigate(`/posts/${post.id}/edit`, { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        API_FIELDS.forEach((field) => {
          const message = err.violations[field];
          if (message) setError(field, { message });
        });
      }
      setApiError(err instanceof Error ? err.message : "Erreur lors de la création de l'article");
    }
  };

  return (
    <Card elevation="sm">
      <Card.Body>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          {apiError && (
            <div style={{ marginBottom: '1rem' }}>
              <Alert variant="danger">{apiError}</Alert>
            </div>
          )}

          <TextField
            label="Titre"
            required
            autoFocus
            placeholder="Ex : Construire un CMS headless avec Symfony et React"
            error={errors.title?.message}
            {...register('title')}
          />

          <ChoiceField
            label="Catégorie"
            disabled={isLoadingCategories}
            error={errors.categoryId?.message}
            {...register('categoryId')}
          >
            <option value="">{isLoadingCategories ? 'Chargement…' : '— Aucune —'}</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </ChoiceField>

          <TextareaField
            label="Extrait (optionnel)"
            rows={3}
            placeholder="Résumé affiché dans les listes et les partages"
            error={errors.excerpt?.message}
            {...register('excerpt')}
          />

          <S.FormActions>
            <Button type="button" variant="ghost" onClick={() => navigate('/posts')}>
              Annuler
            </Button>
            <Button type="submit" loading={isSubmitting}>
              Créer le brouillon et rédiger
            </Button>
          </S.FormActions>
        </form>
      </Card.Body>
    </Card>
  );
};
