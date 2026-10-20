<?php

declare(strict_types=1);

namespace Fagathe\CmsCore\Enum;

enum BlockType: string
{
    case TEXT = 'text';
    case CODE = 'code';
    case IMAGE = 'image';
    case VIDEO = 'video';
    case CAROUSEL = 'carousel';
    case GALLERY = 'gallery';
    case QUOTE = 'quote';
    case TABLE = 'table';
    case FAQ = 'faq';
    case CTA = 'cta';

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
