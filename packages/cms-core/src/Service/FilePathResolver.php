<?php

declare(strict_types=1);

namespace Fagathe\CmsCore\Service;

use Fagathe\CorePhp\Http\RequestTrait;

/**
 * "Path resolver" des fichiers uploadés.
 *
 * La BDD stocke le chemin relatif au dossier public (UploadResult::$relativePath, ex. uploads/avatars/{id}/me.png) ;
 * l'API renvoie l'URL absolue (cms_core.default_uri + chemin). Les URL externes (ex. pravatar) sont conservées telles quelles.
 */
final class FilePathResolver
{
    use RequestTrait;

    public function __construct(
        private readonly string $uploadDir,
        private readonly ?string $defaultUri = null,
    ) {}

    public function getBaseUri(): string
    {
        if (!empty($this->defaultUri)) {
            return rtrim($this->defaultUri, '/');
        }

        return rtrim($this->getOrigin(), '/');
    }

    /**
     * URL absolue d'un fichier à partir du chemin stocké en BDD.
     */
    public function resolveUrl(?string $path): ?string
    {
        if (!$path) {
            return null;
        }

        if (self::isAbsoluteUrl($path)) {
            return $path;
        }

        return sprintf('%s/%s', $this->getBaseUri(), ltrim($path, '/'));
    }

    /**
     * Valeur à stocker en BDD : une URL servie par l'API (ex. renvoyée telle quelle par le front) redevient
     * un chemin relatif, une URL externe est conservée.
     */
    public function toStoredPath(?string $urlOrPath): ?string
    {
        $urlOrPath = $urlOrPath !== null ? trim($urlOrPath) : null;
        if (!$urlOrPath) {
            return null;
        }

        $baseUri = $this->getBaseUri() . '/';
        if (str_starts_with($urlOrPath, $baseUri)) {
            return substr($urlOrPath, strlen($baseUri));
        }

        return self::isAbsoluteUrl($urlOrPath) ? $urlOrPath : ltrim($urlOrPath, '/');
    }

    /**
     * Chemin relatif (depuis public/) d'un fichier uploadé, uniquement s'il se trouve dans {uploadDir}/{subDirectory}/.
     *
     * Null sinon : empêche de supprimer le fichier d'un autre dossier (ex. l'avatar d'un autre utilisateur),
     * UploaderService::delete() ne contrôlant que l'appartenance au dossier d'upload.
     * Les anciennes URL absolues (autre hôte que cms_core.default_uri) sont acceptées via leur chemin.
     */
    public function extractUploadedPath(?string $urlOrPath, string $subDirectory = ''): ?string
    {
        if (!$urlOrPath) {
            return null;
        }

        $path = ltrim(str_replace('\\', '/', (string) parse_url($urlOrPath, PHP_URL_PATH)), '/');

        // URL construite sur une base avec sous-chemin (ex. https://host/api/uploads/...)
        $basePath = trim((string) parse_url($this->getBaseUri(), PHP_URL_PATH), '/');
        if ($basePath !== '' && str_starts_with($path, $basePath . '/')) {
            $path = substr($path, strlen($basePath) + 1);
        }

        $prefix = implode('/', array_filter([trim($this->uploadDir, '/'), trim($subDirectory, '/')])) . '/';
        if (!str_starts_with($path, $prefix) || in_array('..', explode('/', $path), true)) {
            return null;
        }

        return $path;
    }

    private static function isAbsoluteUrl(string $value): bool
    {
        return str_starts_with($value, 'http://') || str_starts_with($value, 'https://');
    }
}
