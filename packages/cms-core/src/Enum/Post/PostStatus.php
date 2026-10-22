<?php

declare(strict_types=1);

namespace Fagathe\CmsCore\Enum\Post;

enum PostStatus: string
{
    case DRAFT = 'draft';
    case REVIEW = 'review';         // En relecture (modération)
    case REWRITING = 'rewriting';   // À réécrire (contenu jugé non pertinent / inapproprié)
    case PUBLISHED = 'published';
    case ARCHIVED = 'archived';
    case TRASH = 'trash'; // Soft delete : suppression définitive après 30 jours

    /**
     * @return array<string, string>
     */
    public static function choices(): array
    {
        return array_reduce(static::cases(), fn($carry, $i) => [...$carry, $i->value => $i->value], []);
    }

    /**
     * @return array<string>
     */
    public static function values(): array
    {
        return array_reduce(static::cases(), fn($carry, $i) => [...$carry, $i->value], []);
    }
}
