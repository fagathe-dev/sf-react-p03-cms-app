import { usePermissions } from '@/hooks/usePermissions';
import { SeoMetadataEditor, SeoPreview } from '@/pages/seo/components';
import * as SeoStyles from '@/pages/seo/components/Seo.styles';
import { Alert, Lead, Loading, Title } from '@/ui/components';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { PostPageHeader } from './components';
import * as S from './components/Post.styles';
import { usePost } from './hooks';

export const PostSeoPage = () => {
  const { postId = '' } = useParams<{ postId: string }>();
  const { canManageSeo } = usePermissions();
  const { post, isLoading, error } = usePost(postId);
  // Incrémentée après chaque enregistrement pour régénérer l'aperçu
  const [revision, setRevision] = useState(0);

  return (
    <S.PageWrapper>
      <PostPageHeader post={post} postId={postId} current="seo" />

      <div>
        <Title as="h1">SEO de l'article</Title>
        {post && <Lead style={{ marginBottom: 0 }}>{post.title}</Lead>}
      </div>

      {isLoading && (
        <S.CenteredState>
          <Loading size="lg" label="Chargement de l'article…" />
        </S.CenteredState>
      )}

      {error && <Alert variant="danger">{error}</Alert>}

      {post &&
        (canManageSeo ? (
          // Cible « post » identifiée par l'UUID, comme PostSeoController::save
          <SeoStyles.Workspace>
            <SeoMetadataEditor
              targetType="post"
              targetIdentifier={post.id}
              onChange={() => setRevision((current) => current + 1)}
            />
            <SeoPreview targetType="post" targetIdentifier={post.id} revision={revision} />
          </SeoStyles.Workspace>
        ) : (
          <>
            <Alert variant="info">
              La personnalisation du SEO est réservée aux gestionnaires. Voici les balises générées automatiquement
              pour cet article.
            </Alert>
            <SeoPreview targetType="post" targetIdentifier={post.id} revision={0} />
          </>
        ))}
    </S.PageWrapper>
  );
};
