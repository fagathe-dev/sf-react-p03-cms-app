import { ApiError } from '@/services/apiError';
import { uploadPostMedia } from '@/services/media.api';
import { updatePost } from '@/services/post.api';
import { Post, PostMedia, SavePostPayload } from '@/types';
import { Alert, MediaUploadHandler } from '@/ui/components';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { useBlocker } from 'react-router-dom';
import { computeReadingTime } from '../../blocks';
import { useBlocksState } from '../../hooks';
import { PostMetaFormData, postMetaSchema } from '../../schemas';
import * as S from '../Post.styles';
import { BlockCanvas } from './BlockCanvas';
import { PostMainFields } from './PostMainFields';
import { PostMediaPanel } from './PostMediaPanel';
import { PostPublishPanel } from './PostPublishPanel';
import { PostSettingsPanel } from './PostSettingsPanel';
import { PostTaxonomyPanel } from './PostTaxonomyPanel';
import { PostThumbnailPanel } from './PostThumbnailPanel';
import { UNSAVED_CHANGES_MESSAGE, UnsavedChangesDialog } from './UnsavedChangesDialog';

const toMetaValues = (post: Post): PostMetaFormData => ({
  title: post.title,
  slug: post.slug ?? '',
  excerpt: post.excerpt ?? '',
  thumbnail: post.thumbnail ?? '',
  status: post.status,
  categoryId: post.category?.id ?? '',
  tagIds: post.tags.map((tag) => tag.id),
  allowComments: post.settings?.allow_comments ?? true,
  allowLikes: post.settings?.allow_likes ?? true,
  showToc: post.settings?.show_toc ?? true,
  isFeatured: post.settings?.is_featured ?? false,
});

// Champs du formulaire pouvant recevoir une violation renvoyée par l'API
const API_FIELDS: (keyof PostMetaFormData)[] = ['title', 'slug', 'excerpt', 'status', 'categoryId', 'tagIds'];

interface PostEditorProps {
  post: Post;
}

/**
 * Éditeur d'article : métadonnées (react-hook-form + zod) et blocs (useBlocksState),
 * enregistrés ensemble via PUT /posts/{id} (SavePostDto + synchronisation des blocs).
 */
export const PostEditor = ({ post: initialPost }: PostEditorProps) => {
  // Dernier état connu côté API : sert de base aux settings (liked_by, flagged_by…) renvoyés à l'enregistrement
  const [post, setPost] = useState(initialPost);
  const [medias, setMedias] = useState<PostMedia[]>(initialPost.medias ?? []);
  const [apiError, setApiError] = useState<string | null>(null);

  const form = useForm<PostMetaFormData>({
    resolver: zodResolver(postMetaSchema),
    defaultValues: toMetaValues(initialPost),
  });
  const {
    handleSubmit,
    reset,
    setError,
    formState: { isDirty: isMetaDirty, isSubmitting },
  } = form;

  const {
    blocks,
    addBlock,
    updateBlock,
    moveBlock,
    reorderBlocks,
    removeBlock,
    resetBlocks,
    isDirty: isBlocksDirty,
    toPayload,
  } = useBlocksState(initialPost.blocks ?? []);

  const isDirty = isMetaDirty || isBlocksDirty;
  const readingTime = useMemo(() => computeReadingTime(blocks), [blocks]);

  /** Enregistre l'article ; `true` si l'API a accepté les modifications */
  const save = useCallback(
    async (data: PostMetaFormData): Promise<boolean> => {
      setApiError(null);

      const payload: SavePostPayload = {
        title: data.title,
        slug: data.slug || null,
        excerpt: data.excerpt || null,
        // Chaîne vide = retrait de la miniature (PostService::hydratePostFromDto)
        thumbnail: data.thumbnail,
        // Toujours transmis : SavePostDto::$status vaut « draft » par défaut
        status: data.status,
        categoryId: data.categoryId || null,
        tagIds: data.tagIds,
        // setSettings() remplace l'objet complet : on repart des settings actuels
        settings: {
          ...post.settings,
          allow_comments: data.allowComments,
          allow_likes: data.allowLikes,
          show_toc: data.showToc,
          is_featured: data.isFeatured,
          reading_time: readingTime,
        },
        blocks: toPayload(),
      };

      try {
        const saved = await updatePost(post.id, payload);
        setPost(saved);
        setMedias(saved.medias ?? []);
        reset(toMetaValues(saved));
        resetBlocks(saved.blocks ?? []);
        return true;
      } catch (err) {
        if (err instanceof ApiError) {
          API_FIELDS.forEach((field) => {
            const message = err.violations[field];
            if (message) setError(field, { message });
          });
        }
        setApiError(err instanceof Error ? err.message : "Erreur lors de l'enregistrement de l'article");
        return false;
      }
    },
    [post, readingTime, toPayload, reset, resetBlocks, setError]
  );

  const submit = useMemo(() => handleSubmit(save), [handleSubmit, save]);

  // Ctrl+S / Cmd+S : enregistrement sans quitter le clavier
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        if (isDirty && !isSubmitting) void submit();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isDirty, isSubmitting, submit]);

  // Rechargement, fermeture de l'onglet ou URL externe : boîte de confirmation native du navigateur.
  // Les navigateurs récents affichent leur propre texte et ignorent le message fourni.
  useEffect(() => {
    if (!isDirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      // Navigateurs plus anciens : équivalent de `return message` dans window.onbeforeunload
      event.returnValue = UNSAVED_CHANGES_MESSAGE;
      return UNSAVED_CHANGES_MESSAGE;
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [isDirty]);

  // Navigation interne (onglets Aperçu / SEO, retour à la liste, menu…) : beforeunload ne se déclenche pas,
  // on bloque la navigation React Router et on affiche UnsavedChangesDialog
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) => isDirty && currentLocation.pathname !== nextLocation.pathname
  );
  const [isSavingBeforeLeave, setIsSavingBeforeLeave] = useState(false);

  const saveAndLeave = useCallback(async () => {
    setIsSavingBeforeLeave(true);
    // handleSubmit n'appelle save qu'après validation zod ; formulaire invalide → false
    const saved = await new Promise<boolean>((resolve) => {
      void handleSubmit(
        async (data) => resolve(await save(data)),
        () => resolve(false)
      )();
    });
    setIsSavingBeforeLeave(false);

    if (blocker.state !== 'blocked') return;
    // Échec (validation ou API) : on reste sur l'éditeur pour afficher les erreurs
    if (saved) blocker.proceed();
    else blocker.reset();
  }, [blocker, handleSubmit, save]);

  // Les fichiers des blocs sont téléversés dans la médiathèque de l'article
  const handleUpload = useCallback<MediaUploadHandler>(
    async (file) => {
      const media = await uploadPostMedia(post.id, { file });
      setMedias((current) => [media, ...current]);
      return media.filePath;
    },
    [post.id]
  );

  return (
    <FormProvider {...form}>
      {apiError && (
        <Alert variant="danger" onClose={() => setApiError(null)}>
          {apiError}
        </Alert>
      )}

      <S.EditorLayout>
        <S.Stack>
          <PostMainFields />
          <BlockCanvas
            blocks={blocks}
            onAdd={addBlock}
            onChange={updateBlock}
            onMove={moveBlock}
            onReorder={reorderBlocks}
            onRemove={removeBlock}
            onUpload={handleUpload}
          />
        </S.Stack>

        <S.Aside>
          <PostPublishPanel post={post} isDirty={isDirty} isSaving={isSubmitting} onSave={submit} />
          <PostThumbnailPanel postId={post.id} />
          <PostTaxonomyPanel currentTags={post.tags} />
          <PostSettingsPanel readingTime={readingTime} />
          <PostMediaPanel
            postId={post.id}
            medias={medias}
            onDeleted={(mediaId) => setMedias((current) => current.filter((media) => media.id !== mediaId))}
          />
        </S.Aside>
      </S.EditorLayout>

      <UnsavedChangesDialog
        isOpen={blocker.state === 'blocked'}
        isSaving={isSavingBeforeLeave}
        onStay={() => blocker.reset?.()}
        onLeave={() => blocker.proceed?.()}
        onSaveAndLeave={() => void saveAndLeave()}
      />
    </FormProvider>
  );
};
