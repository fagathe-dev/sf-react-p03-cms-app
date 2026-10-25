import { Lead, Title } from '@/ui/components';
import { useSearchParams } from 'react-router-dom';
import { PostModerationList, QueueFilterControl } from './components';
import * as S from './components/Moderation.styles';
import { findFilter, POST_QUEUE_FILTERS } from './constants';

export const PostModerationPage = () => {
  const [searchParams] = useSearchParams();
  const filter = findFilter(POST_QUEUE_FILTERS, searchParams.get('filter'));

  return (
    <S.PageWrapper>
      <div>
        <Title as="h1">Revue des articles</Title>
        <Lead style={{ marginBottom: 0 }}>
          Relisez les articles soumis, renvoyez-les en réécriture ou publiez-les. Le contenu de l'auteur n'est jamais
          modifié.
        </Lead>
      </div>

      <QueueFilterControl filters={POST_QUEUE_FILTERS} value={filter.value} />

      <PostModerationList filter={filter} />
    </S.PageWrapper>
  );
};
