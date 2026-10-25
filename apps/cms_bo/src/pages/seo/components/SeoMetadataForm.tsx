import { ApiError } from '@/services/apiError';
import { saveSeo } from '@/services/seo.api';
import { RobotsDirective, SaveSeoMetadataPayload, SeoMetadata, SeoTargetType } from '@/types';
import { Alert, Button, Card, ChoiceField, TextareaField, TextField } from '@/ui/components';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { ROBOTS_OPTIONS, SEO_LIMITS } from '../constants';
import * as S from './Seo.styles';

const ROBOTS_VALUES = ROBOTS_OPTIONS.map((option) => option.value) as [RobotsDirective, ...RobotsDirective[]];

const urlOrPath = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `${max} caractères maximum`)
    .refine((value) => value === '' || value.startsWith('/') || /^https?:\/\//.test(value), {
      message: 'Indiquez une URL absolue (https://…) ou un chemin commençant par /',
    });

const text = (max: number) => z.string().trim().max(max, `${max} caractères maximum`);

const seoSchema = z.object({
  metaTitle: text(SEO_LIMITS.metaTitle),
  metaDescription: text(SEO_LIMITS.metaDescription),
  canonicalUrl: urlOrPath(SEO_LIMITS.canonicalUrl),
  robots: z.enum(ROBOTS_VALUES),
  ogTitle: text(SEO_LIMITS.ogTitle),
  ogDescription: text(SEO_LIMITS.ogDescription),
  ogImage: urlOrPath(SEO_LIMITS.ogImage),
  geoRegion: text(SEO_LIMITS.geoRegion),
  geoPlacename: text(SEO_LIMITS.geoPlacename),
  geoPosition: text(SEO_LIMITS.geoPosition).regex(/^$|^-?\d+(\.\d+)?;\s*-?\d+(\.\d+)?$/, {
    message: 'Format attendu : latitude;longitude (ex : 48.8566;2.3522)',
  }),
  jsonLdSchema: z
    .string()
    .trim()
    .refine(
      (value) => {
        if (value === '') return true;
        try {
          const parsed = JSON.parse(value);
          return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed);
        } catch {
          return false;
        }
      },
      { message: 'Le schéma doit être un objet JSON valide' }
    ),
});

type SeoFormData = z.infer<typeof seoSchema>;

// Champs du formulaire pouvant recevoir une violation renvoyée par l'API
const API_FIELDS = Object.keys(seoSchema.shape) as (keyof SeoFormData)[];

const toFormValues = (seo: SeoMetadata | null): SeoFormData => ({
  metaTitle: seo?.metaTitle ?? '',
  metaDescription: seo?.metaDescription ?? '',
  canonicalUrl: seo?.canonicalUrl ?? '',
  robots: (ROBOTS_VALUES as string[]).includes(seo?.robots ?? '') ? (seo!.robots as RobotsDirective) : 'index, follow',
  ogTitle: seo?.ogTitle ?? '',
  ogDescription: seo?.ogDescription ?? '',
  ogImage: seo?.ogImage ?? '',
  geoRegion: seo?.geoRegion ?? '',
  geoPlacename: seo?.geoPlacename ?? '',
  geoPosition: seo?.geoPosition ?? '',
  jsonLdSchema: seo?.jsonLdSchema ? JSON.stringify(seo.jsonLdSchema, null, 2) : '',
});

const nullIfEmpty = (value: string): string | null => (value === '' ? null : value);

interface SeoMetadataFormProps {
  targetType: SeoTargetType;
  targetIdentifier: string;
  seo: SeoMetadata | null;
  onSaved: (seo: SeoMetadata) => void;
  onDeleteRequest?: () => void;
}

export const SeoMetadataForm = ({ targetType, targetIdentifier, seo, onSaved, onDeleteRequest }: SeoMetadataFormProps) => {
  const [apiError, setApiError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    register,
    watch,
    setError,
    reset,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<SeoFormData>({
    resolver: zodResolver(seoSchema),
    defaultValues: toFormValues(seo),
  });

  const [metaTitle, metaDescription] = watch(['metaTitle', 'metaDescription']);

  const onSubmit = async (data: SeoFormData) => {
    setApiError(null);
    setSuccessMessage(null);

    const payload: SaveSeoMetadataPayload = {
      targetType,
      targetIdentifier,
      metaTitle: nullIfEmpty(data.metaTitle),
      metaDescription: nullIfEmpty(data.metaDescription),
      canonicalUrl: nullIfEmpty(data.canonicalUrl),
      robots: data.robots,
      ogTitle: nullIfEmpty(data.ogTitle),
      ogDescription: nullIfEmpty(data.ogDescription),
      ogImage: nullIfEmpty(data.ogImage),
      geoRegion: nullIfEmpty(data.geoRegion),
      geoPlacename: nullIfEmpty(data.geoPlacename),
      geoPosition: nullIfEmpty(data.geoPosition),
      jsonLdSchema: data.jsonLdSchema ? (JSON.parse(data.jsonLdSchema) as Record<string, unknown>) : null,
    };

    try {
      const saved = await saveSeo(payload);
      reset(toFormValues(saved));
      setSuccessMessage(seo ? 'Les métadonnées SEO ont été mises à jour.' : 'Les métadonnées SEO ont été créées.');
      onSaved(saved);
    } catch (err) {
      if (err instanceof ApiError) {
        API_FIELDS.forEach((field) => {
          const message = err.violations[field];
          if (message) setError(field, { message });
        });
      }
      setApiError(err instanceof Error ? err.message : "Erreur lors de l'enregistrement des métadonnées SEO");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <S.Stack>
        {!seo && (
          <Alert variant="info" title="Aucune métadonnée personnalisée">
            Cette cible utilise les valeurs générées automatiquement. Renseignez les champs pour les surcharger.
          </Alert>
        )}

        {successMessage && (
          <Alert variant="success" onClose={() => setSuccessMessage(null)}>
            {successMessage}
          </Alert>
        )}

        {apiError && <Alert variant="danger">{apiError}</Alert>}

        <Card elevation="sm">
          <Card.Header>
            <Card.Title>Référencement</Card.Title>
          </Card.Header>
          <Card.Body>
            <TextField
              label="Meta title"
              placeholder="Titre affiché dans les résultats de recherche"
              hint={`${metaTitle.length}/${SEO_LIMITS.metaTitle} caractères`}
              error={errors.metaTitle?.message}
              {...register('metaTitle')}
            />
            <TextareaField
              label="Meta description"
              rows={3}
              placeholder="Résumé affiché sous le titre dans les résultats de recherche"
              hint={`${metaDescription.length}/${SEO_LIMITS.metaDescription} caractères`}
              error={errors.metaDescription?.message}
              {...register('metaDescription')}
            />
            <S.FieldRow>
              <TextField
                label="URL canonique"
                placeholder="https://… ou /chemin"
                error={errors.canonicalUrl?.message}
                {...register('canonicalUrl')}
              />
              <ChoiceField label="Directive robots" error={errors.robots?.message} {...register('robots')}>
                {ROBOTS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </ChoiceField>
            </S.FieldRow>
          </Card.Body>
        </Card>

        <Card elevation="sm">
          <Card.Header>
            <Card.Title>Open Graph</Card.Title>
          </Card.Header>
          <Card.Body>
            <TextField
              label="Titre de partage"
              placeholder="Par défaut : meta title"
              error={errors.ogTitle?.message}
              {...register('ogTitle')}
            />
            <TextareaField
              label="Description de partage"
              rows={2}
              placeholder="Par défaut : meta description"
              error={errors.ogDescription?.message}
              {...register('ogDescription')}
            />
            <TextField
              label="Image de partage"
              placeholder="https://… ou /images/partage.jpg"
              hint="Format recommandé : 1200 × 630 px."
              error={errors.ogImage?.message}
              {...register('ogImage')}
            />
          </Card.Body>
        </Card>

        <Card elevation="sm">
          <Card.Header>
            <Card.Title>Géolocalisation (GEO)</Card.Title>
          </Card.Header>
          <Card.Body>
            <S.FieldRow>
              <TextField
                label="Région"
                placeholder="Ex : FR-IDF"
                error={errors.geoRegion?.message}
                {...register('geoRegion')}
              />
              <TextField
                label="Lieu"
                placeholder="Ex : Paris"
                error={errors.geoPlacename?.message}
                {...register('geoPlacename')}
              />
            </S.FieldRow>
            <TextField
              label="Position"
              placeholder="Ex : 48.8566;2.3522"
              error={errors.geoPosition?.message}
              {...register('geoPosition')}
            />
          </Card.Body>
        </Card>

        <Card elevation="sm">
          <Card.Header>
            <Card.Title>Schéma JSON-LD personnalisé</Card.Title>
          </Card.Header>
          <Card.Body>
            <TextareaField
              label="Surcharge JSON-LD"
              rows={8}
              placeholder='{ "@type": "Organization", "name": "…" }'
              hint="Fusionné avec le schéma généré automatiquement. Laissez vide pour n'utiliser que la génération."
              error={errors.jsonLdSchema?.message}
              style={{ fontFamily: 'monospace' }}
              {...register('jsonLdSchema')}
            />
          </Card.Body>
        </Card>

        <S.FormActions>
          {onDeleteRequest && (
            <Button type="button" variant="ghost" onClick={onDeleteRequest} style={{ marginRight: 'auto' }}>
              Supprimer les métadonnées
            </Button>
          )}
          <Button type="button" variant="outline" onClick={() => reset()} disabled={!isDirty || isSubmitting}>
            Annuler les modifications
          </Button>
          <Button type="submit" loading={isSubmitting}>
            Enregistrer
          </Button>
        </S.FormActions>
      </S.Stack>
    </form>
  );
};
