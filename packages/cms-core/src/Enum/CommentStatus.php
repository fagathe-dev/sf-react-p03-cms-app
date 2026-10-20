<?php

declare(strict_types=1);

namespace Fagathe\CmsCore\Enum;

enum CommentStatus: string
{
    case PENDING = 'pending';
    case APPROVED = 'approved';
    case SPAM = 'spam';
    case REJECTED = 'rejected';
}
