<?php

declare(strict_types=1);

namespace Fagathe\CmsCore\Dto\Post;

use Fagathe\CmsCore\Enum\Post\PostStatus;
use Symfony\Component\Validator\Constraints as Assert;

final class SavePostDto
{
    #[Assert\NotBlank(message: 'Le titre de l\'article est obligatoire.')]
    #[Assert\Length(
        max: 180,
        maxMessage: 'Le titre ne peut pas dépasser {{ limit }} caractères.'
    )]
    public string $title = '';

    #[Assert\Length(
        max: 200,
        maxMessage: 'Le slug ne peut pas dépasser {{ limit }} caractères.'
    )]
    public ?string $slug = null;

    public ?string $excerpt = null;

    #[Assert\Length(max: 255)]
    public ?string $thumbnail = null;

    #[Assert\Choice(
        callback: [self::class, 'getAllowedStatuses'],
        message: 'Le statut "{{ value }}" est invalide.'
    )]
    public string $status = PostStatus::DRAFT->value;

    #[Assert\Uuid(message: 'L\'identifiant de la catégorie est invalide.')]
    public ?string $categoryId = null;

    /**
     * @var string[]|null
     */
    #[Assert\All([
        new Assert\NotBlank(),
        new Assert\Uuid(message: 'L\'un des identifiants de tag est invalide.'),
    ])]
    public ?array $tagIds = null;

    /**
     * @var array<string, mixed>|null
     */
    #[Assert\Type('array')]
    public ?array $settings = null;

    /**
     * @var SaveBlocContentDto[]|null
     */
    #[Assert\Valid]
    public ?array $blocks = null;

    /**
     * @return string[]
     */
    public static function getAllowedStatuses(): array
    {
        return array_map(static fn(PostStatus $case): string => $case->value, PostStatus::cases());
    }
}
