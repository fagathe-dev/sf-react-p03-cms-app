import { RobotsDirective, SchemaType, SeoTargetType } from '@/types';

export interface SeoTargetTypeOption {
  value: SeoTargetType;
  label: string;
}

export const SEO_TARGET_TYPES: SeoTargetTypeOption[] = [
  { value: 'static_page', label: 'Page statique' },
  { value: 'category', label: 'Catégorie' },
  { value: 'tag', label: 'Tag' },
  { value: 'post', label: 'Article' },
  { value: 'user_profile', label: 'Profil utilisateur' },
];

export const isSeoTargetType = (value: string | null): value is SeoTargetType =>
  SEO_TARGET_TYPES.some((option) => option.value === value);

export interface StaticPagePreset {
  key: string;
  label: string;
  path: string;
  schemaType: SchemaType;
}

/**
 * Pages statiques du front (cms_front) : la clé sert d'identifiant de cible SEO
 */
export const STATIC_PAGES: StaticPagePreset[] = [
  { key: 'home', label: 'Accueil', path: '/', schemaType: 'WebPage' },
  { key: 'blog', label: 'Blog', path: '/blog', schemaType: 'CollectionPage' },
  { key: 'about', label: 'À propos', path: '/about', schemaType: 'AboutPage' },
  { key: 'contact', label: 'Contact', path: '/contact', schemaType: 'ContactPage' },
  { key: 'faq', label: 'FAQ', path: '/faq', schemaType: 'FAQPage' },
];

export const ROBOTS_OPTIONS: { value: RobotsDirective; label: string }[] = [
  { value: 'index, follow', label: 'Indexer et suivre les liens (index, follow)' },
  { value: 'noindex, follow', label: 'Ne pas indexer, suivre les liens (noindex, follow)' },
  { value: 'index, nofollow', label: 'Indexer, ne pas suivre les liens (index, nofollow)' },
  { value: 'noindex, nofollow', label: 'Ne pas indexer ni suivre (noindex, nofollow)' },
];

/**
 * Longueurs maximales de SaveSeoMetadataDto
 */
export const SEO_LIMITS = {
  metaTitle: 70,
  metaDescription: 160,
  canonicalUrl: 255,
  ogTitle: 180,
  ogDescription: 255,
  ogImage: 255,
  geoRegion: 100,
  geoPlacename: 100,
  geoPosition: 50,
} as const;
