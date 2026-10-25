import { usePermissions } from '@/hooks/usePermissions';
import { Post } from '@/types';
import { BackButton, Button, Icon, SegmentedControl } from '@/ui/components';
import { useNavigate } from 'react-router-dom';
import * as S from './Post.styles';

type PostView = 'preview' | 'edit' | 'seo';

const VIEW_PATHS: Record<PostView, (id: string) => string> = {
  preview: (id) => `/posts/${id}`,
  edit: (id) => `/posts/${id}/edit`,
  seo: (id) => `/posts/${id}/seo`,
};

interface PostPageHeaderProps {
  post: Post | null;
  postId: string;
  current: PostView;
}

/**
 * Navigation commune aux vues d'un article : retour à la liste et bascule Aperçu / Rédaction / SEO
 */
export const PostPageHeader = ({ post, postId, current }: PostPageHeaderProps) => {
  const { canEditPost, canReviewPost } = usePermissions();
  const navigate = useNavigate();

  const canEdit = post ? canEditPost(post) : false;
  const options = [
    { value: 'preview' as const, label: 'Aperçu', icon: 'eye-outline' },
    ...(canEdit ? [{ value: 'edit' as const, label: 'Rédaction', icon: 'pencil-outline' }] : []),
    { value: 'seo' as const, label: 'SEO', icon: 'search-web' },
  ];

  return (
    <S.HeaderRow style={{ alignItems: 'center' }}>
      <BackButton label="Retour aux articles" onClick={() => navigate('/posts')} />

      <S.ActionsGroup style={{ gap: '0.75rem', alignItems: 'center' }}>
        {post && canReviewPost(post) && (post.status === 'review' || post.flags > 0) && (
          <Button size="sm" variant="outline" onClick={() => navigate('/moderation/posts')}>
            <Icon name="shield-check-outline" size={16} />
            Modération
          </Button>
        )}
        {post && (
          <SegmentedControl
            aria-label="Vue de l'article"
            size="sm"
            options={options}
            value={current}
            onChange={(view) => navigate(VIEW_PATHS[view](postId))}
          />
        )}
      </S.ActionsGroup>
    </S.HeaderRow>
  );
};
