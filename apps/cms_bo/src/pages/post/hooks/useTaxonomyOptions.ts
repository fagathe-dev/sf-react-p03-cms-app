import { fetchCategories } from '@/services/category.api';
import { fetchTags } from '@/services/tag.api';
import { CategorySummary, TagSummary } from '@/types';
import { useEffect, useState } from 'react';

interface TaxonomyOptions {
  categories: CategorySummary[];
  tags: TagSummary[];
  error: string | null;
}

const MAX_OPTIONS = 100;

/**
 * Catégories et tags proposés dans l'éditeur d'article
 */
export const useTaxonomyOptions = () => {
  const [options, setOptions] = useState<TaxonomyOptions | null>(null);

  useEffect(() => {
    let cancelled = false;

    Promise.all([fetchCategories(undefined, MAX_OPTIONS), fetchTags(undefined, MAX_OPTIONS)])
      .then(([categories, tags]) => {
        if (!cancelled) setOptions({ categories, tags, error: null });
      })
      .catch((err) => {
        if (!cancelled) {
          setOptions({
            categories: [],
            tags: [],
            error: err instanceof Error ? err.message : 'Erreur lors du chargement des taxonomies',
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    categories: options?.categories ?? [],
    tags: options?.tags ?? [],
    isLoading: options === null,
    error: options?.error ?? null,
  };
};
