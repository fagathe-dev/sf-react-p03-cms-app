import { ChoiceField } from '@/ui/components/Forms/Fields/ChoiceField';
import { TextareaField } from '@/ui/components/Forms/Fields/TextareaField';
import { TextField } from '@/ui/components/Forms/Fields/TextField';
import { Flex } from '@/ui/components/Grid/Flex';
import { BaseComponentProps } from '@/ui/types';

export type CtaVariant = 'primary' | 'secondary' | 'outline';

export interface CtaBlockData {
  title: string;
  description?: string;
  buttonLabel: string;
  buttonUrl: string;
  variant: CtaVariant;
}

export interface CtaBlockProps extends BaseComponentProps {
  data: CtaBlockData;
  onChange: (updated: CtaBlockData) => void;
}

export const CtaBlock = ({ data, onChange, ...rest }: CtaBlockProps) => (
  <Flex direction="column" gap="0" {...rest}>
    <TextField
      label="Titre"
      placeholder="Ex : Envie d'aller plus loin ?"
      value={data.title || ''}
      onChange={(e) => onChange({ ...data, title: e.target.value })}
    />
    <TextareaField
      label="Description"
      rows={2}
      value={data.description || ''}
      onChange={(e) => onChange({ ...data, description: e.target.value })}
    />
    <Flex gap="1rem" wrap="wrap">
      <div style={{ flex: '1 1 200px' }}>
        <TextField
          label="Libellé du bouton"
          placeholder="Ex : Télécharger le guide"
          value={data.buttonLabel || ''}
          onChange={(e) => onChange({ ...data, buttonLabel: e.target.value })}
        />
      </div>
      <div style={{ flex: '2 1 260px' }}>
        <TextField
          label="Lien du bouton"
          type="url"
          placeholder="https://… ou /contact"
          value={data.buttonUrl || ''}
          onChange={(e) => onChange({ ...data, buttonUrl: e.target.value })}
        />
      </div>
      <div style={{ flex: '1 1 160px' }}>
        <ChoiceField
          label="Style"
          value={data.variant || 'primary'}
          onChange={(e) => onChange({ ...data, variant: e.target.value as CtaVariant })}
        >
          <option value="primary">Principal</option>
          <option value="secondary">Secondaire</option>
          <option value="outline">Contour</option>
        </ChoiceField>
      </div>
    </Flex>
  </Flex>
);
