export type Uuid = string;
export type IsoDateString = string;

export type FlagReason = 'spam' | 'inappropriate' | 'harassment' | 'misinformation' | 'copyright' | 'other';

/**
 * Structure d'une entrée dans $settings['flagged_by'] (FlaggableTrait)
 */
export interface FlagEntry {
  reason: FlagReason | string;
  comment?: string | null;
  flagged_at: IsoDateString;
}

export type FlaggedByMap = Record<Uuid, FlagEntry>;
export type LikedByMap = Record<Uuid, IsoDateString>;

/**
 * Contrat de base issu de ConfigurableEntityTrait
 */
export interface ConfigurableEntity<TSettings = Record<string, unknown>> {
  settings: TSettings;
}

/**
 * Contrat issu de FlaggableTrait
 */
export interface FlaggableEntity {
  flags: number;
}

/**
 * Contrat issu de LikableTrait
 */
export interface LikableEntity {
  likesCount: number;
}

/**
 * Payload unifié pour signaler un article ou un commentaire (FlagContentDto)
 */
export interface FlagContentPayload {
  reason: FlagReason;
  comment?: string | null;
}

/**
 * Métadonnées de pagination renvoyées par PostService::list
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  meta: PaginationMeta;
}

export interface ApiViolation {
  propertyPath?: string;
  message: string;
}

export interface ApiMessageResponse {
  message: string;
}
