import { PostStatus } from '@/types';
import { z } from 'zod';

const POST_STATUSES = ['draft', 'review', 'rewriting', 'published', 'archived', 'trash'] as const satisfies readonly PostStatus[];

const uuidOrEmpty = z.string().refine((value) => value === '' || z.uuid().safeParse(value).success, {
  message: 'Identifiant invalide',
});

/**
 * Métadonnées éditées dans l'éditeur d'article (SavePostDto, hors blocs)
 */
export const postMetaSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Le titre de l'article est obligatoire")
    .max(180, 'Le titre ne peut pas dépasser 180 caractères'),
  slug: z
    .string()
    .trim()
    .max(200, 'Le slug ne peut pas dépasser 200 caractères')
    .regex(/^[a-z0-9]*(?:-[a-z0-9]+)*$/, 'Le slug ne peut contenir que des minuscules, des chiffres et des tirets'),
  excerpt: z.string().trim().max(500, "L'extrait ne peut pas dépasser 500 caractères"),
  thumbnail: z.string().trim().max(255),
  status: z.enum(POST_STATUSES),
  categoryId: uuidOrEmpty,
  tagIds: z.array(z.uuid()),
  allowComments: z.boolean(),
  allowLikes: z.boolean(),
  showToc: z.boolean(),
  isFeatured: z.boolean(),
});

export type PostMetaFormData = z.infer<typeof postMetaSchema>;

/**
 * Création rapide d'un brouillon : le contenu est rédigé ensuite dans l'éditeur
 */
export const postCreateSchema = postMetaSchema.pick({ title: true, excerpt: true, categoryId: true });

export type PostCreateFormData = z.infer<typeof postCreateSchema>;
