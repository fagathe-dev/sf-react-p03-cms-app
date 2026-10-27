import { fetchLogFile, fetchLogTree } from '@/services/log.api';
import { LogDate, LogEntry } from '@/types';
import { Alert, Button, Card, EmptyState, Loading, Select, Text, Title } from '@/ui/components';
import { useCallback, useEffect, useState } from 'react';
import { LogFilePanel, LogTree } from './components';
import { formatLogDate } from './components/logFormat';
import * as S from './Admin.styles';

/**
 * Consultation des logs JSON de l'API (Fagathe\CorePhp\Logger), groupés par date et par fichier — ROLE_SUPER_ADMIN.
 */
export const LogsPage = () => {
  const [tree, setTree] = useState<LogDate[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isTreeLoading, setIsTreeLoading] = useState(true);
  const [isFileLoading, setIsFileLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const applyTree = useCallback((data: LogDate[]) => {
    setTree(data);
    // Conserve la date sélectionnée si elle existe toujours
    setSelectedDate((current) =>
      current && data.some((item) => item.date === current) ? current : (data[0]?.date ?? null)
    );
  }, []);

  const treeErrorMessage = (err: unknown) =>
    err instanceof Error ? err.message : 'Erreur lors de la récupération des logs.';

  // Chargement initial (isTreeLoading vaut déjà true au montage)
  useEffect(() => {
    let cancelled = false;

    fetchLogTree()
      .then((data) => {
        if (!cancelled) applyTree(data);
      })
      .catch((err) => {
        if (!cancelled) setError(treeErrorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setIsTreeLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [applyTree]);

  const loadFile = useCallback(async (date: string, path: string) => {
    setIsFileLoading(true);
    setError(null);
    try {
      setLogs(await fetchLogFile(date, path));
    } catch (err) {
      setLogs([]);
      setError(err instanceof Error ? err.message : 'Erreur lors de la lecture du fichier de log.');
    } finally {
      setIsFileLoading(false);
    }
  }, []);

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    setSelectedPath(null);
    setLogs([]);
  };

  const handleSelectFile = (path: string) => {
    if (!selectedDate) return;
    setSelectedPath(path);
    void loadFile(selectedDate, path);
  };

  const handleRefresh = async () => {
    setIsTreeLoading(true);
    try {
      applyTree(await fetchLogTree());
    } catch (err) {
      setError(treeErrorMessage(err));
    } finally {
      setIsTreeLoading(false);
    }
    if (selectedDate && selectedPath) await loadFile(selectedDate, selectedPath);
  };

  const currentDate = tree.find((item) => item.date === selectedDate) ?? null;

  return (
    <S.PageWrapper>
      <S.HeaderRow>
        <div>
          <Title as="h1">Logs de l'API</Title>
          <Text color="muted" size="sm">
            Journaux JSON générés par le Logger, groupés par date et par fichier.
          </Text>
        </div>
        <Button type="button" variant="outline" onClick={() => void handleRefresh()} loading={isTreeLoading || isFileLoading}>
          Actualiser
        </Button>
      </S.HeaderRow>

      {error && (
        <Alert variant="danger" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {isTreeLoading && tree.length === 0 ? (
        <S.CenteredBox>
          <Loading size="lg" />
        </S.CenteredBox>
      ) : tree.length === 0 ? (
        <EmptyState icon="text-box-search-outline" title="Aucun log" description="Aucun fichier de log n'a été trouvé." />
      ) : (
        <S.SplitLayout $asideWidth="300px">
          <Card>
            <S.Panel>
              <Select
                aria-label="Date des logs"
                value={selectedDate ?? ''}
                onChange={(e) => handleDateChange(e.target.value)}
              >
                {tree.map(({ date, count }) => (
                  <option key={date} value={date}>
                    {formatLogDate(date)} ({count})
                  </option>
                ))}
              </Select>

              {currentDate && (
                <LogTree
                  key={currentDate.date}
                  nodes={currentDate.items}
                  selectedPath={selectedPath}
                  onSelect={handleSelectFile}
                />
              )}
            </S.Panel>
          </Card>

          <Card>
            <S.Panel>
              {selectedPath ? (
                <LogFilePanel
                  key={`${selectedDate}-${selectedPath}`}
                  path={selectedPath}
                  logs={logs}
                  isLoading={isFileLoading}
                />
              ) : (
                <EmptyState
                  icon="file-document-outline"
                  title="Aucun fichier sélectionné"
                  description="Choisissez un fichier de log dans l'arborescence."
                />
              )}
            </S.Panel>
          </Card>
        </S.SplitLayout>
      )}
    </S.PageWrapper>
  );
};
