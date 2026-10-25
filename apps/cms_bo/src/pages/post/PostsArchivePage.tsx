import { Lead, Title } from '@/ui/components';
import { useSearchParams } from 'react-router-dom';
import { PostListToolbar, PostTable } from './components';
import * as S from './components/Post.styles';

export const PostsArchivePage = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') ?? '';
  const page = Math.max(1, Number(searchParams.get('page')) || 1);

  return (
    <S.PageWrapper>
      <div>
        <Title as="h1">Archives</Title>
        <Lead style={{ marginBottom: 0 }}>
          Articles retirés de la une mais conservés. Repassez-les en « Publié » depuis l'éditeur pour les remettre en
          ligne.
        </Lead>
      </div>

      <PostListToolbar searchPlaceholder="Rechercher dans les archives…" />

      <PostTable
        status="archived"
        query={query}
        page={page}
        emptyTitle="Aucun article archivé"
        emptyDescription="Les articles passés au statut « Archivé » apparaîtront ici."
      />
    </S.PageWrapper>
  );
};
