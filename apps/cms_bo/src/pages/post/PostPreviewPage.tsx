import { Alert, Loading } from '@/ui/components';
import { useParams } from 'react-router-dom';
import { PostArticle, PostPageHeader } from './components';
import * as S from './components/Post.styles';
import { usePost } from './hooks';

export const PostPreviewPage = () => {
  const { postId = '' } = useParams<{ postId: string }>();
  const { post, isLoading, error } = usePost(postId);

  return (
    <S.PageWrapper>
      <PostPageHeader post={post} postId={postId} current="preview" />

      {isLoading && (
        <S.CenteredState>
          <Loading size="lg" label="Chargement de l'article…" />
        </S.CenteredState>
      )}

      {error && <Alert variant="danger">{error}</Alert>}

      {post && post.status !== 'published' && (
        <Alert variant="info">
          Aperçu interne : cet article n'est pas visible sur le blog tant qu'il n'est pas publié.
        </Alert>
      )}

      {post && <PostArticle post={post} />}
    </S.PageWrapper>
  );
};
