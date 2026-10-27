import { fetchEmailPreviewHtml, fetchEmailPreviews } from '@/services/emailPreview.api';
import { EmailPreview } from '@/types';
import { Alert, EmptyState, Loading, Text, Title } from '@/ui/components';
import { useCallback, useEffect, useState } from 'react';
import { EmailPreviewCard, EmailPreviewList } from './components';
import * as S from './Admin.styles';

/**
 * Aperçu des templates d'e-mails rendus par l'API avec des données factices (aucun envoi) — ROLE_SUPER_ADMIN.
 */
export const EmailPreviewPage = () => {
  const [previews, setPreviews] = useState<EmailPreview[]>([]);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [html, setHtml] = useState('');
  const [isListLoading, setIsListLoading] = useState(true);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const loadHtml = useCallback(async (slug: string) => {
    setIsPreviewLoading(true);
    setPreviewError(null);
    try {
      setHtml(await fetchEmailPreviewHtml(slug));
    } catch (err) {
      setHtml('');
      setPreviewError(err instanceof Error ? err.message : "Impossible de générer l'aperçu de cet e-mail.");
    } finally {
      setIsPreviewLoading(false);
    }
  }, []);

  useEffect(() => {
    const loadPreviews = async () => {
      try {
        const data = await fetchEmailPreviews();
        setPreviews(data);
        if (data[0]) {
          setSelectedSlug(data[0].slug);
          await loadHtml(data[0].slug);
        }
      } catch (err) {
        setListError(err instanceof Error ? err.message : 'Erreur lors de la récupération des e-mails.');
      } finally {
        setIsListLoading(false);
      }
    };

    void loadPreviews();
  }, [loadHtml]);

  const selectPreview = (slug: string) => {
    setSelectedSlug(slug);
    void loadHtml(slug);
  };

  const selected = previews.find((preview) => preview.slug === selectedSlug) ?? null;

  return (
    <S.PageWrapper>
      <div>
        <Title as="h1">Aperçu des e-mails</Title>
        <Text color="muted" size="sm">
          Rendu des templates d'e-mails avec des données factices : aucun e-mail n'est envoyé.
        </Text>
      </div>

      {listError && <Alert variant="danger">{listError}</Alert>}

      {isListLoading ? (
        <S.CenteredBox>
          <Loading size="lg" />
        </S.CenteredBox>
      ) : previews.length === 0 ? (
        !listError && <EmptyState icon="email-outline" title="Aucun e-mail" description="Aucun template n'est disponible." />
      ) : (
        <S.SplitLayout $asideWidth="280px">
          <EmailPreviewList previews={previews} selectedSlug={selectedSlug} onSelect={selectPreview} />
          <EmailPreviewCard
            preview={selected}
            html={html}
            isLoading={isPreviewLoading}
            error={previewError}
            onReload={() => selectedSlug && void loadHtml(selectedSlug)}
          />
        </S.SplitLayout>
      )}
    </S.PageWrapper>
  );
};
