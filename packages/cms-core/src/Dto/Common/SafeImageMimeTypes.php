<?php

declare(strict_types=1);

namespace Fagathe\CmsCore\Dto\Common;

/**
 * Types MIME d'image acceptés pour les images affichées publiquement (avatar, image de catégorie).
 *
 * MimeType::IMAGE_MIMES sans image/svg+xml : un SVG peut embarquer du JavaScript (XSS stockée).
 */
final class SafeImageMimeTypes
{
    public const ALL = [
        'image/bmp',
        'image/webp',
        'image/tiff',
        'image/png',
        'image/gif',
        'image/x-icon',
        'image/jpeg',
        'image/x-canon-cr2',
    ];
}
