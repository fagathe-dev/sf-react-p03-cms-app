import { useCallback, useMemo, useState } from 'react';
import { DashboardColumn, DashboardWidgetDefinition } from '../widgets/types';

export interface DashboardLayoutPrefs {
  /** Ordre des widgets par colonne (ids) */
  order: Record<DashboardColumn, string[]>;
  hidden: string[];
  collapsed: string[];
  welcomeDismissed: boolean;
}

const DEFAULT_PREFS: DashboardLayoutPrefs = {
  order: { main: [], side: [] },
  hidden: [],
  collapsed: [],
  welcomeDismissed: false,
};

const STORAGE_PREFIX = 'cms_bo.dashboard.layout.';

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string');

/** Lecture tolérante : stockage indisponible, JSON corrompu ou format ancien → valeurs par défaut */
const readPrefs = (key: string): DashboardLayoutPrefs => {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return DEFAULT_PREFS;

    const parsed = JSON.parse(raw) as Partial<DashboardLayoutPrefs>;
    return {
      order: {
        main: isStringArray(parsed.order?.main) ? parsed.order.main : [],
        side: isStringArray(parsed.order?.side) ? parsed.order.side : [],
      },
      hidden: isStringArray(parsed.hidden) ? parsed.hidden : [],
      collapsed: isStringArray(parsed.collapsed) ? parsed.collapsed : [],
      welcomeDismissed: parsed.welcomeDismissed === true,
    };
  } catch {
    return DEFAULT_PREFS;
  }
};

const writePrefs = (key: string, prefs: DashboardLayoutPrefs): void => {
  try {
    window.localStorage.setItem(key, JSON.stringify(prefs));
  } catch {
    // Stockage indisponible (navigation privée, quota) : les préférences restent en mémoire pour la session
  }
};

const toggleId = (ids: string[], id: string, enabled: boolean): string[] =>
  enabled ? [...new Set([...ids, id])] : ids.filter((item) => item !== id);

/**
 * Trie les widgets d'une colonne selon l'ordre enregistré ; un widget inconnu des préférences
 * (nouveau dans le registre) garde sa place relative du registre, après les widgets ordonnés.
 */
const sortByPrefs = (widgets: DashboardWidgetDefinition[], order: string[]): DashboardWidgetDefinition[] => {
  const rank = (id: string) => {
    const index = order.indexOf(id);
    return index === -1 ? Number.MAX_SAFE_INTEGER : index;
  };
  return [...widgets].sort((a, b) => rank(a.id) - rank(b.id));
};

/**
 * Préférences d'affichage du dashboard (ordre par colonne, widgets masqués et repliés, bienvenue ignorée),
 * persistées dans le localStorage par utilisateur : cms_bo.dashboard.layout.<userId>.
 */
export const useDashboardLayout = (userId: string | undefined) => {
  const key = `${STORAGE_PREFIX}${userId ?? 'anonymous'}`;
  const [stored, setStored] = useState(() => ({ key, prefs: readPrefs(key) }));

  // Changement d'utilisateur : ses propres préférences sont relues
  const prefs = stored.key === key ? stored.prefs : readPrefs(key);

  const update = useCallback(
    (updater: (current: DashboardLayoutPrefs) => DashboardLayoutPrefs) => {
      setStored((current) => {
        const next = updater(current.key === key ? current.prefs : readPrefs(key));
        writePrefs(key, next);
        return { key, prefs: next };
      });
    },
    [key]
  );

  /** Widgets affichés d'une colonne, dans l'ordre de l'utilisateur */
  const getColumnWidgets = useCallback(
    (widgets: DashboardWidgetDefinition[], column: DashboardColumn) =>
      sortByPrefs(
        widgets.filter((widget) => widget.column === column && !prefs.hidden.includes(widget.id)),
        prefs.order[column]
      ),
    [prefs]
  );

  /** Monte (-1) ou descend (+1) un widget parmi les widgets affichés de sa colonne */
  const moveWidget = useCallback(
    (displayed: DashboardWidgetDefinition[], column: DashboardColumn, id: string, direction: -1 | 1) => {
      const ids = displayed.map((widget) => widget.id);
      const index = ids.indexOf(id);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= ids.length) return;

      [ids[index], ids[target]] = [ids[target]!, ids[index]!];
      update((current) => ({
        ...current,
        // Les widgets masqués ou indisponibles conservent leur position relative, après les affichés
        order: { ...current.order, [column]: [...ids, ...current.order[column].filter((item) => !ids.includes(item))] },
      }));
    },
    [update]
  );

  const setWidgetVisible = useCallback(
    (id: string, visible: boolean) => update((current) => ({ ...current, hidden: toggleId(current.hidden, id, !visible) })),
    [update]
  );

  const setWidgetCollapsed = useCallback(
    (id: string, collapsed: boolean) =>
      update((current) => ({ ...current, collapsed: toggleId(current.collapsed, id, collapsed) })),
    [update]
  );

  const setWelcomeDismissed = useCallback(
    (dismissed: boolean) => update((current) => ({ ...current, welcomeDismissed: dismissed })),
    [update]
  );

  return useMemo(
    () => ({
      prefs,
      isHidden: (id: string) => prefs.hidden.includes(id),
      isCollapsed: (id: string) => prefs.collapsed.includes(id),
      getColumnWidgets,
      moveWidget,
      setWidgetVisible,
      setWidgetCollapsed,
      setWelcomeDismissed,
    }),
    [prefs, getColumnWidgets, moveWidget, setWidgetVisible, setWidgetCollapsed, setWelcomeDismissed]
  );
};
