<?php

declare(strict_types=1);

namespace Fagathe\CmsCore\Dto\Comment;

use Symfony\Component\Validator\Constraints as Assert;

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
