<?php

declare(strict_types=1);

namespace Fagathe\CmsCore\Enum\Post;

enum FlagReason: string
{
    case SPAM = 'spam';
    case INAPPROPRIATE = 'inappropriate';
    case HARASSMENT = 'harassment';
    case MISINFORMATION = 'misinformation';
    case COPYRIGHT = 'copyright';
    case OTHER = 'other';

    public function label(): string
    {
        return match ($this) {
            self::SPAM => 'Spam ou publicité non sollicitée',
            self::INAPPROPRIATE => 'Contenu offensant ou inapproprié',
            self::HARASSMENT => 'Harcèlement ou discours haineux',
            self::MISINFORMATION => 'Information fausse ou trompeuse',
            self::COPYRIGHT => 'Violation de droits d\'auteur / Plagiat',
            self::OTHER => 'Autre motif',
        };
    }

    /**
     * @return string[]
     */
    public static function values(): array
    {
        return array_map(static fn(self $case): string => $case->value, self::cases());
    }
}
