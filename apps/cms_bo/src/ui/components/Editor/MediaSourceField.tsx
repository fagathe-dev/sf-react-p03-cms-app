import { Button } from '@/ui/components/Base/Button';
import { Alert } from '@/ui/components/Feedback/Alert';
import { TextField } from '@/ui/components/Forms/Fields/TextField';
import { FileDropzone } from '@/ui/components/Forms/FileDropzone';
import { Flex } from '@/ui/components/Grid/Flex';
import { BaseComponentProps } from '@/ui/types';
import { useState } from 'react';

/**
 * Téléverse un fichier et renvoie son URL publique définitive.
 * Fourni par la page (ex. upload vers /posts/{id}/medias) : l'UI kit ne connaît pas l'API.
 */
export type MediaUploadHandler = (file: File) => Promise<string>;

export interface MediaSourceFieldProps extends BaseComponentProps {
  /** Reçoit les URL des fichiers téléversés ou l'URL saisie manuellement */
  onSelect: (urls: string[]) => void;
  onUpload?: MediaUploadHandler;
  accept?: string;
  label?: string;
  maxSizeMb?: number;
  multiple?: boolean;
  urlLabel?: string;
  urlPlaceholder?: string;
  /** Texte affiché à la place de la zone de dépôt quand aucun `onUpload` n'est fourni */
  uploadUnavailableHint?: string;
}

/**
 * Source d'un média de bloc : zone de dépôt (si un `onUpload` est fourni) ou URL saisie à la main
 */
export const MediaSourceField = ({
  onSelect,
  onUpload,
  accept = 'image/*',
  label = 'Sélectionner un fichier',
  maxSizeMb = 10,
  multiple = false,
  urlLabel = "Ou renseigner l'URL directe",
  urlPlaceholder = 'https://…',
  uploadUnavailableHint,
  ...rest
}: MediaSourceFieldProps) => {
  const [url, setUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = async (files: File[]) => {
    if (!onUpload || files.length === 0) return;

    setError(null);
    setIsUploading(true);
    try {
      const urls: string[] = [];
      // Téléversements séquentiels : conserve l'ordre de sélection
      for (const file of files) {
        urls.push(await onUpload(file));
      }
      onSelect(urls);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du téléversement');
    } finally {
      setIsUploading(false);
    }
  };

  const submitUrl = () => {
    const trimmed = url.trim();
    if (!trimmed) return;
    onSelect([trimmed]);
    setUrl('');
  };

  return (
    <Flex direction="column" gap="0.75rem" {...rest}>
      {onUpload ? (
        <FileDropzone
          accept={accept}
          label={label}
          multiple={multiple}
          maxSizeMb={maxSizeMb}
          disabled={isUploading}
          hint={isUploading ? 'Téléversement en cours…' : undefined}
          onFilesSelected={handleFiles}
        />
      ) : (
        uploadUnavailableHint && <Alert variant="info">{uploadUnavailableHint}</Alert>
      )}

      {error && (
        <Alert variant="danger" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Flex align="flex-end" gap="0.5rem">
        <div style={{ flex: 1 }}>
          <TextField
            label={urlLabel}
            type="url"
            placeholder={urlPlaceholder}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                submitUrl();
              }
            }}
          />
        </div>
        <Button variant="outline" onClick={submitUrl} disabled={!url.trim()} style={{ marginBottom: '1rem' }}>
          Utiliser
        </Button>
      </Flex>
    </Flex>
  );
};
