import { ConfigurableEntity, IsoDateString, Uuid } from './common.types';

/**
 * Miroir de Fagathe\CmsCore\Enum\ColorEnum
 */
export type ColorEnum =
  | 'red'
  | 'orange'
  | 'yellow'
  | 'green'
  | 'blue'
  | 'cyan'
  | 'purple'
  | 'violet'
  | 'fuchsia'
  | 'pink'
  | 'slate'
  | 'gray'
  | 'stone';

export interface CategorySettings {
  /** Icône MDI affichée à défaut d'image (Category::$image) */
  icon: string | null;
  color: ColorEnum | string | null;
  is_featured: boolean;
  [key: string]: unknown;
}

/**
 * Groupe ['category.list', 'post.list', 'post.read']
 */
export interface CategorySummary {
  id: Uuid;
  name: string;
  slug: string;
  description?: string | null;
  /** URL absolue de l'image uploadée ; à défaut, settings.icon est affichée */
  image?: string | null;
  /** Exposés par le groupe category.list (absents des groupes post.*) */
  settings?: CategorySettings;
}

/**
 * Groupe ['category.read']
 */
export interface Category extends CategorySummary, ConfigurableEntity<CategorySettings> {
  settings: CategorySettings;
  createdAt: IsoDateString;
  updatedAt: IsoDateString | null;
}

export interface SaveCategoryPayload {
  name: string;
  slug?: string | null;
  description?: string | null;
  settings?: Partial<CategorySettings>;
}

/**
 * Groupe ['tag.list', 'post.list', 'post.read']
 */
export interface TagSummary {
  id: Uuid;
  name: string;
  slug: string;
  color: ColorEnum | null;
  description?: string | null;
}

/**
 * Groupe ['tag.read'] (les settings du tag ne sont pas exposés par l'API)
 */
export interface Tag extends TagSummary {
  createdAt: IsoDateString;
  updatedAt: IsoDateString | null;
}

export interface SaveTagPayload {
  name: string;
  slug?: string | null;
  color?: ColorEnum | null;
  description?: string | null;
  settings?: Record<string, unknown>;
}
