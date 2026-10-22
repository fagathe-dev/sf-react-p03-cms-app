<?php

declare(strict_types=1);

namespace Fagathe\CmsCore\Dto\Post;

use Fagathe\CorePhp\File\MimeType;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\Validator\Constraints as Assert;

final class UploadPostMediaDto
{
    public function __construct(
        #[Assert\NotNull(message: 'Veuillez fournir un fichier média.')]
        #[Assert\File(
            maxSize: '50M',
            mimeTypes: [...MimeType::IMAGE_MIMES, ...MimeType::VIDEO_MIMES, ...MimeType::AUDIO_MIMES],
            maxSizeMessage: 'Le fichier média ne doit pas dépasser 50 Mo.',
            mimeTypesMessage: 'Format de fichier non supporté (images, vidéos ou audios uniquement).'
        )]
        public readonly ?UploadedFile $file = null,

        #[Assert\Length(max: 255, maxMessage: 'Le texte alternatif ne peut pas dépasser {{ limit }} caractères.')]
        public readonly ?string $alt = null,

        #[Assert\Length(max: 255, maxMessage: 'Le nom d\'affichage ne peut pas dépasser {{ limit }} caractères.')]
        public readonly ?string $niceName = null,

        public readonly bool $isPinned = false,
    ) {}
}
