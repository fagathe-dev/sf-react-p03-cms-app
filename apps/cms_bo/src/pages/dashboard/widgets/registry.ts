import { EditorialActivityWidget } from './EditorialActivityWidget';
import { ModerationQueueWidget } from './ModerationQueueWidget';
import { SeoHealthWidget } from './SeoHealthWidget';
import { SystemTeamWidget } from './SystemTeamWidget';
import { TaxonomyWidget } from './TaxonomyWidget';
import { TopPostsWidget } from './TopPostsWidget';
import { DashboardWidgetDefinition } from './types';

/**
 * Registre ordonné des widgets (ordre par défaut de chaque colonne).
 * Ajouter un widget = un composant + une entrée ici ; DashboardPage n'est pas modifié.
 * La disponibilité suit la présence des données : une section refusée par l'API est absente de la réponse.
 */
export const DASHBOARD_WIDGETS: DashboardWidgetDefinition[] = [
  {
    id: 'editorial-activity',
    title: 'Activité éditoriale',
    icon: 'file-document-edit-outline',
    column: 'main',
    isAvailable: () => true,
    Component: EditorialActivityWidget,
  },
  {
    id: 'top-posts',
    title: 'Palmarès des articles',
    icon: 'trophy-outline',
    column: 'side',
    isAvailable: () => true,
    Component: TopPostsWidget,
  },
  {
    id: 'moderation-queue',
    title: 'Modération rapide',
    icon: 'comment-check-outline',
    column: 'side',
    isAvailable: (data) => data.moderationQueue !== undefined,
    Component: ModerationQueueWidget,
  },
  {
    id: 'taxonomy',
    title: 'Catégories & tags',
    icon: 'shape-outline',
    column: 'main',
    isAvailable: () => true,
    Component: TaxonomyWidget,
  },
  {
    id: 'seo-health',
    title: 'Santé & couverture SEO',
    icon: 'heart-pulse',
    column: 'main',
    isAvailable: (data) => data.seoAlerts !== undefined,
    Component: SeoHealthWidget,
  },
  {
    id: 'system-team',
    title: 'État technique & équipe',
    icon: 'server-network',
    column: 'side',
    isAvailable: (data) => data.usersOverview !== undefined,
    Component: SystemTeamWidget,
  },
];
