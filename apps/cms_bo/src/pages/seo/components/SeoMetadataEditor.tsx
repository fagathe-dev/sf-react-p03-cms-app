import { deleteSeo, findSeoByTarget } from '@/services/seo.api';
import { SeoMetadata, SeoTargetType } from '@/types';
import { Alert, ConfirmDialog, Loading } from '@/ui/components';
import { useEffect, useState } from 'react';
import * as S from './Seo.styles';
import { SeoMetadataForm } from './SeoMetadataForm';

interface LoadState {
  isLoading: boolean;
  seo: SeoMetadata | null;
  error: string | null;
}

interface SeoMetadataEditorProps {
  targetType: SeoTargetType;
  targetIdentifier: string;
  onChange: () => void;
}

/**
 * Charge les métadonnées d'une cible (ou un formulaire vierge si aucune n'existe) et gère leur suppression.
 * À monter avec une `key` par cible : le formulaire est réinitialisé à chaque changement.
 */
export const SeoMetadataEditor = ({ targetType, targetIdentifier, onChange }: SeoMetadataEditorProps) => {
  const [state, setState] = useState<LoadState>({ isLoading: true, seo: null, error: null });
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formKey, setFormKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    findSeoByTarget(targetType, targetIdentifier)
      .then((seo) => {
        if (!cancelled) setState({ isLoading: false, seo, error: null });
      })
      .catch((err) => {
        if (!cancelled) {
          setState({ isLoading: false, seo: null, error: err instanceof Error ? err.message : 'Erreur lors du chargement' });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [targetType, targetIdentifier]);

  const handleSaved = (seo: SeoMetadata) => {
    setState((current) => ({ ...current, seo }));
    onChange();
  };

  const handleDelete = async () => {
    if (!state.seo) return;

    setIsDeleting(true);
    try {
      await deleteSeo(state.seo.id);
      setState({ isLoading: false, seo: null, error: null });
      // Formulaire remonté vide après suppression
      setFormKey((key) => key + 1);
      onChange();
    } catch (err) {
      setState((current) => ({
        ...current,
        error: err instanceof Error ? err.message : 'Erreur lors de la suppression',
      }));
    } finally {
      setIsDeleting(false);
      setConfirmDelete(false);
    }
  };

  if (state.isLoading) {
    return (
      <S.CenteredState>
        <Loading size="lg" label="Chargement des métadonnées SEO…" />
      </S.CenteredState>
    );
  }

  return (
    <S.Stack>
      {state.error && <Alert variant="danger">{state.error}</Alert>}

      <SeoMetadataForm
        key={formKey}
        targetType={targetType}
        targetIdentifier={targetIdentifier}
        seo={state.seo}
        onSaved={handleSaved}
        onDeleteRequest={state.seo ? () => setConfirmDelete(true) : undefined}
      />

      <ConfirmDialog
        isOpen={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        title="Supprimer les métadonnées SEO"
        message="Les valeurs personnalisées seront supprimées : la cible utilisera de nouveau les valeurs générées automatiquement."
        confirmLabel="Supprimer"
        loading={isDeleting}
      />
    </S.Stack>
  );
};
