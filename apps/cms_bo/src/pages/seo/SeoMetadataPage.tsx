import { Card, EmptyState, Lead, Title } from '@/ui/components';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SeoMetadataEditor, SeoPreview, SeoTargetPicker } from './components';
import * as S from './components/Seo.styles';
import { isSeoTargetType } from './constants';

export const SeoMetadataPage = () => {
  const [searchParams] = useSearchParams();
  // Révision incrémentée à chaque enregistrement / suppression pour régénérer l'aperçu
  const [revision, setRevision] = useState(0);

  const typeParam = searchParams.get('type');
  const targetType = isSeoTargetType(typeParam) ? typeParam : 'static_page';
  const targetIdentifier = searchParams.get('id') ?? '';
  const targetKey = `${targetType}:${targetIdentifier}`;

  return (
    <S.PageWrapper>
      <div>
        <Title as="h1">SEO & Schémas JSON-LD</Title>
        <Lead style={{ marginBottom: 0 }}>
          Surchargez les balises meta, Open Graph, GEO et le JSON-LD générés pour les pages du blog.
        </Lead>
      </div>

      <SeoTargetPicker key={targetType} targetType={targetType} targetIdentifier={targetIdentifier} />

      {targetIdentifier ? (
        <S.Workspace>
          <SeoMetadataEditor
            key={targetKey}
            targetType={targetType}
            targetIdentifier={targetIdentifier}
            onChange={() => setRevision((current) => current + 1)}
          />
          <SeoPreview targetType={targetType} targetIdentifier={targetIdentifier} revision={revision} />
        </S.Workspace>
      ) : (
        <Card elevation="sm">
          <EmptyState
            icon="search-web"
            title="Choisissez une cible"
            description="Sélectionnez une page, une catégorie, un tag, un article ou un profil pour éditer ses métadonnées SEO."
          />
        </Card>
      )}
    </S.PageWrapper>
  );
};
