import { Button } from '@/ui/components/Base/Button';
import { Icon } from '@/ui/components/Base/Icon';
import { IconButton } from '@/ui/components/Base/IconButton';
import { TextareaField } from '@/ui/components/Forms/Fields/TextareaField';
import { TextField } from '@/ui/components/Forms/Fields/TextField';
import { Flex } from '@/ui/components/Grid/Flex';
import { BaseComponentProps } from '@/ui/types';
import styled from 'styled-components';
import { createBlockItemId } from './blockItemId';

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

/**
 * Bloc FAQ : alimente aussi le schéma JSON-LD FAQPage côté front
 */
export interface FaqBlockData {
  items: FaqItem[];
}

export interface FaqBlockProps extends BaseComponentProps {
  data: FaqBlockData;
  onChange: (updated: FaqBlockData) => void;
}

const ItemCard = styled.div`
  padding: ${({ theme }) => theme.spacing[3]};
  border: 1px solid ${({ theme }) => theme.colors.border.default};
  border-radius: ${({ theme }) => theme.radii.base};
  background-color: ${({ theme }) => theme.colors.background.surfaceHover};
`;

export const FaqBlock = ({ data, onChange, ...rest }: FaqBlockProps) => {
  const items = data.items || [];

  const updateItem = (id: string, patch: Partial<FaqItem>) =>
    onChange({ ...data, items: items.map((item) => (item.id === id ? { ...item, ...patch } : item)) });

  const addItem = () => onChange({ ...data, items: [...items, { id: createBlockItemId(), question: '', answer: '' }] });

  const removeItem = (id: string) => onChange({ ...data, items: items.filter((item) => item.id !== id) });

  return (
    <Flex direction="column" gap="0.75rem" {...rest}>
      {items.map((item, idx) => (
        <ItemCard key={item.id}>
          <Flex align="flex-start" gap="0.5rem">
            <div style={{ flex: 1 }}>
              <TextField
                label={`Question ${idx + 1}`}
                placeholder="Ex : Comment installer le CMS ?"
                value={item.question}
                onChange={(e) => updateItem(item.id, { question: e.target.value })}
              />
              <TextareaField
                label="Réponse"
                rows={3}
                value={item.answer}
                onChange={(e) => updateItem(item.id, { answer: e.target.value })}
              />
            </div>
            <IconButton
              name="trash-can-outline"
              size="sm"
              variant="danger"
              aria-label={`Supprimer la question ${idx + 1}`}
              disabled={items.length <= 1}
              onClick={() => removeItem(item.id)}
            />
          </Flex>
        </ItemCard>
      ))}

      <div>
        <Button variant="outline" size="sm" onClick={addItem}>
          <Icon name="plus" size={16} />
          Ajouter une question
        </Button>
      </div>
    </Flex>
  );
};
