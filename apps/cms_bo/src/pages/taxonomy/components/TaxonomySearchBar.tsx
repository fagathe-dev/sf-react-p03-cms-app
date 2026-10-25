import { Icon, Input, InputGroup } from '@/ui/components';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

const SEARCH_DEBOUNCE_MS = 300;

interface TaxonomySearchBarProps {
  placeholder: string;
}

/**
 * Champ de recherche full-text synchronisé avec le paramètre d'URL `?q=`
 */
export const TaxonomySearchBar = ({ placeholder }: TaxonomySearchBarProps) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') ?? '';
  const [value, setValue] = useState(query);
  const [syncedQuery, setSyncedQuery] = useState(query);

  // Resynchronisation si l'URL change (navigation arrière, lien direct)
  if (query !== syncedQuery) {
    setSyncedQuery(query);
    setValue(query);
  }

  useEffect(() => {
    const trimmed = value.trim();
    if (trimmed === query) return;

    const timeout = window.setTimeout(() => {
      // Conserve les autres filtres de l'URL ; une nouvelle recherche repart de la page 1
      setSearchParams(
        (current) => {
          const params = new URLSearchParams(current);
          if (trimmed) params.set('q', trimmed);
          else params.delete('q');
          params.delete('page');
          return params;
        },
        { replace: true }
      );
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timeout);
  }, [value, query, setSearchParams]);

  return (
    <InputGroup leftAddon={<Icon name="magnify" size={18} />}>
      <Input
        type="search"
        aria-label={placeholder}
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
    </InputGroup>
  );
};
