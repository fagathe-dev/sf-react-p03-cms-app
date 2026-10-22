<?php

declare(strict_types=1);

namespace Fagathe\CmsCore\Dto\Post;

use Fagathe\CorePhp\File\MimeType;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\Validator\Constraints as Assert;

final class UploadPostThumbnailDto
{
    public function __construct(
        #[Assert\NotNull(message: 'Veuillez sélectionner une image de couverture.')]
        #[Assert\File(
            maxSize: '10M',
            mimeTypes: MimeType::IMAGE_MIMES,
            maxSizeMessage: 'La miniature ne doit pas dépasser 10 Mo.',
            mimeTypesMessage: 'Seuls les formats d\'image standards sont acceptés pour la miniature.'
        )]
        public readonly ?UploadedFile $file = null,
    ) {}
}