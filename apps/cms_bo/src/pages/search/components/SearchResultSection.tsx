import { Badge, Card, Icon } from '@/ui/components';
import React from 'react';

interface SearchResultSectionProps {
  title: string;
  icon: string;
  count: number;
  children: React.ReactNode;
}

/**
 * Bloc de résultats d'un type d'entité (masqué s'il n'y a aucun résultat)
 */
export const SearchResultSection = ({ title, icon, count, children }: SearchResultSectionProps) => {
  if (count === 0) return null;

  return (
    <Card elevation="sm">
      <Card.Header>
        <Card.Title style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
          <Icon name={icon} size={20} />
          {title}
          <Badge variant="neutral" pill>
            {count}
          </Badge>
        </Card.Title>
      </Card.Header>
      <Card.Body>{children}</Card.Body>
    </Card>
  );
};
