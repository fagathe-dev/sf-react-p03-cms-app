<?php

declare(strict_types=1);

namespace Fagathe\CmsCore\Generator;

use Fagathe\CmsCore\Contract\ArticleSeoInterface;
use Fagathe\CmsCore\Contract\SeoMetadataInterface;
use Fagathe\CmsCore\Contract\TaxonomySeoInterface;
use Fagathe\CmsCore\Enum\Seo\OgType;
use Fagathe\CmsCore\Enum\Seo\RobotsDirective;

class SeoSchemaGenerator
{
    private readonly string $siteUrl;
    private readonly string $siteName;

    public function __construct(
        ?string $siteUrl = null,
        ?string $siteName = null,
        private readonly string $defaultImage = '/assets/images/default-og.png',
        private readonly ?string $defaultGeoRegion = 'FR',
        private readonly ?string $defaultGeoPlacename = null,
        private readonly ?string $defaultGeoPosition = null,
    ) {
        $this->siteUrl = $siteUrl ?? ($_ENV['APP_SITE_URL'] ?? 'http://localhost');
        $this->siteName = $siteName ?? ($_ENV['APP_SITE_NAME'] ?? 'Mon Blog Tech');
    }

    /**
     * Génère la structure SEO/GEO complète pour un Article.
     *
     * @return array<string, mixed>
     */
    public function generateForArticle(
        ArticleSeoInterface $article,
        string $path,
        ?SeoMetadataInterface $seo = null
    ): array {
        $title = $seo?->getMetaTitle() ?? $article->getTitle() ?? $this->siteName;
        $description = $seo?->getMetaDescription() ?? $article->getExcerpt() ?? '';
        $image = $seo?->getOgImage() ?? $article->getThumbnail() ?? $this->defaultImage;

        return $this->buildMetaArray(
            title: $title,
            description: $description,
            path: $path,
            ogType: OgType::ARTICLE,
            image: $image,
            seo: $seo
        );
    }

    /**
     * Génère la structure SEO/GEO pour une Catégorie ou un Tag.
     *
     * @return array<string, mixed>
     */
    public function generateForTaxonomy(
        TaxonomySeoInterface $taxonomy,
        string $path,
        ?SeoMetadataInterface $seo = null
    ): array {
        $title = $seo?->getMetaTitle() ?? sprintf('%s | %s', $taxonomy->getName(), $this->siteName);
        $description = $seo?->getMetaDescription()
            ?? $taxonomy->getDescription()
            ?? sprintf('Découvrez tous les articles sur le thème %s.', $taxonomy->getName());

        return $this->buildMetaArray(
            title: $title,
            description: $description,
            path: $path,
            ogType: OgType::WEBSITE,
            image: $seo?->getOgImage() ?? $this->defaultImage,
            seo: $seo
        );
    }

    /**
     * Génère la structure SEO/GEO pour une Page Statique (Home, Contact, Mentions légales).
     *
     * @return array<string, mixed>
     */
    public function generateForStaticPage(
        string $defaultTitle,
        string $defaultDescription,
        string $path,
        ?SeoMetadataInterface $seo = null
    ): array {
        return $this->buildMetaArray(
            title: $seo?->getMetaTitle() ?? $defaultTitle,
            description: $seo?->getMetaDescription() ?? $defaultDescription,
            path: $path,
            ogType: OgType::WEBSITE,
            image: $seo?->getOgImage() ?? $this->defaultImage,
            seo: $seo
        );
    }

    /**
     * @return array<string, mixed>
     */
    private function buildMetaArray(
        string $title,
        string $description,
        string $path,
        OgType $ogType,
        string $image,
        ?SeoMetadataInterface $seo = null
    ): array {
        $fullUrl = $this->normalizeUrl($path);
        $canonical = $seo?->getCanonicalUrl() ? $this->normalizeUrl($seo->getCanonicalUrl()) : $fullUrl;

        return [
            'title' => $title,
            'description' => $description,
            'canonical' => $canonical,
            'robots' => $seo?->getRobots() ?? RobotsDirective::INDEX_FOLLOW->value,
            'og' => [
                'type' => $ogType->value,
                'site_name' => $this->siteName,
                'title' => $seo?->getOgTitle() ?? $title,
                'description' => $seo?->getOgDescription() ?? $description,
                'url' => $canonical,
                'image' => $this->normalizeUrl($image),
            ],
            'geo' => array_filter([
                'region' => $seo?->getGeoRegion() ?? $this->defaultGeoRegion,
                'placename' => $seo?->getGeoPlacename() ?? $this->defaultGeoPlacename,
                'position' => $seo?->getGeoPosition() ?? $this->defaultGeoPosition,
            ]),
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
