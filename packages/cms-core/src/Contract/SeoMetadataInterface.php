<?php

declare(strict_types=1);

namespace Fagathe\CmsCore\Contract;

use Fagathe\CmsCore\Enum\SeoTargetType;

interface SeoMetadataInterface
{
    public function getTargetType(): SeoTargetType;
    public function getTargetIdentifier(): string;
    public function getMetaTitle(): ?string;
    public function getMetaDescription(): ?string;
    public function getCanonicalUrl(): ?string;
    public function getRobots(): string;
    public function getOgTitle(): ?string;
    public function getOgDescription(): ?string;
    public function getOgImage(): ?string;
    public function getGeoRegion(): ?string;
    public function getGeoPlacename(): ?string;
    public function getGeoPosition(): ?string;
    public function getJsonLdSchema(): ?array;
}
