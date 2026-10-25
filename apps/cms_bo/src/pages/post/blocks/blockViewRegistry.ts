import { BlockType } from '@/types';
import { ComponentType } from 'react';
import { BlockData } from './blockEditors';
import {
  BlockViewProps,
  CarouselBlockView,
  CodeBlockView,
  CtaBlockView,
  FaqBlockView,
  GalleryBlockView,
  ImageBlockView,
  QuoteBlockView,
  TableBlockView,
  TextBlockView,
  VideoBlockView,
} from './BlockViews';

const view = <T,>(Component: ComponentType<BlockViewProps<T>>) =>
  Component as unknown as ComponentType<BlockViewProps<BlockData>>;

/**
 * Registre BlockType → rendu de lecture (aperçu de l'article)
 */
export const BLOCK_VIEWS: Record<BlockType, ComponentType<BlockViewProps<BlockData>>> = {
  text: view(TextBlockView),
  image: view(ImageBlockView),
  code: view(CodeBlockView),
  quote: view(QuoteBlockView),
  video: view(VideoBlockView),
  gallery: view(GalleryBlockView),
  carousel: view(CarouselBlockView),
  table: view(TableBlockView),
  faq: view(FaqBlockView),
  cta: view(CtaBlockView),
};
