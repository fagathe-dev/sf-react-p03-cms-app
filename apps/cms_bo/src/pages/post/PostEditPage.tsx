import { usePermissions } from '@/hooks/usePermissions';
import { Alert, Button, Loading } from '@/ui/components';
import { useNavigate, useParams } from 'react-router-dom';
import { PostEditor, PostPageHeader } from './components';
import * as S from './components/Post.styles';
import { usePost } from './hooks';

export const PostEditPage = () => {
  const { postId = '' } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const { canEditPost } = usePermissions();
  const { post, isLoading, error } = usePost(postId);

  return (
    <S.PageWrapper>
      <PostPageHeader post={post} postId={postId} current="edit" />

      {isLoading && (
        <S.CenteredState>
          <Loading size="lg" label="Chargement de l'article…" />
        </S.CenteredState>
      )}

      {error && <Alert variant="danger">{error}</Alert>}

      {post && !canEditPost(post) && (
        <Alert variant="warning" title="Modification impossible">
          Vous ne pouvez modifier que vos propres articles.
        </Alert>
      )}

      {post && canEditPost(post) && post.status === 'trash' && (
        <Alert variant="warning" title="Article à la corbeille">
          Restaurez cet article depuis la corbeille pour pouvoir le modifier.{' '}
          <Button size="sm" variant="outline" onClick={() => navigate('/posts/trash')}>
            Ouvrir la corbeille
          </Button>
        </Alert>
      )}

      {/* key : un changement d'article remonte l'éditeur avec un état vierge */}
      {post && canEditPost(post) && post.status !== 'trash' && <PostEditor key={post.id} post={post} />}
    </S.PageWrapper>
  );
};
