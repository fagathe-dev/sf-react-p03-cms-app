import { BlockType } from '@/types';
import {
  BlockTypeDefinition,
  CarouselBlock,
  CodeBlock,
  createDefaultFaqBlockData,
  CtaBlock,
  DEFAULT_CAROUSEL_BLOCK_DATA,
  DEFAULT_CMS_BLOCKS,
  DEFAULT_CODE_BLOCK_DATA,
  DEFAULT_CTA_BLOCK_DATA,
  DEFAULT_GALLERY_BLOCK_DATA,
  DEFAULT_IMAGE_BLOCK_DATA,
  DEFAULT_QUOTE_BLOCK_DATA,
  DEFAULT_TABLE_BLOCK_DATA,
  DEFAULT_TEXT_BLOCK_DATA,
  DEFAULT_VIDEO_BLOCK_DATA,
  FaqBlock,
  GalleryBlock,
  ImageBlock,
  MediaUploadHandler,
  QuoteBlock,
  TableBlock,
  TextBlock,
  VideoBlock,
} from '@/ui/components';
import { ComponentType } from 'react';

export type BlockData = Record<string, unknown>;

export interface BlockEditorProps {
  data: BlockData;
  onChange: (data: BlockData) => void;
  onUpload?: MediaUploadHandler;
}

export interface BlockEditorEntry {
  definition: BlockTypeDefinition;
  Editor: ComponentType<BlockEditorProps>;
  createData: () => BlockData;
}

interface TypedEditorProps<T> {
  data: T;
  onChange: (data: T) => void;
  onUpload?: MediaUploadHandler;
}

const definitionOf = (type: BlockType): BlockTypeDefinition =>
  DEFAULT_CMS_BLOCKS.find((definition) => definition.type === type) ?? { type, label: type, icon: 'cube-outline' };

// Le JSON d'un bloc est libre côté API : chaque éditeur reçoit ses propres données typées
const entry = <T extends object>(
  type: BlockType,
  Editor: ComponentType<TypedEditorProps<T>>,
  createData: () => T
): BlockEditorEntry => ({
  definition: definitionOf(type),
  Editor: Editor as unknown as ComponentType<BlockEditorProps>,
  createData: () => ({ ...createData() }) as BlockData,
});

/**
 * Registre BlockType → éditeur. Ajouter un type de bloc = ajouter une entrée, sans toucher au canvas.
 */
export const BLOCK_EDITORS: Record<BlockType, BlockEditorEntry> = {
  text: entry('text', TextBlock, () => DEFAULT_TEXT_BLOCK_DATA),
  image: entry('image', ImageBlock, () => DEFAULT_IMAGE_BLOCK_DATA),
  code: entry('code', CodeBlock, () => DEFAULT_CODE_BLOCK_DATA),
  quote: entry('quote', QuoteBlock, () => DEFAULT_QUOTE_BLOCK_DATA),
  video: entry('video', VideoBlock, () => DEFAULT_VIDEO_BLOCK_DATA),
  gallery: entry('gallery', GalleryBlock, () => ({ ...DEFAULT_GALLERY_BLOCK_DATA, images: [] })),
  carousel: entry('carousel', CarouselBlock, () => ({ ...DEFAULT_CAROUSEL_BLOCK_DATA, slides: [] })),
  table: entry('table', TableBlock, () => ({
    ...DEFAULT_TABLE_BLOCK_DATA,
    rows: DEFAULT_TABLE_BLOCK_DATA.rows.map((row) => [...row]),
  })),
  faq: entry('faq', FaqBlock, createDefaultFaqBlockData),
  cta: entry('cta', CtaBlock, () => DEFAULT_CTA_BLOCK_DATA),
};

export const isBlockType = (type: string): type is BlockType => type in BLOCK_EDITORS;

/** Types proposés dans le BlockPicker, dans l'ordre du registre */
export const AVAILABLE_BLOCKS: BlockTypeDefinition[] = Object.values(BLOCK_EDITORS).map((item) => item.definition);
