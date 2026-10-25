<?php

namespace Fagathe\CmsCore\Dto\Account;

use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\Validator\Constraints as Assert;

final class UploadAvatarDto
{
    /**
     * MimeType::IMAGE_MIMES sans image/svg+xml : un SVG peut embarquer du JavaScript (XSS stockée).
     */
    public const ALLOWED_MIME_TYPES = [
        'image/bmp',
        'image/webp',
        'image/tiff',
        'image/png',
        'image/gif',
        'image/x-icon',
        'image/jpeg',
        'image/x-canon-cr2',
    ];

    public function __construct(
        #[Assert\NotNull(message: 'Veuillez sélectionner une image.')]
        #[Assert\File(
            maxSize: '10M',
            mimeTypes: self::ALLOWED_MIME_TYPES,
            maxSizeMessage: 'L\'image ne doit pas dépasser 10 Mo.',
            mimeTypesMessage: 'Seuls les formats d\'image standards sont acceptés pour l\'avatar.'
        )]
        public readonly ?UploadedFile $file = null,
    ) {}
}
