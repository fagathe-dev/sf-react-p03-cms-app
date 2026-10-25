import { IsoDateString, Uuid } from './common.types';

/**
 * Miroir de Fagathe\CmsCore\Enum\Seo\SeoTargetType
 */
export type SeoTargetType = 'post' | 'category' | 'tag' | 'user_profile' | 'static_page';

export type RobotsDirective = 'index, follow' | 'noindex, follow' | 'index, nofollow' | 'noindex, nofollow';

export type OgType = 'website' | 'article' | 'profile';

export type SchemaType =
  | 'TechArticle'
  | 'BlogPosting'
  | 'CollectionPage'
  | 'WebPage'
  | 'ContactPage'
  | 'AboutPage'
  | 'FAQPage'
  | 'ProfilePage';

/**
 * Groupe ['seo.read'] (les settings ne sont pas exposés par l'API)
 */
export interface SeoMetadata {
  id: Uuid;
  targetType: SeoTargetType;
  targetIdentifier: string;
  metaTitle: string | null;
  metaDescription: string | null;
  canonicalUrl: string | null;
  robots: RobotsDirective | string;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  geoRegion: string | null;
  geoPlacename: string | null;
  geoPosition: string | null;
  jsonLdSchema: Record<string, unknown> | null;
  createdAt: IsoDateString;
  updatedAt: IsoDateString | null;
}

export interface SaveSeoMetadataPayload {
  targetType: SeoTargetType;
  targetIdentifier: string;
  metaTitle?: string | null;
  metaDescription?: string | null;
  canonicalUrl?: string | null;
  robots?: RobotsDirective | string;
  ogTitle?: string | null;
  ogDescription?: string | null;
  ogImage?: string | null;
  geoRegion?: string | null;
  geoPlacename?: string | null;
  geoPosition?: string | null;
  jsonLdSchema?: Record<string, unknown> | null;
  settings?: Record<string, unknown> | null;
}

/**
 * Réponse retournée par les endpoints /seo/.../schema (SeoMetadataService::buildFor*)
 */
export interface GeneratedSeoPacket {
  meta: {
    title: string;
    description: string;
    canonical: string;
    robots: string;
    og: {
      type: OgType | string;
      site_name: string;
      title: string;
      description: string;
      url: string;
      image: string;
    };
    geo: {
      region?: string;
      placename?: string;
      position?: string;
    };
  };
  jsonLd: Record<string, unknown>;
}
