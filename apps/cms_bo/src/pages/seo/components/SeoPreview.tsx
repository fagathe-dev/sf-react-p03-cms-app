import { fetchArticleSchema, fetchStaticPageSchema, fetchTaxonomySchema } from '@/services/seo.api';
import { GeneratedSeoPacket, SeoTargetType } from '@/types';
import { Alert, Card, Loading, Text } from '@/ui/components';
import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { STATIC_PAGES } from '../constants';
import * as S from './Seo.styles';

/**
 * Registre des générateurs de paquets SEO (Meta + OpenGraph + GEO + JSON-LD) par type de cible.
 * Un type absent du registre n'a pas de générateur côté API.
 */
const SCHEMA_LOADERS: Partial<Record<SeoTargetType, (identifier: string) => Promise<GeneratedSeoPacket>>> = {
  post: (identifier) => fetchArticleSchema(identifier),
  category: (identifier) => fetchTaxonomySchema('category', identifier),
  tag: (identifier) => fetchTaxonomySchema('tag', identifier),
  static_page: (identifier) => {
    const page = STATIC_PAGES.find((preset) => preset.key === identifier);
    return fetchStaticPageSchema(identifier, page?.label ?? identifier, page?.path ?? `/${identifier}`, page?.schemaType ?? 'WebPage');
  },
};

const Snippet = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[1]};
  margin-bottom: ${({ theme }) => theme.spacing[4]};
`;

const SnippetUrl = styled.span`
  font-size: ${({ theme }) => theme.typography.sizes.xs};
  color: ${({ theme }) => theme.colors.success.base};
  word-break: break-all;
`;

const SnippetTitle = styled.span`
  font-size: ${({ theme }) => theme.typography.sizes.lg};
  color: ${({ theme }) => theme.colors.primary.base};
  line-height: 1.3;
`;

interface PacketResult {
  key: string;
  packet: GeneratedSeoPacket | null;
  error: string | null;
}

interface SeoPreviewProps {
  targetType: SeoTargetType;
  targetIdentifier: string;
  /** Incrémenté après chaque enregistrement pour régénérer l'aperçu */
  revision: number;
}

export const SeoPreview = ({ targetType, targetIdentifier, revision }: SeoPreviewProps) => {
  const loader = SCHEMA_LOADERS[targetType];
  const requestKey = `${targetType}:${targetIdentifier}:${revision}`;
  const [result, setResult] = useState<PacketResult | null>(null);

  useEffect(() => {
    if (!loader) return;

    let cancelled = false;

    loader(targetIdentifier)
      .then((packet) => {
        if (!cancelled) setResult({ key: requestKey, packet, error: null });
      })
      .catch((err) => {
        if (!cancelled) {
          setResult({ key: requestKey, packet: null, error: err instanceof Error ? err.message : 'Erreur de génération' });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [loader, targetIdentifier, requestKey]);

  const isLoading = Boolean(loader) && result?.key !== requestKey;
  const packet = isLoading ? null : result?.packet;
  const error = isLoading ? null : result?.error;

  return (
    <Card elevation="sm">
      <Card.Header>
        <Card.Title>Aperçu généré</Card.Title>
      </Card.Header>
      <Card.Body>
        {!loader && (
          <Text as="p" size="sm" style={{ margin: 0 }}>
            Aucun générateur de schéma n'est disponible pour ce type de cible.
          </Text>
        )}

        {isLoading && (
          <S.CenteredState>
            <Loading label="Génération de l'aperçu…" />
          </S.CenteredState>
        )}

        {error && <Alert variant="danger">{error}</Alert>}

        {packet && (
          <>
            <Snippet aria-label="Aperçu dans les résultats de recherche">
              <SnippetUrl>{packet.meta.canonical}</SnippetUrl>
              <SnippetTitle>{packet.meta.title}</SnippetTitle>
              <Text size="sm">{packet.meta.description || 'Aucune description.'}</Text>
              <Text size="xs" color="muted">
                robots : {packet.meta.robots}
              </Text>
            </Snippet>

            <Text size="sm" weight="semibold">
              JSON-LD
            </Text>
            <S.Code>{JSON.stringify(packet.jsonLd, null, 2)}</S.Code>
          </>
        )}
      </Card.Body>
    </Card>
  );
};
