import { Lead, Title } from '@/ui/components';
import { useSearchParams } from 'react-router-dom';
import { CommentModerationList, QueueFilterControl } from './components';
import * as S from './components/Moderation.styles';
import { COMMENT_QUEUE_FILTERS, findFilter } from './constants';

export const CommentModerationPage = () => {
  const [searchParams] = useSearchParams();
  const filter = findFilter(COMMENT_QUEUE_FILTERS, searchParams.get('filter'));

  return (
    <S.PageWrapper>
      <div>
        <Title as="h1">Modération des commentaires</Title>
        <Lead style={{ marginBottom: 0 }}>
          Traitez les commentaires signalés par les lecteurs et ceux en attente de validation.
        </Lead>
      </div>

      <QueueFilterControl filters={COMMENT_QUEUE_FILTERS} value={filter.value} />

      <CommentModerationList filter={filter} />
    </S.PageWrapper>
  );
};
