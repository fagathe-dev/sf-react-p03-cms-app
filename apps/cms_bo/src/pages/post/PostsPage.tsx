import { usePermissions } from '@/hooks/usePermissions';
import { Alert, Button, Icon, Lead, Title } from '@/ui/components';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { PostListToolbar, PostTable } from './components';
import * as S from './components/Post.styles';
import { findPostListFilter } from './constants';

interface PostsLocationState {
  successMessage?: string;
}

export const PostsPage = () => {
  const { canCreatePost } = usePermissions();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  const filter = findPostListFilter(searchParams.get('status'));
  const query = searchParams.get('q') ?? '';
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const successMessage = (location.state as PostsLocationState | null)?.successMessage;

  return (
    <S.PageWrapper>
      <S.HeaderRow>
        <div>
          <Title as="h1">Articles</Title>
          <Lead style={{ marginBottom: 0 }}>Rédigez, relisez et publiez les articles du blog.</Lead>
        </div>
        {canCreatePost() && (
          <Button onClick={() => navigate('/posts/new')}>
            <Icon name="file-document-plus-outline" size={18} />
            Nouvel article
          </Button>
        )}
      </S.HeaderRow>

      {successMessage && <Alert variant="success">{successMessage}</Alert>}

      <PostListToolbar filter={filter.value} />

      <PostTable
        status={filter.status}
        query={query}
        page={page}
        // Sans filtre, l'API renvoie aussi la corbeille : elle a sa propre page
        excludeStatuses={filter.status ? undefined : ['trash']}
        emptyTitle="Aucun article"
        emptyDescription="Aucun article ne correspond à ce filtre."
      />
    </S.PageWrapper>
  );
};
