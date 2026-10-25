import { FlaggedByMap } from '@/types';
import { Badge, Text } from '@/ui/components';
import { formatDateTime, getFlagReasonLabel } from '@/utils';
import styled from 'styled-components';

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[2]};
  margin-top: ${({ theme }) => theme.spacing[3]};
`;

const Reasons = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing[2]};
`;

const Comments = styled.ul`
  margin: 0;
  padding-left: ${({ theme }) => theme.spacing[5]};
`;

interface FlagSummaryProps {
  flags: number;
  flaggedBy?: FlaggedByMap;
}

/**
 * Synthèse des signalements (FlaggableTrait) : motifs regroupés et commentaires des lecteurs
 */
export const FlagSummary = ({ flags, flaggedBy = {} }: FlagSummaryProps) => {
  if (flags <= 0) return null;

  const entries = Object.values(flaggedBy);

  const reasonCounts = entries.reduce<Record<string, number>>((acc, entry) => {
    acc[entry.reason] = (acc[entry.reason] ?? 0) + 1;
    return acc;
  }, {});

  const comments = entries.filter((entry) => entry.comment);

  return (
    <Wrapper>
      <Reasons>
        <Badge variant="danger" pill>
          {flags} signalement{flags > 1 ? 's' : ''}
        </Badge>
        {Object.entries(reasonCounts).map(([reason, count]) => (
          <Badge key={reason} variant="neutral" pill>
            {getFlagReasonLabel(reason)}
            {count > 1 ? ` × ${count}` : ''}
          </Badge>
        ))}
      </Reasons>

      {comments.length > 0 && (
        <Comments>
          {comments.map((entry, idx) => (
            <li key={idx}>
              <Text size="sm">« {entry.comment} »</Text>{' '}
              <Text size="xs" color="muted">
                — {getFlagReasonLabel(entry.reason)}, {formatDateTime(entry.flagged_at)}
              </Text>
            </li>
          ))}
        </Comments>
      )}
    </Wrapper>
  );
};
