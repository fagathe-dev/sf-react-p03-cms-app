<?php

declare(strict_types=1);

namespace Fagathe\CmsCore\Dto\Comment;

use Symfony\Component\Validator\Constraints as Assert;

final class FlagCommentDto
{
    #[Assert\Length(
        max: 255,
        maxMessage: 'Le motif du signalement ne peut pas dépasser {{ limit }} caractères.'
    )]
    public ?string $reason = null;
}
