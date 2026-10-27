import { EmailPreview } from '@/types';
import { ListGroup } from '@/ui/components';
import styled from 'styled-components';

const ItemContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[0.5]};
  text-align: left;
`;

// Couleur héritée de ListGroupItem (blanche quand l'élément est actif)
const ItemLabel = styled.span`
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
`;

const ItemDescription = styled.span`
  font-size: ${({ theme }) => theme.typography.sizes.xs};
  opacity: 0.75;
`;

interface EmailPreviewListProps {
  previews: EmailPreview[];
  selectedSlug: string | null;
  onSelect: (slug: string) => void;
}

export const EmailPreviewList = ({ previews, selectedSlug, onSelect }: EmailPreviewListProps) => (
  <ListGroup>
    {previews.map((preview) => (
      <ListGroup.Item key={preview.slug} active={preview.slug === selectedSlug} onClick={() => onSelect(preview.slug)}>
        <ItemContent>
          <ItemLabel>{preview.label}</ItemLabel>
          <ItemDescription>{preview.description}</ItemDescription>
        </ItemContent>
      </ListGroup.Item>
    ))}
  </ListGroup>
);
