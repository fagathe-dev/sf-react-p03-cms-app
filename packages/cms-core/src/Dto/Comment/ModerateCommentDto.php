<?php

declare(strict_types=1);

namespace Fagathe\CmsCore\Dto\Comment;

use Fagathe\CmsCore\Enum\CommentStatus;
use Symfony\Component\Validator\Constraints as Assert;

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