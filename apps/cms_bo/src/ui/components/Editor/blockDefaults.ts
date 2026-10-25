import type { CarouselBlockData } from './CarouselBlock';
import type { CodeBlockData } from './CodeBlock';
import type { CtaBlockData } from './CtaBlock';
import type { FaqBlockData } from './FaqBlock';
import type { GalleryBlockData } from './GalleryBlock';
import type { ImageBlockData } from './ImageBlock';
import type { QuoteBlockData } from './QuoteBlock';
import type { TableBlockData } from './TableBlock';
import type { TextBlockData } from './TextBlock';
import type { VideoBlockData } from './VideoBlock';
import { createBlockItemId } from './blockItemId';

export interface BlockTypeDefinition {
  type: string;
  label: string;
  icon: string;
  description?: string;
}

/**
 * Miroir de Fagathe\CmsCore\Enum\Post\BlockType
 */
export const DEFAULT_CMS_BLOCKS: BlockTypeDefinition[] = [
  { type: 'text', label: 'Texte', icon: 'format-pilcrow', description: 'Paragraphes en Markdown' },
  { type: 'image', label: 'Image', icon: 'image-outline', description: 'Image avec légende' },
  { type: 'code', label: 'Code', icon: 'code-tags', description: 'Extrait de code source' },
  { type: 'quote', label: 'Citation', icon: 'format-quote-close', description: 'Citation et auteur' },
  { type: 'video', label: 'Vidéo', icon: 'video-outline', description: 'Fichier ou URL vidéo' },
  { type: 'gallery', label: 'Galerie', icon: 'view-grid-outline', description: "Grille d'images" },
  { type: 'carousel', label: 'Carrousel', icon: 'view-carousel-outline', description: 'Diaporama d’images' },
  { type: 'table', label: 'Tableau', icon: 'table', description: 'Données en lignes et colonnes' },
  { type: 'faq', label: 'FAQ', icon: 'help-circle-outline', description: 'Questions / réponses' },
  { type: 'cta', label: 'Appel à l’action', icon: 'bullhorn-outline', description: 'Encart avec bouton' },
];

// --- Données initiales de chaque type de bloc ---

export const DEFAULT_TEXT_BLOCK_DATA: TextBlockData = { content: '' };

export const DEFAULT_IMAGE_BLOCK_DATA: ImageBlockData = { url: '', alt: '', caption: '', aspectRatio: '16/9' };

export const DEFAULT_VIDEO_BLOCK_DATA: VideoBlockData = { url: '', caption: '', aspectRatio: '16/9' };

export const DEFAULT_CAROUSEL_BLOCK_DATA: CarouselBlockData = {
  slides: [],
  aspectRatio: '16/9',
  autoplay: false,
  slideInterval: 4000,
};

export const DEFAULT_GALLERY_BLOCK_DATA: GalleryBlockData = { images: [], columns: 3 };

export const DEFAULT_CODE_BLOCK_DATA: CodeBlockData = { language: 'typescript', code: '', filename: '' };

export const DEFAULT_QUOTE_BLOCK_DATA: QuoteBlockData = { text: '', author: '', source: '' };

export const DEFAULT_TABLE_BLOCK_DATA: TableBlockData = {
  rows: [
    ['Colonne 1', 'Colonne 2'],
    ['', ''],
  ],
  hasHeader: true,
  caption: '',
};

export const createDefaultFaqBlockData = (): FaqBlockData => ({
  items: [{ id: createBlockItemId(), question: '', answer: '' }],
});

export const DEFAULT_CTA_BLOCK_DATA: CtaBlockData = {
  title: '',
  description: '',
  buttonLabel: '',
  buttonUrl: '',
  variant: 'primary',
};

export const CODE_LANGUAGES: { value: string; label: string }[] = [
  { value: 'typescript', label: 'TypeScript' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'tsx', label: 'TSX / JSX' },
  { value: 'php', label: 'PHP' },
  { value: 'twig', label: 'Twig' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS / SCSS' },
  { value: 'json', label: 'JSON' },
  { value: 'yaml', label: 'YAML' },
  { value: 'sql', label: 'SQL' },
  { value: 'bash', label: 'Bash / Shell' },
  { value: 'plaintext', label: 'Texte brut' },
];
