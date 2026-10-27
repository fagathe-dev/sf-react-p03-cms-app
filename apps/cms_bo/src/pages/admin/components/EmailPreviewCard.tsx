import { EmailAddress, EmailPreview } from '@/types';
import { Alert, Button, Card, Loading, Text } from '@/ui/components';
import { useMemo } from 'react';
import styled from 'styled-components';

const PreviewHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing[3]};
  padding: ${({ theme }) => `${theme.spacing[3]} ${theme.spacing[4]}`};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
`;

const EnvelopeGrid = styled.div`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: baseline;
  column-gap: ${({ theme }) => theme.spacing[3]};
  row-gap: ${({ theme }) => theme.spacing[1]};
  min-width: 0;
  overflow-wrap: anywhere;
`;

const ErrorBox = styled.div`
  padding: ${({ theme }) => theme.spacing[4]};
`;

// Fond blanc fixe : un e-mail s'affiche toujours sur fond clair, quel que soit le thème du back-office
const PreviewFrame = styled.iframe`
  display: block;
  width: 100%;
  height: 75vh;
  border: 0;
  background-color: #ffffff;
`;

const CenteredBox = styled.div`
  display: grid;
  place-items: center;
  height: 160px;
`;

const formatAddresses = (addresses: EmailAddress[] | undefined, fallback: string): string =>
  addresses?.length
    ? addresses.map(({ name, email }) => (name ? `${name} <${email}>` : email)).join(', ')
    : fallback;

/** Le layout des e-mails est un fragment (table) : document minimal pour un rendu standard (pas de mode quirks) */
const toDocument = (html: string): string =>
  `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"></head><body style="margin:0">${html}</body></html>`;

interface EmailPreviewCardProps {
  preview: EmailPreview | null;
  html: string;
  isLoading: boolean;
  error: string | null;
  onReload: () => void;
}

export const EmailPreviewCard = ({ preview, html, isLoading, error, onReload }: EmailPreviewCardProps) => {
  const srcDoc = useMemo(() => (html ? toDocument(html) : ''), [html]);

  return (
    <Card>
      <PreviewHeader>
        <EnvelopeGrid>
          <Text size="xs" color="muted">
            De
          </Text>
          <Text size="sm">{formatAddresses(preview?.from, 'Expéditeur non configuré (DEFAULT_EMAIL_SENDER)')}</Text>
          <Text size="xs" color="muted">
            À
          </Text>
          <Text size="sm">{formatAddresses(preview?.to, '—')}</Text>
          <Text size="xs" color="muted">
            Objet
          </Text>
          <Text weight="semibold" size="sm">
            {preview?.subject ?? '—'}
          </Text>
        </EnvelopeGrid>
        <Button type="button" variant="outline" size="sm" loading={isLoading} disabled={!preview || isLoading} onClick={onReload}>
          Recharger
        </Button>
      </PreviewHeader>

      {error && (
        <ErrorBox>
          <Alert variant="danger">{error}</Alert>
        </ErrorBox>
      )}

      {isLoading && !html ? (
        <CenteredBox>
          <Loading size="lg" />
        </CenteredBox>
      ) : (
        srcDoc && (
          // sandbox vide : aucun script ni navigation depuis le HTML de l'e-mail
          <PreviewFrame title={`Aperçu : ${preview?.label ?? ''}`} srcDoc={srcDoc} sandbox="" />
        )
      )}
    </Card>
  );
};
