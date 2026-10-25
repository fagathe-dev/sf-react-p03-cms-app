import { ConfigurableEntity, FlaggableEntity, FlaggedByMap, IsoDateString, Uuid } from './common.types';
import { UserSummary } from './auth.types';

export type CommentStatus = 'pending' | 'approved' | 'rejected' | 'spam';

export interface CommentSettings {
  flagged_by: FlaggedByMap;
  moderation_note: string | null;
  moderated_by: Uuid | null;
  moderated_at: IsoDateString | null;
  is_edited: boolean;
  [key: string]: unknown;
}

export interface Comment extends ConfigurableEntity<CommentSettings>, FlaggableEntity {
  id: Uuid;
  content: string;
  owner: UserSummary;
  replies: Comment[];
  status: CommentStatus;
  createdAt: IsoDateString;
  updatedAt: IsoDateString | null;
}

// --- DTOs CommentService ---

export interface CreateCommentPayload {
  postId: Uuid;
  parentId?: Uuid | null;
  content: string;
}

export interface UpdateCommentPayload {
  content: string;
}

export interface ModerateCommentPayload {
  status: CommentStatus;
  moderationNote?: string | null;
  resetFlags?: boolean;
}
