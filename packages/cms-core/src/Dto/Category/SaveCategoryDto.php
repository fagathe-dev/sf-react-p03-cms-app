<?php

declare(strict_types=1);

namespace Fagathe\CmsCore\Dto\Category;

use Symfony\Component\Validator\Constraints as Assert;

final class SaveCategoryDto
{
    #[Assert\NotBlank(message: 'Le nom de la catégorie est obligatoire.')]
    #[Assert\Length(
        min: 2,
        max: 100,
        minMessage: 'Le nom de la catégorie doit contenir au moins {{ limit }} caractères.',
        maxMessage: 'Le nom de la catégorie ne peut pas dépasser {{ limit }} caractères.'
    )]
    public string $name = '';

    #[Assert\Length(max: 120)]
    public ?string $slug = null;

    public ?string $description = null;

    /**
     * @var array<string, mixed>|null
     */
    #[Assert\Type('array')]
    public ?array $settings = null;
}
