import { SeoTargetType } from '@/types';
import { Alert, Button, Card, ChoiceField, TextField } from '@/ui/components';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SEO_TARGET_TYPES } from '../constants';
import { useSeoTargetOptions } from '../hooks';
import * as S from './Seo.styles';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface SeoTargetPickerProps {
  targetType: SeoTargetType;
  targetIdentifier: string;
}

/**
 * Choix de la cible SEO (type + identifiant), synchronisé avec les paramètres d'URL `?type=&id=`
 */
export const SeoTargetPicker = ({ targetType, targetIdentifier }: SeoTargetPickerProps) => {
  const [, setSearchParams] = useSearchParams();
  const { options, isLoading, error } = useSeoTargetOptions(targetType);

  // Saisie libre (profil utilisateur) : validée avant d'être poussée dans l'URL
  const [manualId, setManualId] = useState(targetIdentifier);
  const [manualError, setManualError] = useState<string | null>(null);

  const selectTarget = (type: SeoTargetType, id: string) => {
    setSearchParams(id ? { type, id } : { type }, { replace: true });
  };

  const submitManualId = () => {
    const trimmed = manualId.trim();
    if (!UUID_PATTERN.test(trimmed)) {
      setManualError("L'identifiant doit être un UUID valide");
      return;
    }
    setManualError(null);
    selectTarget(targetType, trimmed);
  };

  return (
    <Card elevation="sm">
      <Card.Header>
        <Card.Title>Cible</Card.Title>
      </Card.Header>
      <Card.Body>
        <S.FieldRow>
          <ChoiceField
            label="Type de cible"
            value={targetType}
            onChange={(e) => {
              setManualId('');
              selectTarget(e.target.value as SeoTargetType, '');
            }}
          >
            {SEO_TARGET_TYPES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </ChoiceField>

          {options === null ? (
            <div>
              <TextField
                label="UUID de l'utilisateur"
                placeholder="Ex : 0192f1c4-…"
                value={manualId}
                error={manualError ?? undefined}
                onChange={(e) => setManualId(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    submitManualId();
                  }
                }}
              />
              <Button size="sm" variant="outline" onClick={submitManualId}>
                Charger
              </Button>
            </div>
          ) : (
            <ChoiceField
              label="Élément"
              value={targetIdentifier}
              disabled={isLoading}
              onChange={(e) => selectTarget(targetType, e.target.value)}
            >
              <option value="">{isLoading ? 'Chargement…' : '— Choisir —'}</option>
              {options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </ChoiceField>
          )}
        </S.FieldRow>

        {error && <Alert variant="danger">{error}</Alert>}
      </Card.Body>
    </Card>
  );
};
