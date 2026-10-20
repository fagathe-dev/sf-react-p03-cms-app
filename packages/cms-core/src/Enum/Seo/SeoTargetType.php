<?php

declare(strict_types=1);

namespace Fagathe\CmsCore\Enum\Seo;

enum SeoTargetType: string
{
    case POST = 'post';
    case CATEGORY = 'category';
    case TAG = 'tag';
    case USER_PROFILE = 'user_profile';
    case STATIC_PAGE = 'static_page'; // ex: '/contact', '/'

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
