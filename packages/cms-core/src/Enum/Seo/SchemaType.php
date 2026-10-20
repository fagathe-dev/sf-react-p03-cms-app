<?php

declare(strict_types=1);

namespace Fagathe\CmsCore\Enum\Seo;

enum SchemaType: string
{
    case TECH_ARTICLE = 'TechArticle';
    case BLOG_POSTING = 'BlogPosting';
    case COLLECTION_PAGE = 'CollectionPage';
    case WEB_PAGE = 'WebPage';
    case CONTACT_PAGE = 'ContactPage';
    case ABOUT_PAGE = 'AboutPage';
    case FAQ_PAGE = 'FAQPage';
    case PROFILE_PAGE = 'ProfilePage';

    /**
     * @return array<string>
     */
    public static function values(): array
    {
        return array_reduce(static::cases(), fn($carry, $i) => [...$carry, $i->value], []);
    }
}
