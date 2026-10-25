import { TaxonomySearchBar } from '@/pages/taxonomy/components';
import { SegmentedControl } from '@/ui/components';
import { useSearchParams } from 'react-router-dom';
import { POST_LIST_FILTERS, PostListFilterValue } from '../constants';
import * as S from './Post.styles';

interface PostListToolbarProps {
  /** Filtre de statut courant ; omis = pas de sélecteur (archives, corbeille) */
  filter?: PostListFilterValue;
  searchPlaceholder?: string;
}

/**
 * Filtres de liste synchronisés avec l'URL : `?status=` et `?q=` (changer de filtre revient à la page 1)
 */
export const PostListToolbar = ({ filter, searchPlaceholder = 'Rechercher un article…' }: PostListToolbarProps) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const changeFilter = (next: PostListFilterValue) => {
    const params = new URLSearchParams(searchParams);
    if (next === 'all') params.delete('status');
    else params.set('status', next);
    params.delete('page');
    setSearchParams(params, { replace: true });
  };

  return (
    <S.Toolbar>
      {filter ? (
        <SegmentedControl
          aria-label="Filtrer par statut"
          size="sm"
          options={POST_LIST_FILTERS.map((option) => ({ value: option.value, label: option.label, icon: option.icon }))}
          value={filter}
          onChange={changeFilter}
        />
      ) : (
        <span />
      )}
      <TaxonomySearchBar placeholder={searchPlaceholder} />
    </S.Toolbar>
  );
};
