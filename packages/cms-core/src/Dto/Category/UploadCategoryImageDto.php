<?php

declare(strict_types=1);

namespace Fagathe\CmsCore\Dto\Category;

use Fagathe\CmsCore\Dto\Common\SafeImageMimeTypes;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\Validator\Constraints as Assert;

final class UploadCategoryImageDto
{
    public const MAX_SIZE = '5M';

    public function __construct(
        #[Assert\NotNull(message: 'Veuillez sélectionner une image.')]
        #[Assert\File(
            maxSize: self::MAX_SIZE,
            mimeTypes: SafeImageMimeTypes::ALL,
            maxSizeMessage: 'L\'image ne doit pas dépasser 5 Mo.',
            mimeTypesMessage: 'Seuls les formats d\'image standards sont acceptés (JPG, PNG, WEBP, GIF…).'
        )]
        public readonly ?UploadedFile $file = null,
    ) {}
}
