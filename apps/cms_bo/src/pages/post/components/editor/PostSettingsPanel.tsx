import { Card, Text, ToggleField } from '@/ui/components';
import { useFormContext } from 'react-hook-form';
import { PostMetaFormData } from '../../schemas';

interface PostSettingsPanelProps {
  readingTime: number | null;
}

export const PostSettingsPanel = ({ readingTime }: PostSettingsPanelProps) => {
  const { register } = useFormContext<PostMetaFormData>();

  return (
    <Card elevation="sm">
      <Card.Header>
        <Card.Title>Options</Card.Title>
      </Card.Header>
      <Card.Body>
        <ToggleField label="Autoriser les commentaires" {...register('allowComments')} />
        <ToggleField label="Autoriser les « J'aime »" {...register('allowLikes')} />
        <ToggleField label="Afficher le sommaire" {...register('showToc')} />
        <ToggleField label="Mettre l'article en avant" {...register('isFeatured')} />
        <Text as="p" size="xs" style={{ marginBottom: 0 }}>
          Temps de lecture estimé : {readingTime ? `${readingTime} min` : '—'} (calculé à l'enregistrement).
        </Text>
      </Card.Body>
    </Card>
  );
};
