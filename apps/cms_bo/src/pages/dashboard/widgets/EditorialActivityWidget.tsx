import { PostListItem } from '@/types';
import { TabContent, TabList, Tabs, TabTrigger } from '@/ui/components';
import { PostRow } from '../components';
import * as S from '../components/Dashboard.styles';
import { DashboardWidgetProps } from './types';

interface PostListProps {
  posts: PostListItem[];
  emptyText: string;
  dateField?: 'publishedAt' | 'trashedAt';
}

const PostList = ({ posts, emptyText, dateField }: PostListProps) =>
  posts.length === 0 ? (
    <S.EmptyText>{emptyText}</S.EmptyText>
  ) : (
    <S.List>
      {posts.map((post) => (
        <S.ListItem key={post.id}>
          <PostRow post={post} dateField={dateField} />
        </S.ListItem>
      ))}
    </S.List>
  );

/**
 * Activité éditoriale : derniers articles, articles à retravailler, corbeille
 */
export const EditorialActivityWidget = ({ data }: DashboardWidgetProps) => (
  <>
    <Tabs defaultValue="recent">
      <TabList>
        <TabTrigger value="recent">Derniers articles</TabTrigger>
        <TabTrigger value="attention">À retravailler ({data.attentionPosts.length})</TabTrigger>
        <TabTrigger value="trash">Corbeille ({data.trashedPosts.length})</TabTrigger>
      </TabList>

      <TabContent value="recent">
        <PostList posts={data.recentPosts} emptyText="Aucun article pour le moment : rédigez le premier !" />
      </TabContent>
      <TabContent value="attention">
        <PostList posts={data.attentionPosts} emptyText="Aucun article à retravailler." />
      </TabContent>
      <TabContent value="trash">
        <PostList posts={data.trashedPosts} emptyText="La corbeille est vide." dateField="trashedAt" />
      </TabContent>
    </Tabs>

    <S.WidgetFooter>
      <S.TextLink to="/posts">Tous les articles</S.TextLink>
      <S.TextLink to="/posts/trash">Voir la corbeille</S.TextLink>
    </S.WidgetFooter>
  </>
);
