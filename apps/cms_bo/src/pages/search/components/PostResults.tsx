import { PostListItem } from '@/types';
import { Badge, ListGroup, Text } from '@/ui/components';
import { formatDate, POST_STATUS_DISPLAY } from '@/utils';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { SearchResultSection } from './SearchResultSection';

const ItemContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[1]};
  min-width: 0;
  flex: 1;
`;

const Meta = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
`;

interface PostResultsProps {
  posts: PostListItem[];
}

export const PostResults = ({ posts }: PostResultsProps) => {
  const navigate = useNavigate();

  return (
    <SearchResultSection title="Articles" icon="file-document-multiple-outline" count={posts.length}>
      <ListGroup>
        {posts.map((post) => {
          const status = POST_STATUS_DISPLAY[post.status];
          const author = post.author ? (post.author.displayName ?? post.author.username) : null;

          return (
            <ListGroup.Item key={post.id} action onClick={() => navigate(`/posts/${post.id}`)}>
              <ItemContent>
                <Text weight="semibold">{post.title}</Text>
                {post.excerpt && (
                  <Text size="xs" color="muted">
                    {post.excerpt}
                  </Text>
                )}
                <Meta>
                  <Badge variant={status.variant} pill>
                    {status.label}
                  </Badge>
                  {post.category && (
                    <Badge variant="neutral" pill>
                      {post.category.name}
                    </Badge>
                  )}
                  <Text size="xs" color="muted">
                    {author ? `${author} · ` : ''}
                    {formatDate(post.publishedAt ?? post.createdAt)}
                  </Text>
                </Meta>
              </ItemContent>
            </ListGroup.Item>
          );
        })}
      </ListGroup>
    </SearchResultSection>
  );
};
