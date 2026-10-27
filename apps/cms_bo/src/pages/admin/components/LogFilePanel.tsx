import { LogEntry, LogLevel } from '@/types';
import { Accordion, Badge, EmptyState, Input, Loading, SegmentedControl, Title } from '@/ui/components';
import { useMemo, useState } from 'react';
import styled from 'styled-components';
import { LogEntryItem } from './LogEntryItem';
import { LOG_LEVELS } from './logFormat';

type LevelFilter = 'all' | LogLevel;

const LEVEL_OPTIONS: Array<{ value: LevelFilter; label: string }> = [
  { value: 'all', label: 'Tous' },
  ...LOG_LEVELS.map((level) => ({ value: level, label: level.charAt(0).toUpperCase() + level.slice(1) })),
];

const FileTitle = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing[2]};
  min-width: 0;
  overflow-wrap: anywhere;
`;

const Toolbar = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing[3]};
`;

const SearchInput = styled(Input)`
  flex: 1 1 220px;
`;

const CenteredBox = styled.div`
  display: grid;
  place-items: center;
  height: 160px;
`;

interface LogFilePanelProps {
  /** Chemin pointé du fichier, ex: service.post-service */
  path: string;
  logs: LogEntry[];
  isLoading: boolean;
}

/**
 * Entrées d'un fichier de log avec filtres par niveau et recherche plein texte.
 * La page lui donne une `key` par fichier : les filtres repartent à zéro à chaque changement de fichier.
 */
export const LogFilePanel = ({ path, logs, isLoading }: LogFilePanelProps) => {
  const [levelFilter, setLevelFilter] = useState<LevelFilter>('all');
  const [search, setSearch] = useState('');

  const filteredLogs = useMemo(() => {
    const term = search.trim().toLowerCase();

    return logs.filter((log) => {
      if (levelFilter !== 'all' && log.level !== levelFilter) return false;
      if (!term) return true;
      return JSON.stringify([log.content, log.context]).toLowerCase().includes(term);
    });
  }, [logs, levelFilter, search]);

  return (
    <>
      <FileTitle>
        <Title as="h4" style={{ margin: 0 }}>
          {path.replaceAll('.', ' / ')}
        </Title>
        <Badge variant="neutral" pill>
          {filteredLogs.length} / {logs.length}
        </Badge>
      </FileTitle>

      <Toolbar>
        <SegmentedControl
          aria-label="Filtrer par niveau"
          size="sm"
          options={LEVEL_OPTIONS}
          value={levelFilter}
          onChange={setLevelFilter}
        />
        <SearchInput
          type="search"
          placeholder="Rechercher (message, action, données…)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </Toolbar>

      {isLoading ? (
        <CenteredBox>
          <Loading size="lg" />
        </CenteredBox>
      ) : filteredLogs.length === 0 ? (
        <EmptyState icon="filter-off-outline" title="Aucune entrée" description="Aucun log ne correspond aux filtres." />
      ) : (
        <Accordion multiple>
          {filteredLogs.map((log, index) => {
            const itemKey = `${log.id ?? 'log'}-${index}`;
            return <LogEntryItem key={itemKey} itemKey={itemKey} log={log} />;
          })}
        </Accordion>
      )}
    </>
  );
};
