import { Card, TextareaField, TextField } from '@/ui/components';
import { useFormContext } from 'react-hook-form';
import { PostMetaFormData } from '../../schemas';

export const PostMainFields = () => {
  const {
    register,
    watch,
    formState: { errors },
  } = useFormContext<PostMetaFormData>();

  const [title, excerpt] = watch(['title', 'excerpt']);

  return (
    <Card elevation="sm">
      <Card.Body>
        <TextField
          label="Titre"
          required
          placeholder="Titre de l'article"
          hint={`${title.length}/180 caractères`}
          error={errors.title?.message}
          style={{ fontSize: '1.25rem', fontWeight: 600 }}
          {...register('title')}
        />
        <TextField
          label="Slug"
          placeholder="genere-depuis-le-titre"
          hint="Utilisé dans l'URL : /blog/<slug>. Laissez vide pour le générer depuis le titre."
          error={errors.slug?.message}
          {...register('slug')}
        />
        <TextareaField
          label="Extrait"
          rows={3}
          placeholder="Résumé affiché dans les listes et les partages"
          hint={`${excerpt.length}/500 caractères`}
          error={errors.excerpt?.message}
          {...register('excerpt')}
        />
      </Card.Body>
    </Card>
  );
};
