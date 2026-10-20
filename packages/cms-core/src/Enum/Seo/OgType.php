<?php

declare(strict_types=1);

namespace Fagathe\CmsCore\Enum\Seo;

enum OgType: string
{
    case WEBSITE = 'website';
    case ARTICLE = 'article';
    case PROFILE = 'profile';
}
