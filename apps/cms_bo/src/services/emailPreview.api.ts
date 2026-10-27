import { EmailPreview } from '@/types';
import { toApiError } from './apiError';
import { fetchAPI } from './fetchAPI';

/** E-mails prévisualisables (ROLE_SUPER_ADMIN) */
export const fetchEmailPreviews = async (): Promise<EmailPreview[]> => {
  const res = await fetchAPI<EmailPreview[]>('/admin/emails');
  if (!res.ok) throw toApiError(res.data, 'Erreur lors de la récupération des e-mails.');
  return res.data ?? [];
};

/** HTML rendu du template d'e-mail (données factices côté API, aucun envoi) */
export const fetchEmailPreviewHtml = async (slug: string): Promise<string> => {
  const res = await fetchAPI(`/admin/emails/${encodeURIComponent(slug)}`, { responseType: 'text' });
  if (!res.ok) throw toApiError(null, "Impossible de générer l'aperçu de cet e-mail.");
  return res.text;
};
