import { Lead, Title } from '@/ui/components';
import { useSearchParams } from 'react-router-dom';
import { PostListToolbar, PostTrashTable } from './components';
import * as S from './components/Post.styles';
import { TRASH_RETENTION_DAYS } from './constants';

export const PostsTrashPage = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') ?? '';
  const page = Math.max(1, Number(searchParams.get('page')) || 1);

  return (
    <S.PageWrapper>
      <div>
        <Title as="h1">Corbeille</Title>
        <Lead style={{ marginBottom: 0 }}>
          Les articles supprimés y restent {TRASH_RETENTION_DAYS} jours : restaurez-les en brouillon ou supprimez-les
          définitivement.
        </Lead>
      </div>

      <PostListToolbar searchPlaceholder="Rechercher dans la corbeille…" />

      <PostTrashTable query={query} page={page} />
    </S.PageWrapper>
  );
};
