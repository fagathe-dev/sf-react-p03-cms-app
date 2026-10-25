<?php

declare(strict_types=1);

namespace Fagathe\CmsCore\Serializer;

use Fagathe\CmsCore\Entity\AbstractFile;
use Fagathe\CmsCore\Entity\Post;
use Fagathe\CmsCore\Entity\User;
use Fagathe\CmsCore\Service\FilePathResolver;
use Symfony\Component\Serializer\Normalizer\NormalizerAwareInterface;
use Symfony\Component\Serializer\Normalizer\NormalizerAwareTrait;
use Symfony\Component\Serializer\Normalizer\NormalizerInterface;

/**
 * Remplace, dans la sortie JSON, le chemin relatif stocké en BDD par l'URL absolue du fichier
 * (avatar, miniature, médias), y compris pour les objets imbriqués (ex. post.author.avatar).
 */
final class FileUrlNormalizer implements NormalizerInterface, NormalizerAwareInterface
{
    use NormalizerAwareTrait;

    /**
     * Propriétés contenant le chemin d'un fichier uploadé, par classe.
     */
    private const FILE_PROPERTIES = [
        User::class         => ['avatar'],
        Post::class         => ['thumbnail'],
        AbstractFile::class => ['filePath'],
    ];

    // Objet en cours de normalisation : évite de se rappeler soi-même via $this->normalizer
    private const CURRENT_OBJECT = 'cms_core.file_url_normalizer.object_id';

    public function __construct(
        private readonly FilePathResolver $fileResolver,
    ) {}

    public function normalize(mixed $data, ?string $format = null, array $context = []): array|string|int|float|bool|\ArrayObject|null
    {
        $context[self::CURRENT_OBJECT] = spl_object_id($data);
        $normalized = $this->normalizer->normalize($data, $format, $context);

        if (!is_array($normalized)) {
            return $normalized;
        }

        foreach (self::fileProperties($data) as $property) {
            if (isset($normalized[$property]) && is_string($normalized[$property])) {
                $normalized[$property] = $this->fileResolver->resolveUrl($normalized[$property]);
            }
        }

        return $normalized;
    }

    public function supportsNormalization(mixed $data, ?string $format = null, array $context = []): bool
    {
        return is_object($data)
            && ($context[self::CURRENT_OBJECT] ?? null) !== spl_object_id($data)
            && self::fileProperties($data) !== [];
    }

    public function getSupportedTypes(?string $format): array
    {
        // Non cacheable : le support dépend du contexte (CURRENT_OBJECT)
        return array_fill_keys(array_keys(self::FILE_PROPERTIES), false);
    }

    /**
     * @return list<string>
     */
    private static function fileProperties(object $data): array
    {
        foreach (self::FILE_PROPERTIES as $class => $properties) {
            if ($data instanceof $class) {
                return $properties;
            }
        }

        return [];
    }
}
