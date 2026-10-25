import { usePermissions } from '@/hooks/usePermissions';
import { Button, Icon, Lead, Title } from '@/ui/components';
import { useNavigate } from 'react-router-dom';
import * as S from './Taxonomy.styles';

interface TaxonomyPageHeaderProps {
  title: string;
  description: string;
  createLabel: string;
  createTo: string;
}

export const TaxonomyPageHeader = ({ title, description, createLabel, createTo }: TaxonomyPageHeaderProps) => {
  const { canManageTaxonomies } = usePermissions();
  const navigate = useNavigate();

  return (
    <S.HeaderRow>
      <div>
        <Title as="h1">{title}</Title>
        <Lead style={{ marginBottom: 0 }}>{description}</Lead>
      </div>

      {canManageTaxonomies && (
        <Button onClick={() => navigate(createTo)}>
          <Icon name="plus" size={18} />
          {createLabel}
        </Button>
      )}
    </S.HeaderRow>
  );
};
