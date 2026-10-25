<?php

declare(strict_types=1);

namespace Fagathe\CmsCore\Dto\Seo;

use Fagathe\CmsCore\Enum\Seo\RobotsDirective;
use Fagathe\CmsCore\Enum\Seo\SeoTargetType;
use Symfony\Component\Validator\Constraints as Assert;

final class SaveSeoMetadataDto
{
    #[Assert\NotBlank(message: 'Le type de cible SEO est obligatoire.')]
    #[Assert\Choice(
        callback: [self::class, 'getAllowedTargetTypes'],
        message: 'Le type de cible SEO "{{ value }}" est invalide.'
    )]
    public string $targetType = '';

    #[Assert\NotBlank(message: 'L\'identifiant de la cible SEO est obligatoire.')]
    #[Assert\Length(max: 180)]
    public string $targetIdentifier = '';

    #[Assert\Length(max: 70, maxMessage: 'Le meta title ne doit pas dépasser {{ limit }} caractères.')]
    public ?string $metaTitle = null;

    #[Assert\Length(max: 160, maxMessage: 'La meta description ne doit pas dépasser {{ limit }} caractères.')]
    public ?string $metaDescription = null;

    #[Assert\Length(max: 255)]
    public ?string $canonicalUrl = null;

    #[Assert\Choice(
        callback: [self::class, 'getAllowedRobotsDirectives'],
        message: 'La directive robots "{{ value }}" est invalide.'
    )]
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

    #[Assert\Length(max: 50)]
    public ?string $geoPosition = null;

    /**
     * @var array<string, mixed>|null
     */
    #[Assert\Type('array')]
    public ?array $jsonLdSchema = null;

    /**
     * @var array<string, mixed>|null
     */
    #[Assert\Type('array')]
    public ?array $settings = null;

    /**
     * @return string[]
     */
    public static function getAllowedTargetTypes(): array
    {
        return array_map(static fn(SeoTargetType $case): string => $case->value, SeoTargetType::cases());
    }

    /**
     * @return string[]
     */
    public static function getAllowedRobotsDirectives(): array
    {
        return array_map(static fn(RobotsDirective $case): string => $case->value, RobotsDirective::cases());
    }
}
