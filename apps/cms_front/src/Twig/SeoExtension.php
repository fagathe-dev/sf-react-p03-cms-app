<?php

declare(strict_types=1);

namespace App\Twig;

use Fagathe\CmsCore\Contract\ArticleSeoInterface;
use Fagathe\CmsCore\Contract\SeoMetadataInterface;
use Fagathe\CmsCore\Contract\TaxonomySeoInterface;
use Fagathe\CmsCore\Enum\Seo\SchemaType;
use Fagathe\CmsCore\Generator\JsonLdGenerator;
use Fagathe\CmsCore\Generator\SeoSchemaGenerator;
use Symfony\Component\HttpFoundation\RequestStack;
use Twig\Extension\AbstractExtension;
use Twig\TwigFunction;

class SeoExtension extends AbstractExtension
{
    public function __construct(
        private readonly SeoSchemaGenerator $seoSchemaGenerator,
        private readonly JsonLdGenerator $jsonLdGenerator,
        private readonly RequestStack $requestStack,
    ) {}

    public function getFunctions(): array
    {
        return [
            new TwigFunction('generate_seo_meta', [$this, 'getSeoMeta']),
            new TwigFunction('generate_ld_json', [$this, 'getJsonLd']),
        ];
    }

    /**
     * Génère le tableau des balises <meta>, OpenGraph et Geo.
     *
     * @param SeoMetadataInterface|ArticleSeoInterface|TaxonomySeoInterface $seo
     * @param ArticleSeoInterface|TaxonomySeoInterface|null $subject Entité métier optionnelle si $seo est SeoMetadata
     * @return array<string, mixed>
     */
    public function getSeoMeta(
        SeoMetadataInterface|ArticleSeoInterface|TaxonomySeoInterface $seo,
        ArticleSeoInterface|TaxonomySeoInterface|null $subject = null,
        ?string $path = null
    ): array {
        $currentPath = $path ?? $this->getCurrentPath();

        $metadata = $seo instanceof SeoMetadataInterface ? $seo : null;
        $entity = $subject ?? ($seo instanceof SeoMetadataInterface ? null : $seo);

        if ($entity instanceof ArticleSeoInterface) {
            return $this->seoSchemaGenerator->generateForArticle($entity, $currentPath, $metadata);
        }

        if ($entity instanceof TaxonomySeoInterface) {
            return $this->seoSchemaGenerator->generateForTaxonomy($entity, $currentPath, $metadata);
        }

        return $this->seoSchemaGenerator->generateForStaticPage(
            defaultTitle: $metadata?->getMetaTitle() ?? '',
            defaultDescription: $metadata?->getMetaDescription() ?? '',
            path: $currentPath,
            seo: $metadata
        );
    }

    /**
     * Génère le schéma JSON-LD (Schema.org).
     *
     * @param SeoMetadataInterface|ArticleSeoInterface|TaxonomySeoInterface $seo
     * @param ArticleSeoInterface|TaxonomySeoInterface|null $subject
     * @return array<string, mixed>
     */
    public function getJsonLd(
        SeoMetadataInterface|ArticleSeoInterface|TaxonomySeoInterface $seo,
        ArticleSeoInterface|TaxonomySeoInterface|null $subject = null,
        SchemaType $schemaType = SchemaType::WEB_PAGE,
        ?string $path = null
    ): array {
        $currentPath = $path ?? $this->getCurrentPath();

        $metadata = $seo instanceof SeoMetadataInterface ? $seo : null;
        $entity = $subject ?? ($seo instanceof SeoMetadataInterface ? null : $seo);

        if ($entity instanceof ArticleSeoInterface) {
            return $this->jsonLdGenerator->generateArticleSchema(
                article: $entity,
                path: $currentPath,
                seo: $metadata,
                type: $schemaType === SchemaType::WEB_PAGE ? SchemaType::TECH_ARTICLE : $schemaType
            );
        }

        if ($entity instanceof TaxonomySeoInterface) {
            return $this->jsonLdGenerator->generateTaxonomySchema(
                taxonomy: $entity,
                path: $currentPath,
                seo: $metadata
            );
        }

        return $this->jsonLdGenerator->generateStaticPageSchema(
            path: $currentPath,
            pageType: $schemaType,
            seo: $metadata
        );
    }

    private function getCurrentPath(): string
    {
        return $this->requestStack->getCurrentRequest()?->getPathInfo() ?? '/';
    }
}
