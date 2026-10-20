// frontend/src/ui/components/Content/StatCard/StatCard.tsx
import { Badge, BadgeVariant } from '@/ui/components/Base/Badge';
import { Icon } from '@/ui/components/Base/Icon';
import { Card } from '@/ui/components/Content/Card';
import { BaseComponentProps } from '@/ui/types';
import styled from 'styled-components';

export interface StatCardProps extends BaseComponentProps {
  label: string;
  value: string | number;
  icon: string;
  trend?: string;
  trendVariant?: BadgeVariant;
}

const TopRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.spacing[2]};
`;

const LabelText = styled.span`
  font-size: ${({ theme }) => theme.typography.sizes.sm};
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  color: ${({ theme }) => theme.colors.text.muted};
`;

const IconBox = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: ${({ theme }) => theme.radii.base};
  background-color: ${({ theme }) => theme.colors.primary.subtle};
  color: ${({ theme }) => theme.colors.primary.base};
`;

const BottomRow = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing[2]};
`;

const ValueNumber = styled.strong`
  font-size: ${({ theme }) => theme.typography.sizes['2xl']};
  font-weight: ${({ theme }) => theme.typography.weights.bold};
  color: ${({ theme }) => theme.colors.text.heading};
  line-height: 1.1;
`;

export const StatCard = ({ label, value, icon, trend, trendVariant = 'success', ...rest }: StatCardProps) => {
  return (
    <Card bordered elevation="sm" {...rest}>
      <Card.Body>
        <TopRow>
          <LabelText>{label}</LabelText>
          <IconBox>
            <Icon name={icon} size={20} />
          </IconBox>
        </TopRow>
        <BottomRow>
          <ValueNumber>{value}</ValueNumber>
          {trend && (
            <Badge variant={trendVariant} pill>
              {trend}
            </Badge>
          )}
        </BottomRow>
      </Card.Body>
    </Card>
  );
};
