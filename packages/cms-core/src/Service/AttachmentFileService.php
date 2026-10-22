<?php

declare(strict_types=1);

namespace Fagathe\CmsCore\Service;

use Doctrine\ORM\EntityManagerInterface;
use Fagathe\CmsCore\Entity\AbstractFile;
use Fagathe\CmsCore\Entity\Post;
use Fagathe\CmsCore\Entity\PostMedia;
use Fagathe\CmsCore\Entity\User;
use Fagathe\CorePhp\Enum\LoggerLevelEnum;
use Fagathe\CorePhp\File\FileTrait;
use Fagathe\CorePhp\File\MimeType;
use Fagathe\CorePhp\Http\RequestTrait;
use Fagathe\CorePhp\Trait\DatetimeTrait;
use Fagathe\CorePhp\Trait\LoggerTrait;
use Fagathe\CorePhp\Uploader\FileUploadException;
use Fagathe\CorePhp\Uploader\UploaderService;
use Fagathe\CorePhp\Uploader\UploaderValidationService;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Throwable;

final class AttachmentFileService
{
    use LoggerTrait, DatetimeTrait, FileTrait, RequestTrait;

    private const MAX_SIZE = 50 * 1024 * 1024; // 50 Mo
    private const MAX_THUMBNAIL_SIZE = 10 * 1024 * 1024; // 10 Mo

    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly UploaderService $uploader,
        private readonly ?string $defaultUri = null,
    ) {}

    /**
     * @throws FileUploadException
     */
    public function upload(UploadedFile $file, Post $post, User $user, ?string $alt = null): PostMedia
    {
        $allowedMimes = [...MimeType::IMAGE_MIMES, ...MimeType::VIDEO_MIMES, ...MimeType::AUDIO_MIMES];
        $subDir = 'posts/' . (string) $post->getId();

        $validator = new UploaderValidationService();
        $validator->setAllowedMimeTypes($allowedMimes)->setMaxSize(self::MAX_SIZE);

        $result = $validator->validate($file);
        if ($result !== true && is_array($result)) {
            throw new FileUploadException(implode(' ', $result));
        }

        $uploadResult = $this->uploader
            ->setUploadDirectory($subDir)
            ->upload($file);

        $media = (new PostMedia())
            ->setPost($post)
            ->setAlt($alt)
            ->setOriginalName($uploadResult->originalName)
            ->setFilePath((string) $this->formatFileUri($uploadResult->relativePath))
            ->setMimeType($uploadResult->mimeType)
            ->setExtension($uploadResult->extension)
            ->setSize($uploadResult->size)
            ->setType($this->matchMimeType($uploadResult->mimeType))
            ->setCreatedAt($this->now())
            ->setOwner($user);

        $this->em->persist($media);
        $this->em->flush();

        $this->generateLog(
            LoggerLevelEnum::Info,
            [
                'message' => 'Média d\'article uploadé avec succès',
                'data'    => [
                    'post_id' => (string) $post->getId(),
                    'file'    => $uploadResult->originalName,
                    'size'    => $this->formatFileSize($uploadResult->size),
                ],
            ],
            ['action' => 'post_media.upload.success']
        );

        return $media;
    }

    /**
     * Upload et remplace la miniature (thumbnail) d'un article.
     *
     * @throws FileUploadException
     */
    public function uploadPostThumbnail(UploadedFile $file, Post $post): string
    {
        $validator = new UploaderValidationService();
        $validator->setAllowedMimeTypes(MimeType::IMAGE_MIMES)->setMaxSize(self::MAX_THUMBNAIL_SIZE);

        $result = $validator->validate($file);
        if ($result !== true && is_array($result)) {
            throw new FileUploadException(implode(' ', $result));
        }

        if ($post->getThumbnail()) {
            $this->deleteRawPath($post->getThumbnail());
        }

        $subDir = 'posts/' . (string) $post->getId() . '/thumbnail';
        $uploadResult = $this->uploader
            ->setUploadDirectory($subDir)
            ->upload($file);

        $uri = (string) $this->formatFileUri($uploadResult->relativePath);
        $post->setThumbnail($uri)->setUpdatedAt($this->now());

        return $uri;
    }

    public function delete(AbstractFile $file, bool $flush = true): bool
    {
        try {
            if ($file->getFilePath()) {
                $this->deleteRawPath($file->getFilePath());
            }

            $this->em->remove($file);
            if ($flush) {
                $this->em->flush();
            }

            $this->generateLog(
                LoggerLevelEnum::Info,
                [
                    'message' => 'Fichier supprimé',
                    'data'    => ['file_id' => (string) $file->getId()],
                ],
                ['action' => 'post_media.delete.success']
            );

            return true;
        } catch (Throwable $e) {
            $this->generateLog(
                LoggerLevelEnum::Error,
                [
                    'message'   => 'Erreur lors de la suppression du fichier',
                    'data'      => ['file_id' => (string) $file->getId()],
                    'exception' => $e->getMessage(),
                ],
                ['action' => 'post_media.delete.error']
            );

            return false;
        }
    }

    public function deleteByPost(Post $post): void
    {
        if ($post->getThumbnail()) {
            $this->deleteRawPath($post->getThumbnail());
            $post->setThumbnail(null);
        }

        foreach ($post->getMedias() as $media) {
            $this->delete($media, flush: false);
        }

        $this->em->flush();
    }

    public function deleteRawPath(?string $urlOrPath): void
    {
        $relativePath = $this->extractRelativePath($urlOrPath);
        if ($relativePath) {
            $this->uploader->delete($relativePath);
        }
    }

    public function formatFileUri(?string $path): ?string
    {
        if (!$path) {
            return null;
        }
        if (str_starts_with($path, 'http://') || str_starts_with($path, 'https://')) {
            return $path;
        }

        $base = !empty($this->defaultUri) ? rtrim($this->defaultUri, '/') : rtrim($this->getOrigin(), '/');

        return sprintf('%s/%s', $base, ltrim($path, '/'));
    }

    private function extractRelativePath(?string $urlOrPath): ?string
    {
        if (!$urlOrPath) {
            return null;
        }
        $parsed = parse_url($urlOrPath, PHP_URL_PATH);

        return ltrim($parsed ?: $urlOrPath, '/');
    }
}
