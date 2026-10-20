<?php

declare(strict_types=1);

namespace Fagathe\CmsCore\Enum\Seo;

enum RobotsDirective: string
{
    case INDEX_FOLLOW = 'index, follow';
    case NOINDEX_FOLLOW = 'noindex, follow';
    case INDEX_NOFOLLOW = 'index, nofollow';
    case NOINDEX_NOFOLLOW = 'noindex, nofollow';

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
