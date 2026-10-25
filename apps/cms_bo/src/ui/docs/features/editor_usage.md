# Documentation des Composants du Block Editor (`docs/features/editor_usage.md`)

Ce document détaille les composants de l'éditeur modulaire de contenu (« Block Editor » façon Notion) :

* l'enveloppe et l'insertion : **`BlockWrapper`**, **`BlockPicker`** ;
* les éditeurs de bloc, un par `BlockType` de l'API : **`TextBlock`**, **`ImageBlock`**, **`VideoBlock`**, **`GalleryBlock`**, **`CarouselBlock`**, **`CodeBlock`**, **`QuoteBlock`**, **`TableBlock`**, **`FaqBlock`**, **`CtaBlock`** ;
* la source de média partagée : **`MediaSourceField`** ;
* les valeurs par défaut : **`blockDefaults`**.

**Règle d'import :**

```tsx
import {
  BlockPicker,
  BlockWrapper,
  DEFAULT_CMS_BLOCKS,
  ImageBlock,
  MediaSourceField,
  type BlockTypeDefinition,
  type MediaUploadHandler,
} from '@/ui/components';
```

> Les composants de l'UI kit ne connaissent pas l'API. Le téléversement de fichiers leur est injecté via la prop `onUpload` (voir §4), et l'association `BlockType → éditeur` est faite dans la fonctionnalité (`src/pages/post/blocks/blockEditors.ts`).

---

## 1. BlockWrapper (Coquille de bloc d'édition)

Enveloppe standardisée autour du formulaire de chaque bloc. Sa barre d'outils supérieure affiche :
* une poignée de glisser-déposer, **uniquement si `dragHandleProps` est fourni** (branchement `@dnd-kit/sortable`, voir §5) ;
* le numéro d'ordre (`#position`) et un `Badge` du type de bloc ;
* les boutons Monter / Descendre, Réglages (`Drawer`) et Supprimer.

### Props (`BlockWrapperProps`)

Hérite de `BaseComponentProps`.

| Prop | Type | Défaut | Description |
| :--- | :--- | :--- | :--- |
| `blockType` | `string` | — | Type du bloc (ex. `'text'`, `'code'`, `'image'`) |
| `blockLabel` | `string` | `blockType` en majuscules | Libellé lisible affiché dans le badge (ex. `'Citation'`) |
| `position` | `number` | — | Ordre d'affichage du bloc dans l'article (`1`, `2`, `3`…) |
| `isFirst` | `boolean` | `false` | Désactive « Monter » en première position |
| `isLast` | `boolean` | `false` | Désactive « Descendre » en dernière position |
| `onMoveUp` | `() => void` | `undefined` | Clic sur la flèche haute (bouton masqué si absent) |
| `onMoveDown` | `() => void` | `undefined` | Clic sur la flèche basse (bouton masqué si absent) |
| `onOpenSettings` | `() => void` | `undefined` | Clic sur l'engrenage (bouton masqué si absent) |
| `onDelete` | `() => void` | `undefined` | Clic sur la corbeille (bouton masqué si absent) |
| `dragHandleProps` | `React.HTMLAttributes<HTMLSpanElement>` | `undefined` | Attributs et écouteurs de la poignée (`{ ...attributes, ...listeners }` de `useSortable`). Sans eux, la poignée est masquée |
| `dragHandleRef` | `React.Ref<HTMLSpanElement>` | `undefined` | Ref de la poignée (`setActivatorNodeRef`) : le focus y revient après un déplacement au clavier |
| `isDragging` | `boolean` | `false` | Met le bloc en avant (bordure, ombre) pendant son déplacement |

---

## 2. BlockPicker (Sélecteur d'ajout de bloc)

Bouton d'insertion qui déploie une grille des types de blocs disponibles. Le choix d'un type appelle `onSelectBlock(type)` et referme la grille.

### Props (`BlockPickerProps`)

| Prop | Type | Défaut | Description |
| :--- | :--- | :--- | :--- |
| `onSelectBlock` | `(type: string) => void` | — | Reçoit la clé du type choisi |
| `availableBlocks` | `BlockTypeDefinition[]` | `DEFAULT_CMS_BLOCKS` | Restreint ou personnalise la liste proposée |
| `variant` | `'button' \| 'inline'` | `'button'` | `button` : bouton « Ajouter un bloc de contenu ». `inline` : séparateur discret avec un « + » (visible au survol / focus), à placer entre deux blocs pour insérer à cet endroit |
| `inlineLabel` | `string` | `'Insérer un bloc ici'` | Libellé accessible du « + » en variante `inline` |

L'éditeur d'article (`BlockCanvas`) place un `BlockPicker variant="inline"` avant chaque bloc et le bouton par défaut en fin de liste : un article se compose à la volée, de 1 à N blocs, chacun inséré à la position voulue. Le bloc inséré est amené à l'écran et son premier champ reçoit le focus.

```tsx
{blocks.map((block, index) => (
  <Fragment key={block.key}>
    <BlockPicker variant="inline" onSelectBlock={(type) => insertBlock(type, index)} />
    <BlockItem block={block} />
  </Fragment>
))}
<BlockPicker onSelectBlock={(type) => insertBlock(type)} />
```

### `BlockTypeDefinition` et `DEFAULT_CMS_BLOCKS`

```ts
export interface BlockTypeDefinition {
  type: string;
  label: string;
  icon: string;
  description?: string; // affichée sous le libellé dans la grille
}
```

`DEFAULT_CMS_BLOCKS` reprend les 10 cas de `Fagathe\CmsCore\Enum\Post\BlockType` : `text`, `image`, `code`, `quote`, `video`, `gallery`, `carousel`, `table`, `faq`, `cta`.

---

## 3. Éditeurs de bloc

Tous les éditeurs suivent le même contrat, ce qui permet de les ranger dans un registre :

```ts
interface XxxBlockProps {
  data: XxxBlockData;                  // JSON du bloc (BlocContent::$data)
  onChange: (updated: XxxBlockData) => void;
  onUpload?: MediaUploadHandler;       // uniquement pour les blocs média
}
```

| Composant | `BlockType` | Données (`data`) | Valeur initiale |
| :--- | :--- | :--- | :--- |
| `TextBlock` | `text` | `{ content }` en Markdown (seul type indexé en full-text) | `DEFAULT_TEXT_BLOCK_DATA` |
| `ImageBlock` | `image` | `{ url, alt?, caption?, aspectRatio? }` — « Changer l'image » (ou un clic sur l'image) ouvre la source de média sous l'image actuelle, conservée jusqu'au choix d'une nouvelle (« Annuler » possible) | `DEFAULT_IMAGE_BLOCK_DATA` |
| `VideoBlock` | `video` | `{ url, caption?, aspectRatio? }` | `DEFAULT_VIDEO_BLOCK_DATA` |
| `GalleryBlock` | `gallery` | `{ images: { id, url, alt?, caption? }[], columns }` | `DEFAULT_GALLERY_BLOCK_DATA` |
| `CarouselBlock` | `carousel` | `{ slides: { id, url, caption? }[], aspectRatio?, autoplay?, slideInterval? }` | `DEFAULT_CAROUSEL_BLOCK_DATA` |
| `CodeBlock` | `code` | `{ language, code, filename? }` (Tab insère 2 espaces) | `DEFAULT_CODE_BLOCK_DATA` |
| `QuoteBlock` | `quote` | `{ text, author?, source? }` | `DEFAULT_QUOTE_BLOCK_DATA` |
| `TableBlock` | `table` | `{ rows: string[][], hasHeader, caption? }` (`rows[0]` = en-tête) | `DEFAULT_TABLE_BLOCK_DATA` |
| `FaqBlock` | `faq` | `{ items: { id, question, answer }[] }` | `createDefaultFaqBlockData()` |
| `CtaBlock` | `cta` | `{ title, description?, buttonLabel, buttonUrl, variant }` | `DEFAULT_CTA_BLOCK_DATA` |

* Les sous-éléments (diapositives, images, questions) portent un `id` stable généré par `createBlockItemId()` et utilisé comme `key` React.
* `CODE_LANGUAGES` liste les langages proposés par `CodeBlock`.
* Les valeurs par défaut sont regroupées dans `blockDefaults.ts` (règle Fast Refresh : les fichiers de composants n'exportent que des composants).

### Exemple

```tsx
import { CodeBlock, DEFAULT_CODE_BLOCK_DATA, type CodeBlockData } from '@/ui/components';
import { useState } from 'react';

export const CodeSnippetEditor = () => {
  const [data, setData] = useState<CodeBlockData>(DEFAULT_CODE_BLOCK_DATA);

  return <CodeBlock data={data} onChange={setData} />;
};
```

---

## 4. MediaSourceField & téléversement (`onUpload`)

Source de média commune à `ImageBlock`, `VideoBlock`, `GalleryBlock` et `CarouselBlock` :
* **zone de dépôt** affichée seulement si un `onUpload` est fourni ; les fichiers sont téléversés dans l'ordre de sélection et `onSelect` reçoit les URL définitives ;
* **saisie d'URL** validée par le bouton « Utiliser » ou la touche Entrée (et non à chaque caractère tapé).

```ts
export type MediaUploadHandler = (file: File) => Promise<string>; // renvoie l'URL publique
```

| Prop | Type | Défaut | Description |
| :--- | :--- | :--- | :--- |
| `onSelect` | `(urls: string[]) => void` | — | URL téléversées ou saisies |
| `onUpload` | `MediaUploadHandler` | `undefined` | Téléversement réel ; sans lui, seule l'URL est proposée |
| `accept` | `string` | `'image/*'` | Types MIME acceptés |
| `multiple` | `boolean` | `false` | Sélection multiple |
| `maxSizeMb` | `number` | `10` | Poids maximal par fichier |
| `label`, `urlLabel`, `urlPlaceholder` | `string` | — | Libellés |
| `uploadUnavailableHint` | `string` | `undefined` | Message affiché à la place de la zone de dépôt sans `onUpload` |

> Les fichiers ne sont jamais conservés en `URL.createObjectURL` : une URL `blob:` locale disparaît au rechargement et ne peut pas être enregistrée en base.

Exemple côté fonctionnalité (téléversement dans la médiathèque de l'article) :

```tsx
import { uploadPostMedia } from '@/services/media.api';
import { ImageBlock, type MediaUploadHandler } from '@/ui/components';

const handleUpload: MediaUploadHandler = async (file) => {
  const media = await uploadPostMedia(postId, { file });
  return media.filePath; // URL absolue renvoyée par AttachmentFileService
};

<ImageBlock data={data} onChange={setData} onUpload={handleUpload} />;
```

---

## 5. Assemblage dans l'éditeur d'article

L'éditeur d'article (`src/pages/post/components/editor/BlockCanvas.tsx`) combine `EmptyState`, `BlockWrapper`, `BlockPicker` et un **registre** `BlockType → éditeur`. Ajouter un type de bloc revient à ajouter une entrée au registre, sans modifier le canvas (principe Open/Closed) :

```tsx
// src/pages/post/blocks/blockEditors.ts
export const BLOCK_EDITORS: Record<BlockType, BlockEditorEntry> = {
  text: entry('text', TextBlock, () => DEFAULT_TEXT_BLOCK_DATA),
  image: entry('image', ImageBlock, () => DEFAULT_IMAGE_BLOCK_DATA),
  // …
};

// BlockCanvas.tsx (extrait) — chaque bloc est un élément triable @dnd-kit
const { Editor, definition } = BLOCK_EDITORS[block.type];
const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
  id: block.key,
});

<div ref={setNodeRef} style={{ transform: CSS.Translate.toString(transform), transition }}>
  <BlockWrapper
    blockType={block.type}
    blockLabel={definition.label}
    position={index + 1}
    isFirst={index === 0}
    isLast={index === blocks.length - 1}
    isDragging={isDragging}
    dragHandleRef={setActivatorNodeRef}
    dragHandleProps={{ ...attributes, ...listeners }}
    onMoveUp={() => onMove(block.key, -1)}
    onMoveDown={() => onMove(block.key, 1)}
    onDelete={() => onDelete(block)}
  >
    <Editor data={block.data} onChange={(data) => onChange(block.key, data)} onUpload={onUpload} />
  </BlockWrapper>
</div>;
```

La liste est enveloppée dans `DndContext` (capteurs pointeur avec seuil de 6 px et clavier, annonces vocales en français) et `SortableContext` (`verticalListSortingStrategy`). Seule la poignée déclenche le glisser : les champs du bloc restent utilisables normalement. Au clavier : Espace pour saisir, flèches pour déplacer, Espace pour déposer, Échap pour annuler. Les boutons Monter / Descendre restent disponibles.

Le rendu de lecture (aperçu de l'article) suit le même principe avec `BLOCK_VIEWS` (`src/pages/post/blocks/blockViewRegistry.ts`).
