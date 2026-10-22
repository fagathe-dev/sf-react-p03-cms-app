<?php

declare(strict_types=1);

namespace Fagathe\CmsCore\Dto\Post;

use Fagathe\CmsCore\Enum\Post\PostStatus;
use Symfony\Component\Validator\Constraints as Assert;

final class ReviewPostDto
{
    #[Assert\NotBlank(message: 'Le statut de revue est obligatoire.')]
    #[Assert\Choice(
        choices: [
            PostStatus::PUBLISHED->value,
            PostStatus::REVIEW->value,
            PostStatus::REWRITING->value,
        ],
        message: 'Le modérateur ne peut appliquer que les statuts : publié, en relecture (review) ou à réécrire (rewriting).'
    )]
    public string $status = PostStatus::REVIEW->value;

    #[Assert\Length(
        max: 1000,
        maxMessage: 'La note de modération ne peut pas dépasser {{ limit }} caractères.'
    )]
    public ?string $moderationNote = null;

    public bool $resetFlags = false;
}
