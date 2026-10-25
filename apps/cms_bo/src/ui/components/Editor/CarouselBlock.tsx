import { IconButton } from '@/ui/components/Base/IconButton';
import { Carousel } from '@/ui/components/Embed/Carousel';
import { Image } from '@/ui/components/Embed/Image';
import { ChoiceField } from '@/ui/components/Forms/Fields/ChoiceField';
import { TextField } from '@/ui/components/Forms/Fields/TextField';
import { ToggleField } from '@/ui/components/Forms/Fields/ToggleField';
import { Flex } from '@/ui/components/Grid/Flex';
import { BaseComponentProps } from '@/ui/types';
import styled from 'styled-components';
import { createBlockItemId } from './blockItemId';
import { MediaSourceField, MediaUploadHandler } from './MediaSourceField';

export interface CarouselSlideItem {
  id: string;
  url: string;
  caption?: string;
}

export interface CarouselBlockData {
  slides: CarouselSlideItem[];
  aspectRatio?: string;
  autoplay?: boolean;
  slideInterval?: number;
}

export interface CarouselBlockProps extends BaseComponentProps {
  data: CarouselBlockData;
  onChange: (updated: CarouselBlockData) => void;
  /** Téléversement réel des diapositives ; sans lui, seule la saisie d'URL est proposée */
  onUpload?: MediaUploadHandler;
}

const SlideRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  padding: ${({ theme }) => theme.spacing[2]};
  background-color: ${({ theme }) => theme.colors.background.surfaceHover};
  border-radius: ${({ theme }) => theme.radii.base};

  & > div {
    flex: 1;
    margin-bottom: 0;
  }
`;

export const CarouselBlock = ({ data, onChange, onUpload, ...rest }: CarouselBlockProps) => {
  const slides = data.slides || [];
  const autoplay = data.autoplay ?? false;
  const slideInterval = data.slideInterval ?? 4000;

  const addSlides = (urls: string[]) => {
    const newItems: CarouselSlideItem[] = urls.map((url) => ({ id: createBlockItemId(), url, caption: '' }));
    onChange({ ...data, slides: [...slides, ...newItems] });
  };

  const removeSlide = (id: string) => {
    onChange({ ...data, slides: slides.filter((s) => s.id !== id) });
  };

  const updateSlideCaption = (id: string, caption: string) => {
    onChange({
      ...data,
      slides: slides.map((s) => (s.id === id ? { ...s, caption } : s)),
    });
  };

  return (
    <Flex direction="column" gap="1rem" {...rest}>
      {slides.length > 0 && (
        <Carousel aspectRatio={data.aspectRatio || '16/9'} autoplay={autoplay} slideInterval={slideInterval}>
          {slides.map((slide) => (
            <Carousel.Item key={slide.id}>
              <Image src={slide.url} alt={slide.caption || ''} fit="cover" style={{ width: '100%', height: '100%' }} />
            </Carousel.Item>
          ))}
        </Carousel>
      )}

      <Flex align="flex-end" gap="1rem" wrap="wrap">
        <ChoiceField
          label="Ratio"
          value={data.aspectRatio || '16/9'}
          onChange={(e) => onChange({ ...data, aspectRatio: e.target.value })}
        >
          <option value="16/9">16:9</option>
          <option value="4/3">4:3</option>
          <option value="21/9">21:9</option>
        </ChoiceField>

        <ToggleField
          label="Défilement automatique"
          checked={autoplay}
          onChange={(e) => onChange({ ...data, autoplay: e.target.checked })}
        />

        {autoplay && (
          <TextField
            type="number"
            label="Intervalle (ms)"
            min={1000}
            step={500}
            value={slideInterval}
            onChange={(e) => onChange({ ...data, slideInterval: Number(e.target.value) || 4000 })}
          />
        )}
      </Flex>

      <MediaSourceField
        multiple
        accept="image/*"
        label="Ajouter des diapositives au carrousel"
        urlLabel="Ou ajouter une image par URL"
        onUpload={onUpload}
        onSelect={addSlides}
      />

      {slides.length > 0 && (
        <Flex direction="column" gap="0.5rem">
          {slides.map((s, idx) => (
            <SlideRow key={s.id}>
              <Image src={s.url} width={48} height={36} fit="cover" radius="sm" alt="" />
              <TextField
                aria-label={`Légende de la diapositive ${idx + 1}`}
                placeholder={`Légende diapositive #${idx + 1}`}
                value={s.caption || ''}
                onChange={(e) => updateSlideCaption(s.id, e.target.value)}
              />
              <IconButton
                name="trash-can-outline"
                size="sm"
                variant="danger"
                aria-label={`Supprimer la diapositive ${idx + 1}`}
                onClick={() => removeSlide(s.id)}
              />
            </SlideRow>
          ))}
        </Flex>
      )}
    </Flex>
  );
};
