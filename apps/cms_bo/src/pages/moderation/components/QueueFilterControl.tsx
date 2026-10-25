import { SegmentedControl } from '@/ui/components';
import { useSearchParams } from 'react-router-dom';
import { QueueFilter } from '../constants';

interface QueueFilterControlProps<TValue extends string, TItem> {
  filters: QueueFilter<TValue, TItem>[];
  value: TValue;
}

/**
 * Sélecteur de file de modération synchronisé avec le paramètre d'URL `?filter=`
 */
export const QueueFilterControl = <TValue extends string, TItem>({
  filters,
  value,
}: QueueFilterControlProps<TValue, TItem>) => {
  const [, setSearchParams] = useSearchParams();

  return (
    <SegmentedControl
      aria-label="Filtrer la file de modération"
      options={filters.map((filter) => ({ value: filter.value, label: filter.label, icon: filter.icon }))}
      value={value}
      onChange={(next) => setSearchParams({ filter: next }, { replace: true })}
    />
  );
};
