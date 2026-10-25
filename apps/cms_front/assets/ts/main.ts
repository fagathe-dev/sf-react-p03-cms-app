// =============================================================================
// main.ts — Orchestrateur chargé sur toutes les pages (public/js/main.js)
// -----------------------------------------------------------------------------
// interactions/events/      gestionnaires délégués sur document (une seule pose)
// interactions/components/  comportement d'un composant, init*(root) idempotent
// services/                 état partagé, instance unique
// components/               classes qui créent du DOM
// pages/                    un script par page, point d'entrée à part
// =============================================================================

import { initCsrfProtection } from './interactions/events/csrf-protection';

const initUI = (): void => {
  initCsrfProtection();
};

// Les scripts type="module" sont différés : le DOM est déjà analysé à l'exécution
initUI();
