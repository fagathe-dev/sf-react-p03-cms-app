<?php

declare(strict_types=1);

namespace Fagathe\CmsCore\Generator;

use Fagathe\CmsCore\Contract\ArticleSeoInterface;
use Fagathe\CmsCore\Contract\SeoMetadataInterface;
use Fagathe\CmsCore\Contract\TaxonomySeoInterface;
use Fagathe\CmsCore\Enum\Seo\SchemaType;
use Fagathe\CmsCore\Service\FilePathResolver;

class JsonLdGenerator
{
    private readonly string $siteUrl;
    private readonly string $siteName;

    public function __construct(
        ?string $siteUrl = null,
        ?string $siteName = null,
        private readonly string $logoPath = '/assets/images/logo.png',
        // Miniature servie par l'API (chemin relatif en BDD) : sans resolver, elle est résolue sur $siteUrl
        private readonly ?FilePathResolver $fileResolver = null,
    ) {
        $this->siteUrl = $siteUrl ?? ($_ENV['APP_SITE_URL'] ?? 'http://localhost');
        $this->siteName = $siteName ?? ($_ENV['APP_SITE_NAME'] ?? 'Mon Blog Tech');
    }

    /**
     * Schéma JSON-LD pour un Article (TechArticle / BlogPosting).
     *
     * @return array<string, mixed>
     */
    public function generateArticleSchema(
        ArticleSeoInterface $article,
        string $path,
        ?SeoMetadataInterface $seo = null,
        SchemaType $type = SchemaType::TECH_ARTICLE
    ): array {
        $thumbnail = $this->fileResolver?->resolveUrl($article->getThumbnail()) ?? $article->getThumbnail();
        $imagePath = $seo?->getOgImage() ?? $thumbnail;

        $schema = [
            '@context' => 'https://schema.org',
            '@type' => $type->value,
            'mainEntityOfPage' => [
                '@type' => 'WebPage',
                '@id' => $this->normalizeUrl($path),
            ],
            'headline' => $seo?->getMetaTitle() ?? $article->getTitle(),
            'description' => $seo?->getMetaDescription() ?? $article->getExcerpt(),
            'image' => $imagePath ? $this->normalizeUrl($imagePath) : null,
            'datePublished' => $article->getPublishedAt()?->format(\DateTimeInterface::ATOM),
            'dateModified' => ($article->getUpdatedAt() ?? $article->getPublishedAt())?->format(\DateTimeInterface::ATOM),
            'author' => [
                '@type' => 'Person',
                'name' => $article->getAuthorName(),
            ],
            'publisher' => $this->getPublisherSchema(),
        ];

        return $this->mergeCustomSchema($schema, $seo);
    }

    /**
     * Schéma JSON-LD pour une Catégorie ou un Tag (CollectionPage).
     *
     * @return array<string, mixed>
     */
    public function generateTaxonomySchema(
        TaxonomySeoInterface $taxonomy,
        string $path,
        string $prefixLabel = 'Catégorie',
        ?SeoMetadataInterface $seo = null
    ): array {
        $schema = [
            '@context' => 'https://schema.org',
            '@type' => SchemaType::COLLECTION_PAGE->value,
            'name' => $seo?->getMetaTitle() ?? sprintf('%s : %s', $prefixLabel, $taxonomy->getName()),
            'description' => $seo?->getMetaDescription() ?? $taxonomy->getDescription(),
            'url' => $this->normalizeUrl($path),
            'publisher' => $this->getPublisherSchema(),
        ];

        return $this->mergeCustomSchema($schema, $seo);
    }

    /**
     * Schéma JSON-LD pour une Page Statique (WebPage, ContactPage, AboutPage, FAQPage).
     *
     * @return array<string, mixed>
     */
    public function generateStaticPageSchema(
        string $path,
        SchemaType $pageType = SchemaType::WEB_PAGE,
        ?SeoMetadataInterface $seo = null,
        ?string $fallbackTitle = null
    ): array {
        $schema = [
            '@context' => 'https://schema.org',
            '@type' => $pageType->value,
            'name' => $seo?->getMetaTitle() ?? $fallbackTitle ?? $this->siteName,
            'description' => $seo?->getMetaDescription(),
            'url' => $this->normalizeUrl($path),
            'publisher' => $this->getPublisherSchema(),
        ];

        return $this->mergeCustomSchema($schema, $seo);
    }

    /**
     * @param array<string, mixed> $baseSchema
     * @return array<string, mixed>
     */
    private function mergeCustomSchema(array $baseSchema, ?SeoMetadataInterface $seo): array
    {
        if ($seo !== null && !empty($seo->getJsonLdSchema())) {
            $baseSchema = array_replace_recursive($baseSchema, $seo->getJsonLdSchema());
        }

        return array_filter($baseSchema, static fn($value) => $value !== null && $value !== '');
    }

    /**
     * @return array<string, mixed>
     */
    private function getPublisherSchema(): array
    {
        return [
            '@type' => 'Organization',
            'name' => $this->siteName,
            'logo' => [
                '@type' => 'ImageObject',
                'url' => $this->normalizeUrl($this->logoPath),
            ],
        ];
    }

    private function normalizeUrl(string $pathOrUrl): string
    {
        if (str_starts_with($pathOrUrl, 'http://') || str_starts_with($pathOrUrl, 'https://')) {
            return $pathOrUrl;
        }

        return rtrim($this->siteUrl, '/') . '/' . ltrim($pathOrUrl, '/');
    }
}
