import {
  ConfigurableEntity,
  FlaggableEntity,
  FlaggedByMap,
  IsoDateString,
  LikableEntity,
  LikedByMap,
  Uuid,
} from './common.types';
import { PostMedia } from './media.types';
import { CategorySummary, TagSummary } from './taxonomy.types';
import { UserSummary } from './auth.types';

export type PostStatus =
  | 'draft'
  | 'review'
  | 'rewriting'
  | 'published'
  | 'archived'
  | 'trash';

/**
 * Miroir de Fagathe\CmsCore\Enum\Post\BlockType
 */
export type BlockType =
  | 'text'
  | 'code'
  | 'image'
  | 'video'
  | 'carousel'
  | 'gallery'
  | 'quote'
  | 'table'
  | 'faq'
  | 'cta';

export interface BlocContent<TData = Record<string, unknown>>
  extends ConfigurableEntity<Record<string, unknown>> {
  id: Uuid;
  type: BlockType;
  position: number;
  data: TData;
  createdAt: IsoDateString;
  updatedAt: IsoDateString | null;
}

export interface PostSettings {
  allow_comments: boolean;
  allow_likes: boolean;
  show_toc: boolean;
  is_featured: boolean;
  reading_time: number | null;
  seo_title: string | null;
  seo_description: string | null;
  liked_by: LikedByMap;
  flagged_by: FlaggedByMap;
  reviewed_by?: Uuid | null;
  reviewed_at?: IsoDateString | null;
  moderation_note?: string | null;
  [key: string]: unknown;
}

/**
 * Représentation d'un article dans les listes — Groupe ['post.list']
 */
export interface PostListItem extends FlaggableEntity, LikableEntity {
  id: Uuid;
  title: string;
  slug: string;
  thumbnail: string | null;
  excerpt: string | null;
  status: PostStatus;
  author: UserSummary | null;
  category: CategorySummary | null;
  tags: TagSummary[];
  publishedAt: IsoDateString | null;
  trashedAt: IsoDateString | null;
  createdAt: IsoDateString;
  viewsCount: number;
}

/**
 * Représentation complète d'un article — Groupe ['post.read', 'file.read', 'bloc.read']
 */
export interface Post extends PostListItem, ConfigurableEntity<PostSettings> {
  updatedAt: IsoDateString | null;
  blocks: BlocContent[];
  medias: PostMedia[];
}

// --- DTOs PostService ---

export interface SaveBlocContentPayload {
  id?: Uuid | null;
  type: BlockType;
  position: number;
  data: Record<string, unknown>;
  settings?: Record<string, unknown> | null;
}

export interface SavePostPayload {
  title: string;
  slug?: string | null;
  excerpt?: string | null;
  thumbnail?: string | null;
  status?: PostStatus;
  categoryId?: Uuid | null;
  tagIds?: Uuid[];
  settings?: Partial<PostSettings> | null;
  blocks?: SaveBlocContentPayload[];
}

export interface ReviewPostPayload {
  status: Extract<PostStatus, 'published' | 'review' | 'rewriting'>;
  moderationNote?: string | null;
  resetFlags?: boolean;
}

export interface ToggleLikeResponse {
  liked: boolean;
  likesCount: number;
  message: string;
}