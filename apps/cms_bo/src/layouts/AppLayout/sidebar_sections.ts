// src/layouts/AppLayout/sidebar_sections.ts
import { UserRole } from '@/types';

export interface NavLinkItem {
  label: string;
  to: string;
  icon: string;
  exact?: boolean;
  minRole?: UserRole;
}

export interface NavGroupSection {
  title: string;
  minRole?: UserRole;
  items: NavLinkItem[];
}

export const ROLE_LABELS: Record<UserRole, string> = {
  ROLE_USER: 'Utilisateur',
  ROLE_CONTRIBUTOR: 'Contributeur',
  ROLE_EDITOR: 'Éditeur',
  ROLE_MODERATOR: 'Modérateur',
  ROLE_MANAGER: 'Gestionnaire',
  ROLE_ADMIN: 'Administrateur',
  ROLE_SUPER_ADMIN: 'Super Admin',
};



export const NAV_SECTIONS: NavGroupSection[] = [
  {
    title: 'Pilotage',
    // exact : sans lui, « / » serait actif sur toutes les routes
    items: [{ label: 'Tableau de bord', to: '/', icon: 'view-dashboard-outline', exact: true }],
  },
  {
    title: 'Articles',
    items: [
      { label: 'Liste des articles', to: '/posts', icon: 'file-document-multiple-outline', exact: true },
      { label: 'Créer un article', to: '/posts/new', icon: 'file-document-plus-outline' },
      { label: 'Archives', to: '/posts/archives', icon: 'archive-outline' },
      { label: 'Corbeille', to: '/posts/trash', icon: 'trash-can-outline' },
    ],
  },
  {
    title: 'Taxonomie',
    items: [
      { label: 'Catégories', to: '/categories', icon: 'folder-outline' },
      { label: 'Tags', to: '/tags', icon: 'tag-multiple-outline' },
    ],
  },
  {
    title: 'Modération',
    minRole: 'ROLE_MODERATOR',
    items: [
      { label: 'Commentaires signalés', to: '/moderation/comments', icon: 'comment-alert-outline' },
      { label: 'Revue des articles', to: '/moderation/posts', icon: 'file-eye-outline' },
    ],
  },
  {
    title: 'Utilisateurs',
    minRole: 'ROLE_MANAGER',
    items: [
      { label: 'Équipe & Comptes', to: '/users', icon: 'account-group-outline', exact: true },
      { label: 'Ajouter un membre', to: '/users/new', icon: 'account-plus-outline' },
    ],
  },
  {
    title: 'Configuration & SEO',
    minRole: 'ROLE_MANAGER',
    items: [{ label: 'SEO & Schémas JSON-LD', to: '/seo', icon: 'search-web' }],
  },
  {
    title: 'Super Admin',
    minRole: 'ROLE_SUPER_ADMIN',
    items: [
      { label: 'Aperçu des e-mails', to: '/admin/emails', icon: 'email-search-outline' },
      { label: "Logs de l'API", to: '/admin/logs', icon: 'text-box-search-outline' },
    ],
  },
];
