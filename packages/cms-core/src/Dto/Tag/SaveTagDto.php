<?php

declare(strict_types=1);

namespace Fagathe\CmsCore\Dto\Tag;

use Fagathe\CmsCore\Enum\ColorEnum;
use Symfony\Component\Validator\Constraints as Assert;

final class SaveTagDto
{
    #[Assert\NotBlank(message: 'Le nom du tag est obligatoire.')]
    #[Assert\Length(
        min: 2,
        max: 50,
        minMessage: 'Le nom du tag doit contenir au moins {{ limit }} caractères.',
        maxMessage: 'Le nom du tag ne peut pas dépasser {{ limit }} caractères.'
    )]
    public string $name = '';

    #[Assert\Length(max: 80)]
    public ?string $slug = null;

    #[Assert\Choice(
        callback: [self::class, 'getAllowedColors'],
        message: 'La couleur "{{ value }}" n\'est pas valide.'
    )]
    public ?string $color = null;

    public ?string $description = null;

    /**
     * @var array<string, mixed>|null
     */
    #[Assert\Type('array')]
    public ?array $settings = null;

    /**
     * @return string[]
     */
    public static function getAllowedColors(): array
    {
        return array_map(static fn(ColorEnum $case): string => $case->value, ColorEnum::cases());
    }
}
