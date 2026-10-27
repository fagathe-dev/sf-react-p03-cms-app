// src/types/index.ts
import { User } from './auth.types';
import { PostListItem } from './post.types';
import { CategorySummary, TagSummary } from './taxonomy.types';

export * from './admin.types';
export * from './auth.types';
export * from './comment.types';
export * from './common.types';
export * from './dashboard.types';
export * from './media.types';
export * from './post.types';
export * from './seo.types';
export * from './setting.types';
export * from './taxonomy.types';

export interface GlobalSearchResponse {
  posts: PostListItem[];
  categories: CategorySummary[];
  tags: TagSummary[];
  users: User[];
}
