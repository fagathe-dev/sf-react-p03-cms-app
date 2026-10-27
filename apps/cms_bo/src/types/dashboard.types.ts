// src/types/dashboard.types.ts
// Tableau de bord (GET /dashboard, DashboardService) et état technique (GET /health-check)
import { User, UserRole } from './auth.types';
import { Comment } from './comment.types';
import { IsoDateString, Uuid } from './common.types';
import { PostListItem } from './post.types';
import { ColorEnum } from './taxonomy.types';

/** Nombre d'articles par statut ; total = hors corbeille */
export interface DashboardPostCounts {
  total: number;
  published: number;
  draft: number;
  review: number;
  rewriting: number;
  archived: number;
  trash: number;
}

/** Section KpisSection */
export interface DashboardKpis {
  posts: DashboardPostCounts;
  audience: { totalViews: number; totalLikes: number };
  comments: { totalApproved: number; pendingCount: number; flaggedCount: number };
  flaggedPostsCount: number;
}

/** Section TaxonomySection : catégorie avec son nombre d'articles publiés */
export interface CategoryDistributionItem {
  id: Uuid;
  name: string;
  slug: string;
  /** URL absolue de l'image ; à défaut, icon est affichée */
  image: string | null;
  icon: string | null;
  color: string | null;
  isFeatured: boolean;
  postsCount: number;
}

/** Section TaxonomySection : tag avec son nombre d'articles publiés */
export interface PopularTagItem {
  id: Uuid;
  name: string;
  slug: string;
  color: ColorEnum | null;
  postsCount: number;
}

/** Section SeoAlertsSection : articles publiés ne passant pas un contrôle */
export interface SeoAlertsSummary {
  publishedWithoutThumbnail: number;
  publishedWithoutExcerpt: number;
  publishedWithoutSeoMeta: number;
}

/** Section UsersOverviewSection */
export interface UsersOverviewSummary {
  byRole: Record<UserRole, number>;
  recentUsers: User[];
}

/**
 * Réponse de GET /dashboard. Une section non autorisée est absente :
 * le back-office masque alors le widget correspondant.
 */
export interface DashboardResponse {
  kpis: DashboardKpis;
  recentPosts: PostListItem[];
  /** Modérateur et + : file review + rewriting ; sinon ses brouillons et réécritures */
  attentionPosts: PostListItem[];
  trashedPosts: PostListItem[];
  topViewedPosts: PostListItem[];
  topLikedPosts: PostListItem[];
  categoriesDistribution: CategoryDistributionItem[];
  popularTags: PopularTagItem[];
  /** ROLE_MODERATOR et + (ModerationQueueSection) */
  moderationQueue?: Comment[];
  /** ROLE_MANAGER et + (SeoAlertsSection) */
  seoAlerts?: SeoAlertsSummary;
  /** ROLE_MANAGER et + (UsersOverviewSection) */
  usersOverview?: UsersOverviewSummary;
}

/** Miroir de GET /health-check (HealthCheckController) ; « degraded » est renvoyé avec un code 503 */
export interface HealthCheckResponse {
  status: 'ok' | 'degraded';
  timestamp: IsoDateString;
  service: string;
  version: string;
  checks: {
    database: { status: string; latency_ms: number | null };
    storage: { var_writable: boolean };
  };
  system: {
    php_version: string;
    environment: string;
    memory_usage_mb: number;
    response_ms: number;
  };
}
