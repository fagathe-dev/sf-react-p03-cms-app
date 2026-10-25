import { BlockType } from '@/types';
import { BlockPicker, BlockWrapper, ConfirmDialog, EmptyState, MediaUploadHandler } from '@/ui/components';
import {
  Announcements,
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  ScreenReaderInstructions,
  UniqueIdentifier,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CSSProperties, Fragment, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AVAILABLE_BLOCKS, BLOCK_EDITORS, BlockData, isBlockType } from '../../blocks';
import { EditorBlock } from '../../hooks';
import * as S from '../Post.styles';

interface BlockItemProps {
  block: EditorBlock;
  index: number;
  count: number;
  /** Bloc tout juste inséré : amené à l'écran et premier champ focalisé */
  isNew: boolean;
  onUpload?: MediaUploadHandler;
  onChange: (key: string, data: BlockData) => void;
  onMove: (key: string, direction: -1 | 1) => void;
  onDelete: (block: EditorBlock) => void;
}

// Mémoïsé : modifier un bloc ne re-rend pas les autres (callbacks stables via useBlocksState)
const BlockItem = memo(({ block, index, count, isNew, onUpload, onChange, onMove, onDelete }: BlockItemProps) => {
  const { Editor, definition } = BLOCK_EDITORS[block.type];
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: block.key,
  });
  const nodeRef = useRef<HTMLDivElement | null>(null);

  const setRefs = useCallback(
    (node: HTMLDivElement | null) => {
      nodeRef.current = node;
      setNodeRef(node);
    },
    [setNodeRef]
  );

  useEffect(() => {
    const node = nodeRef.current;
    if (!isNew || !node) return;
    node.scrollIntoView({ behavior: 'smooth', block: 'center' });
    node.querySelector<HTMLElement>('textarea, input:not([type="file"]):not([type="hidden"]), select')?.focus({
      preventScroll: true,
    });
  }, [isNew]);

  // Translate (et non Transform) : évite d'étirer les blocs de hauteurs différentes pendant le déplacement
  const style: CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    position: 'relative',
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div ref={setRefs} style={style}>
      <BlockWrapper
        blockType={block.type}
        blockLabel={definition.label}
        position={index + 1}
        isFirst={index === 0}
        isLast={index === count - 1}
        isDragging={isDragging}
        dragHandleRef={setActivatorNodeRef}
        dragHandleProps={{ ...attributes, ...listeners, 'aria-label': `Déplacer le bloc ${index + 1} (${definition.label})` }}
        onMoveUp={() => onMove(block.key, -1)}
        onMoveDown={() => onMove(block.key, 1)}
        onDelete={() => onDelete(block)}
      >
        <Editor data={block.data} onChange={(data) => onChange(block.key, data)} onUpload={onUpload} />
      </BlockWrapper>
    </div>
  );
});

BlockItem.displayName = 'BlockItem';

const isEmptyData = (data: BlockData) =>
  Object.values(data).every((value) => value === '' || value === null || (Array.isArray(value) && value.length === 0));

const SCREEN_READER_INSTRUCTIONS: ScreenReaderInstructions = {
  draggable:
    "Pour déplacer un bloc, appuyez sur Espace ou Entrée, utilisez les flèches haut et bas, puis appuyez de nouveau sur Espace ou Entrée pour le déposer. Échap annule.",
};

interface BlockCanvasProps {
  blocks: EditorBlock[];
  /** Insère un bloc à `index` (à la fin si absent) et renvoie sa clé */
  onAdd: (type: BlockType, index?: number) => string;
  onChange: (key: string, data: BlockData) => void;
  onMove: (key: string, direction: -1 | 1) => void;
  onReorder: (activeKey: string, overKey: string) => void;
  onRemove: (key: string) => void;
  onUpload?: MediaUploadHandler;
}

export const BlockCanvas = ({ blocks, onAdd, onChange, onMove, onReorder, onRemove, onUpload }: BlockCanvasProps) => {
  const [toDelete, setToDelete] = useState<EditorBlock | null>(null);
  const [lastAddedKey, setLastAddedKey] = useState<string | null>(null);

  const insertBlock = useCallback(
    (type: string, index?: number) => {
      if (isBlockType(type)) setLastAddedKey(onAdd(type, index));
    },
    [onAdd]
  );

  const sensors = useSensors(
    // Le glisser ne démarre qu'après 6 px : un simple clic sur la poignée ne déplace rien
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const itemIds = useMemo(() => blocks.map((block) => block.key), [blocks]);

  // Annonces vocales : position « n sur total » plutôt que les identifiants techniques
  const announcements = useMemo<Announcements>(() => {
    const positionOf = (id: UniqueIdentifier | undefined) => itemIds.indexOf(String(id)) + 1;
    const total = itemIds.length;
    return {
      onDragStart: ({ active }) => `Bloc ${positionOf(active.id)} saisi.`,
      onDragOver: ({ active, over }) =>
        over ? `Bloc ${positionOf(active.id)} au-dessus de la position ${positionOf(over.id)} sur ${total}.` : undefined,
      onDragEnd: ({ active, over }) =>
        over ? `Bloc déposé en position ${positionOf(over.id)} sur ${total}.` : `Bloc ${positionOf(active.id)} relâché.`,
      onDragCancel: ({ active }) => `Déplacement annulé, le bloc ${positionOf(active.id)} reste à sa place.`,
    };
  }, [itemIds]);

  const handleDragEnd = useCallback(
    ({ active, over }: DragEndEvent) => {
      if (over && active.id !== over.id) onReorder(String(active.id), String(over.id));
    },
    [onReorder]
  );

  // Un bloc encore vide est supprimé sans confirmation
  const requestDelete = useCallback(
    (block: EditorBlock) => {
      if (isEmptyData(block.data)) onRemove(block.key);
      else setToDelete(block);
    },
    [onRemove]
  );

  return (
    <S.Stack>
      {blocks.length === 0 ? (
        <EmptyState
          icon="view-dashboard-variant-outline"
          title="Cet article ne contient encore aucun bloc"
          description="Ajoutez un premier bloc de texte, d'image ou de code avec le sélecteur ci-dessous."
        />
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          accessibility={{ announcements, screenReaderInstructions: SCREEN_READER_INSTRUCTIONS }}
        >
          <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
            <S.Stack>
              {blocks.map((block, index) => (
                <Fragment key={block.key}>
                  {/* Insertion à la volée : avant chaque bloc (le bouton du bas ajoute à la fin) */}
                  <BlockPicker
                    variant="inline"
                    inlineLabel={`Insérer un bloc en position ${index + 1}`}
                    availableBlocks={AVAILABLE_BLOCKS}
                    onSelectBlock={(type) => insertBlock(type, index)}
                  />
                  <BlockItem
                    block={block}
                    index={index}
                    count={blocks.length}
                    isNew={block.key === lastAddedKey}
                    onUpload={onUpload}
                    onChange={onChange}
                    onMove={onMove}
                    onDelete={requestDelete}
                  />
                </Fragment>
              ))}
            </S.Stack>
          </SortableContext>
        </DndContext>
      )}

      <BlockPicker availableBlocks={AVAILABLE_BLOCKS} onSelectBlock={(type) => insertBlock(type)} />

      <ConfirmDialog
        isOpen={toDelete !== null}
        onClose={() => setToDelete(null)}
        onConfirm={() => {
          if (toDelete) onRemove(toDelete.key);
          setToDelete(null);
        }}
        title="Supprimer le bloc"
        message="Le contenu de ce bloc sera retiré de l'article au prochain enregistrement."
        confirmLabel="Supprimer"
      />
    </S.Stack>
  );
};
