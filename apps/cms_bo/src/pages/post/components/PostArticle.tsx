import { getColorHex } from '@/pages/taxonomy/constants';
import { Post } from '@/types';
import { Avatar, Badge, Card, Divider, EmptyState, Icon, Image, Lead, Text, Title } from '@/ui/components';
import { formatDate } from '@/utils';
import styled from 'styled-components';
import { BLOCK_VIEWS, isBlockType } from '../blocks';
import * as S from './Post.styles';
import { PostStatusBadge } from './PostStatusBadge';

const Article = styled.article`
  max-width: 820px;
  margin: 0 auto;
  width: 100%;
`;

const Blocks = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[5]};
`;

interface PostArticleProps {
  post: Post;
}

/**
 * Rendu de lecture d'un article (aperçu back-office) : en-tête, miniature puis blocs via BLOCK_VIEWS
 */
export const PostArticle = ({ post }: PostArticleProps) => {
  const authorName = post.author ? (post.author.displayName ?? post.author.username) : null;
  const blocks = [...(post.blocks ?? [])].sort((a, b) => a.position - b.position);
  const readingTime = post.settings?.reading_time;

  return (
    <Card elevation="sm">
      <Card.Body>
        <Article>
          <S.MetaRow>
            <PostStatusBadge status={post.status} />
            {post.category && (
              <Badge variant="primary" pill>
                {post.category.name}
              </Badge>
            )}
            {post.settings?.is_featured && (
              <Badge variant="warning" pill>
                <Icon name="star" size={12} /> À la une
              </Badge>
            )}
          </S.MetaRow>

          <Title as="h1" style={{ marginTop: '1rem' }}>
            {post.title}
          </Title>

          <S.MetaRow style={{ marginBottom: '1.5rem' }}>
            {authorName && (
              <>
                <Avatar src={post.author?.avatar ?? undefined} name={authorName} size="sm" />
                <Text size="sm" weight="medium">
                  {authorName}
                </Text>
              </>
            )}
            <Text size="sm" color="muted">
              {post.publishedAt ? `Publié le ${formatDate(post.publishedAt)}` : `Créé le ${formatDate(post.createdAt)}`}
              {readingTime ? ` · ${readingTime} min de lecture` : ''}
              {` · ${post.viewsCount} vue${post.viewsCount > 1 ? 's' : ''} · ${post.likesCount} j'aime`}
            </Text>
          </S.MetaRow>

          {post.thumbnail && (
            <div style={{ marginBottom: '1.5rem' }}>
              <Image src={post.thumbnail} alt="" aspectRatio="16/9" fit="cover" radius="lg" />
            </div>
          )}

          {post.excerpt && <Lead>{post.excerpt}</Lead>}

          <Divider margin="1.5rem 0" />

          {blocks.length === 0 ? (
            <EmptyState
              icon="text-box-outline"
              title="Aucun contenu"
              description="Cet article ne contient encore aucun bloc."
            />
          ) : (
            <Blocks>
              {blocks.map((block) => {
                if (!isBlockType(block.type)) return null;
                const View = BLOCK_VIEWS[block.type];
                return <View key={block.id} data={block.data} />;
              })}
            </Blocks>
          )}

          {post.tags.length > 0 && (
            <>
              <Divider margin="1.5rem 0" />
              <S.MetaRow>
                {post.tags.map((tag) => (
                  <Badge key={tag.id} variant="neutral" pill color={getColorHex(tag.color)}>
                    #{tag.name}
                  </Badge>
                ))}
              </S.MetaRow>
            </>
          )}
        </Article>
      </Card.Body>
    </Card>
  );
};
