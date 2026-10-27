import { Card, Icon } from '@/ui/components';
import { ReactNode } from 'react';
import styled from 'styled-components';
import { IconName } from '../widgets/types';

const Top = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing[2]};
  color: ${({ theme }) => theme.colors.text.muted};
  font-size: ${({ theme }) => theme.typography.sizes.sm};
  font-weight: ${({ theme }) => theme.typography.weights.medium};
`;

const IconBubble = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: ${({ theme }) => theme.radii.full};
  background-color: ${({ theme }) => theme.colors.primary.subtle};
  color: ${({ theme }) => theme.colors.primary.base};
`;

const Value = styled.p`
  margin: ${({ theme }) => `${theme.spacing[2]} 0`};
  font-size: ${({ theme }) => theme.typography.sizes.xl};
  font-weight: ${({ theme }) => theme.typography.weights.bold};
  color: ${({ theme }) => theme.colors.text.heading};
`;

const Details = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing[1.5]};
  font-size: ${({ theme }) => theme.typography.sizes.xs};
  color: ${({ theme }) => theme.colors.text.muted};
`;

interface KpiCardProps {
  label: string;
  icon: IconName;
  value: string;
  children?: ReactNode;
}

export const KpiCard = ({ label, icon, value, children }: KpiCardProps) => (
  <Card as="article" aria-label={label}>
    <Card.Body>
      <Top>
        <span>{label}</span>
        <IconBubble aria-hidden="true">
          <Icon name={icon} size={20} />
        </IconBubble>
      </Top>
      <Value>{value}</Value>
      {children && <Details>{children}</Details>}
    </Card.Body>
  </Card>
);
