import { Button } from '@/ui/components/Base/Button';
import { Video } from '@/ui/components/Embed/Video';
import { ChoiceField } from '@/ui/components/Forms/Fields/ChoiceField';
import { TextField } from '@/ui/components/Forms/Fields/TextField';
import { Flex } from '@/ui/components/Grid/Flex';
import { BaseComponentProps } from '@/ui/types';
import { MediaSourceField, MediaUploadHandler } from './MediaSourceField';

export interface VideoBlockData {
  url: string;
  caption?: string;
  aspectRatio?: string;
}

export interface VideoBlockProps extends BaseComponentProps {
  data: VideoBlockData;
  onChange: (updated: VideoBlockData) => void;
  /** Téléversement réel du fichier ; sans lui, seule la saisie d'URL est proposée */
  onUpload?: MediaUploadHandler;
}

export const VideoBlock = ({ data, onChange, onUpload, ...rest }: VideoBlockProps) => {
  if (!data.url) {
    return (
      <MediaSourceField
        accept="video/mp4,video/webm"
        label="Téléverser un fichier vidéo"
        maxSizeMb={50}
        urlLabel="Ou URL de la vidéo"
        urlPlaceholder="https://domaine.com/video.mp4"
        onUpload={onUpload}
        onSelect={([url]) => url && onChange({ ...data, url })}
        {...rest}
      />
    );
  }

  return (
    <Flex direction="column" gap="1rem" {...rest}>
      <Video src={data.url} aspectRatio={data.aspectRatio || '16/9'} radius="base" controls />

      <TextField
        label="Légende de la vidéo"
        placeholder="Courte description…"
        value={data.caption || ''}
        onChange={(e) => onChange({ ...data, caption: e.target.value })}
      />

      <Flex justify="space-between" align="center" gap="1rem" wrap="wrap">
        <ChoiceField
          label="Ratio vidéo"
          value={data.aspectRatio || '16/9'}
          onChange={(e) => onChange({ ...data, aspectRatio: e.target.value })}
        >
          <option value="16/9">16:9 (Paysage classique)</option>
          <option value="9/16">9:16 (Format vertical / mobile)</option>
          <option value="4/3">4:3</option>
        </ChoiceField>

        <Button variant="ghost" size="sm" onClick={() => onChange({ ...data, url: '' })}>
          Changer de vidéo
        </Button>
      </Flex>
    </Flex>
  );
};
