<?php

declare(strict_types=1);

namespace Fagathe\CmsCore\Dto\Comment;

use Fagathe\CmsCore\Enum\CommentStatus;
use Symfony\Component\Validator\Constraints as Assert;

final class CreateCommentDto
{
    #[Assert\NotBlank(message: 'L\'identifiant de l\'article est obligatoire.')]
    #[Assert\Uuid(message: 'L\'identifiant de l\'article est invalide.')]
    public string $postId = '';

    #[Assert\Uuid(message: 'L\'identifiant du commentaire parent est invalide.')]
    public ?string $parentId = null;

    #[Assert\NotBlank(message: 'Le contenu du commentaire ne peut pas être vide.')]
    #[Assert\Length(
        min: 2,
        max: 5000,
        minMessage: 'Le commentaire doit contenir au moins {{ limit }} caractères.',
        maxMessage: 'Le commentaire ne peut pas dépasser {{ limit }} caractères.'
    )]
    public string $content = '';
}

final class UpdateCommentDto
{
    #[Assert\NotBlank(message: 'Le contenu du commentaire ne peut pas être vide.')]
    #[Assert\Length(
        min: 2,
        max: 5000,
        minMessage: 'Le commentaire doit contenir au moins {{ limit }} caractères.',
        maxMessage: 'Le commentaire ne peut pas dépasser {{ limit }} caractères.'
    )]
    public string $content = '';
}

final class FlagCommentDto
{
    #[Assert\Length(
        max: 255,
        maxMessage: 'Le motif du signalement ne peut pas dépasser {{ limit }} caractères.'
    )]
    public ?string $reason = null;
}

final class ModerateCommentDto
{
    #[Assert\NotBlank(message: 'Le statut de modération est obligatoire.')]
    #[Assert\Choice(
        callback: [self::class, 'getAllowedStatuses'],
        message: 'Le statut de modération "{{ value }}" est invalide.'
    )]
    public string $status = CommentStatus::APPROVED->value;

    #[Assert\Length(max: 500)]
    public ?string $moderationNote = null;

    public bool $resetFlags = false;

    /**
     * @return string[]
     */
    public static function getAllowedStatuses(): array
    {
        return array_map(static fn(CommentStatus $case): string => $case->value, CommentStatus::cases());
    }
}