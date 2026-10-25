import { TextareaField } from '@/ui/components/Forms/Fields/TextareaField';
import { BaseComponentProps } from '@/ui/types';

/**
 * Bloc texte : contenu Markdown (seul type indexé en full-text par BlocContent::syncSearchText)
 */
export interface TextBlockData {
  content: string;
}

export interface TextBlockProps extends BaseComponentProps {
  data: TextBlockData;
  onChange: (updated: TextBlockData) => void;
}

export const TextBlock = ({ data, onChange, ...rest }: TextBlockProps) => {
  const lineCount = (data.content || '').split('\n').length;

  return (
    <div {...rest}>
      <TextareaField
        label="Contenu"
        rows={Math.min(Math.max(lineCount + 1, 4), 24)}
        placeholder="Rédigez votre paragraphe…"
        hint="Markdown : ## Titre, **gras**, *italique*, [lien](https://…), - liste"
        value={data.content || ''}
        onChange={(e) => onChange({ ...data, content: e.target.value })}
      />
    </div>
  );
};
