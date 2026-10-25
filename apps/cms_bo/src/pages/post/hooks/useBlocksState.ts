import { BlocContent, BlockType, SaveBlocContentPayload } from '@/types';
import { createBlockItemId } from '@/ui/components';
import { arrayMove } from '@dnd-kit/sortable';
import { useCallback, useMemo, useState } from 'react';
import { BLOCK_EDITORS, BlockData, isBlockType } from '../blocks';

export interface EditorBlock {
  /** Clé React stable, y compris pour un bloc pas encore enregistré */
  key: string;
  /** UUID du bloc en base (`null` tant qu'il n'est pas enregistré) */
  id: string | null;
  type: BlockType;
  data: BlockData;
  settings: Record<string, unknown> | null;
}

const toEditorBlocks = (blocks: BlocContent[]): EditorBlock[] =>
  [...blocks]
    .sort((a, b) => a.position - b.position)
    .filter((block) => isBlockType(block.type))
    .map((block) => ({
      key: block.id,
      id: block.id,
      type: block.type,
      // Complète les données incomplètes avec les valeurs par défaut du type
      data: { ...BLOCK_EDITORS[block.type].createData(), ...block.data },
      settings: block.settings ?? null,
    }));

const serialize = (blocks: EditorBlock[]) =>
  JSON.stringify(blocks.map(({ id, type, data, settings }) => ({ id, type, data, settings })));

/**
 * État local des blocs de l'éditeur : ajout, édition, réordonnancement, suppression et détection des
 * modifications non enregistrées. L'ensemble est envoyé en une fois via SavePostDto::$blocks.
 */
export const useBlocksState = (initialBlocks: BlocContent[]) => {
  const [blocks, setBlocks] = useState<EditorBlock[]>(() => toEditorBlocks(initialBlocks));
  const [snapshot, setSnapshot] = useState(() => serialize(toEditorBlocks(initialBlocks)));

  /** Insère un bloc vide à `index` (à la fin par défaut) et renvoie sa clé */
  const addBlock = useCallback((type: BlockType, index?: number): string => {
    const block: EditorBlock = {
      key: createBlockItemId(),
      id: null,
      type,
      data: BLOCK_EDITORS[type].createData(),
      settings: null,
    };
    setBlocks((current) => {
      const at = index === undefined ? current.length : Math.max(0, Math.min(index, current.length));
      return [...current.slice(0, at), block, ...current.slice(at)];
    });
    return block.key;
  }, []);

  const updateBlock = useCallback((key: string, data: BlockData) => {
    setBlocks((current) => current.map((block) => (block.key === key ? { ...block, data } : block)));
  }, []);

  const moveBlock = useCallback((key: string, direction: -1 | 1) => {
    setBlocks((current) => {
      const index = current.findIndex((block) => block.key === key);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= current.length) return current;

      const next = [...current];
      [next[index], next[target]] = [next[target]!, next[index]!];
      return next;
    });
  }, []);

  /** Glisser-déposer : place le bloc `activeKey` à la position du bloc `overKey` */
  const reorderBlocks = useCallback((activeKey: string, overKey: string) => {
    if (activeKey === overKey) return;
    setBlocks((current) => {
      const from = current.findIndex((block) => block.key === activeKey);
      const to = current.findIndex((block) => block.key === overKey);
      return from < 0 || to < 0 ? current : arrayMove(current, from, to);
    });
  }, []);

  const removeBlock = useCallback((key: string) => {
    setBlocks((current) => current.filter((block) => block.key !== key));
  }, []);

  /** Réinitialise l'état à partir des blocs renvoyés par l'API après enregistrement */
  const resetBlocks = useCallback((saved: BlocContent[]) => {
    const next = toEditorBlocks(saved);
    setBlocks(next);
    setSnapshot(serialize(next));
  }, []);

  const isDirty = useMemo(() => serialize(blocks) !== snapshot, [blocks, snapshot]);

  const toPayload = useCallback(
    (): SaveBlocContentPayload[] =>
      blocks.map((block, index) => ({
        id: block.id,
        type: block.type,
        position: index + 1,
        data: block.data,
        settings: block.settings,
      })),
    [blocks]
  );

  return { blocks, addBlock, updateBlock, moveBlock, reorderBlocks, removeBlock, resetBlocks, isDirty, toPayload };
};
