import { fetchCategories } from '@/services/category.api';
import { fetchPosts } from '@/services/post.api';
import { fetchTags } from '@/services/tag.api';
import { SeoTargetType } from '@/types';
import { useEffect, useState } from 'react';
import { STATIC_PAGES } from '../constants';

export interface SeoTargetOption {
  value: string;
  label: string;
}

const MAX_OPTIONS = 100;

/**
 * Registre des cibles sélectionnables par type : les identifiants attendus par l'API sont les UUID
 * (article, catégorie, tag) ou la clé de page (page statique). `null` = saisie libre de l'identifiant.
 */
const OPTION_LOADERS: Record<SeoTargetType, () => Promise<SeoTargetOption[] | null>> = {
  static_page: async () => STATIC_PAGES.map((page) => ({ value: page.key, label: `${page.label} (${page.path})` })),
  category: async () => (await fetchCategories(undefined, MAX_OPTIONS)).map((c) => ({ value: c.id, label: c.name })),
  tag: async () => (await fetchTags(undefined, MAX_OPTIONS)).map((t) => ({ value: t.id, label: t.name })),
  post: async () => (await fetchPosts(undefined, 1, MAX_OPTIONS)).items.map((p) => ({ value: p.id, label: p.title })),
  // Aucune liste d'utilisateurs exploitable ici : saisie libre de l'UUID
  user_profile: async () => null,
};

interface OptionsResult {
  type: SeoTargetType;
  options: SeoTargetOption[] | null;
  error: string | null;
}

export const useSeoTargetOptions = (type: SeoTargetType) => {
  const [result, setResult] = useState<OptionsResult | null>(null);

  useEffect(() => {
    let cancelled = false;

    OPTION_LOADERS[type]()
      .then((options) => {
        if (!cancelled) setResult({ type, options, error: null });
      })
      .catch((err) => {
        if (!cancelled) {
          setResult({ type, options: [], error: err instanceof Error ? err.message : 'Erreur lors du chargement' });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [type]);

  const isLoading = result?.type !== type;

  return {
    options: isLoading ? [] : result.options,
    isLoading,
    error: isLoading ? null : result.error,
  };
};
