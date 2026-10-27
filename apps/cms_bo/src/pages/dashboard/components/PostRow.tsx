import { PostListItem } from '@/types';
import { Badge, Icon } from '@/ui/components';
import { formatDate } from '@/utils';
import { ReactNode } from 'react';
import styled from 'styled-components';
import { POST_STATUS_DISPLAY } from '../utils';
import * as S from './Dashboard.styles';
import { PersonCell } from './PersonCell';

const Row = styled.div`
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing[3]};
`;

const Thumbnail = styled.span`
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 64px;
  aspect-ratio: 16 / 10;
  overflow: hidden;
  border-radius: ${({ theme }) => theme.radii.sm};
  background-color: ${({ theme }) => theme.colors.background.surfaceHover};
  color: ${({ theme }) => theme.colors.text.muted};

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const Body = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[1]};
  min-width: 0;
`;

const TitleLine = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing[2]};
`;

const NoteIndicator = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1]};
  color: ${({ theme }) => theme.colors.warning.dark};
`;

const Aside = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: ${({ theme }) => theme.spacing[1]};
  flex-shrink: 0;
  font-size: ${({ theme }) => theme.typography.sizes.sm};
`;

interface PostRowProps {
  post: PostListItem;
  /** Date affichée : publication par défaut, ou mise à la corbeille */
  dateField?: 'publishedAt' | 'trashedAt';
}

/**
 * Ligne d'article réutilisée par les widgets : miniature, titre, auteur, catégorie, date, statut et action « Modifier »
 */
export const PostRow = ({ post, dateField = 'publishedAt' }: PostRowProps): ReactNode => {
  const status = POST_STATUS_DISPLAY[post.status];
  const moderationNote = post.settings?.moderation_note;
  const date = dateField === 'trashedAt' ? post.trashedAt : (post.publishedAt ?? post.createdAt);
  const editUrl = `/posts/${post.id}/edit`;

  return (
    <Row>
      <Thumbnail aria-hidden="true">
        {post.thumbnail ? <img src={post.thumbnail} alt="" loading="lazy" /> : <Icon name="image-outline" size={20} />}
      </Thumbnail>

      <Body>
        <TitleLine>
          <S.TextLink to={editUrl}>{post.title}</S.TextLink>
          {moderationNote && (
            <NoteIndicator title={moderationNote}>
              <Icon name="message-alert-outline" size={14} />
              <span>Note de relecture</span>
            </NoteIndicator>
          )}
        </TitleLine>
        <S.MetaLine>
          <PersonCell user={post.author} />
          {post.category && <span>· {post.category.name}</span>}
          <span>· {formatDate(date)}</span>
        </S.MetaLine>
      </Body>

      <Aside>
        <Badge variant={status.variant} pill>
          {status.label}
        </Badge>
        <S.TextLink to={editUrl} aria-label={`Modifier l'article « ${post.title} »`}>
          Modifier
        </S.TextLink>
      </Aside>
    </Row>
  );
};
