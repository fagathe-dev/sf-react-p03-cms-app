<?php

declare(strict_types=1);

namespace Fagathe\CmsCore\Dto;

use Fagathe\CmsCore\Enum\Seo\RobotsDirective;
use Fagathe\CmsCore\Enum\Seo\SeoTargetType;
use Symfony\Component\Validator\Constraints as Assert;

class SeoMetadataDto
{
    #[Assert\NotBlank(message: 'Le type de cible SEO est obligatoire.')]
    public SeoTargetType $targetType;

    #[Assert\NotBlank(message: 'L\'identifiant de la cible est obligatoire.')]
    #[Assert\Length(max: 180)]
    public string $targetIdentifier;

    #[Assert\Length(max: 70, maxMessage: 'Le meta title ne doit pas dépasser {{ limit }} caractères.')]
    public ?string $metaTitle = null;

    #[Assert\Length(max: 160, maxMessage: 'La meta description ne doit pas dépasser {{ limit }} caractères.')]
    public ?string $metaDescription = null;

    #[Assert\Url(message: 'L\'URL canonique doit être une URL valide.')]
    public ?string $canonicalUrl = null;

    #[Assert\Choice(callback: [RobotsDirective::class, 'values'], message: 'Directive robots invalide.')]
    public string $robots = RobotsDirective::INDEX_FOLLOW->value;

    #[Assert\Length(max: 180)]
    public ?string $ogTitle = null;

    #[Assert\Length(max: 255)]
    public ?string $ogDescription = null;

    #[Assert\Length(max: 255)]
    public ?string $ogImage = null;

    #[Assert\Length(max: 100)]
    public ?string $geoRegion = null;

    #[Assert\Length(max: 100)]
    public ?string $geoPlacename = null;

    #[Assert\Regex(
        pattern: '/^-?\d+(\.\d+)?;-?\d+(\.\d+)?$/',
        message: 'La position géographique doit être au format "latitude;longitude" (ex: 48.8566;2.3522).'
    )]
    public ?string $geoPosition = null;

    /**
     * @var array<string, mixed>|null
     */
    public ?array $jsonLdSchema = null;
}
