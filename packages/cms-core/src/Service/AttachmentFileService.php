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
use Fagathe\CorePhp\Trait\DatetimeTrait;
use Fagathe\CorePhp\Trait\LoggerTrait;
use Fagathe\CorePhp\Uploader\FileUploadException;
use Fagathe\CorePhp\Uploader\UploaderService;
use Fagathe\CorePhp\Uploader\UploaderValidationService;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Throwable;

final class AttachmentFileService
{
    use LoggerTrait, DatetimeTrait, FileTrait;

    private const MAX_SIZE = 50 * 1024 * 1024; // 50 Mo
    private const MAX_THUMBNAIL_SIZE = 10 * 1024 * 1024; // 10 Mo

    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly UploaderService $uploader,
        private readonly FilePathResolver $fileResolver,
        private readonly Security $security,
    ) {}

    /**
     * @throws FileUploadException
     */
    public function upload(UploadedFile $file, Post $post, User $user, ?string $alt = null): PostMedia
    {
        $allowedMimes = [...MimeType::IMAGE_MIMES, ...MimeType::VIDEO_MIMES, ...MimeType::AUDIO_MIMES];

        // Instance dédiée : le service injecté est partagé, ses setters modifieraient les règles du reste de la requête
        $result = (new UploaderValidationService($allowedMimes, self::MAX_SIZE))->validate($file);
        if (!is_bool($result) && $result !== true) {
            throw new FileUploadException(implode(' ', $result));
        }

        $uploadResult = $this->uploader
            ->setUploadDirectory(self::mediaDirectory($post))
            ->upload($file);

        $media = (new PostMedia())
            ->setPost($post)
            ->setAlt($alt)
            ->setOriginalName($uploadResult->originalName)
            ->setFilePath($uploadResult->relativePath)
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
     * Upload et remplace la miniature (thumbnail) d'un article. Retourne son URL absolue.
     *
     * @throws FileUploadException
     */
    public function uploadPostThumbnail(UploadedFile $file, Post $post): string
    {
        $result = (new UploaderValidationService(MimeType::IMAGE_MIMES, self::MAX_THUMBNAIL_SIZE))->validate($file);
        if (!is_bool($result) && $result !== true) {
            throw new FileUploadException(implode(' ', $result));
        }

        // L'ancienne miniature n'est supprimée par l'uploader qu'une fois la nouvelle déplacée
        $subDir = self::thumbnailDirectory($post);
        $uploadResult = $this->uploader
            ->setUploadDirectory($subDir)
            ->upload($file, $this->fileResolver->extractUploadedPath($post->getThumbnail(), $subDir));

        $post->setThumbnail($uploadResult->relativePath)->setUpdatedAt($this->now());

        return (string) $this->fileResolver->resolveUrl($uploadResult->relativePath);
    }

    public function delete(AbstractFile $file, bool $flush = true): bool
    {
        try {
            $subDir = $file instanceof PostMedia ? self::mediaDirectory($file->getPost()) : '';
            $this->deleteRawPath($file->getFilePath(), $subDir);

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
            $this->deleteRawPath($post->getThumbnail(), self::thumbnailDirectory($post));
            $post->setThumbnail(null);
        }

        foreach ($post->getMedias() as $media) {
            $this->delete($media, flush: false);
        }

        $this->em->flush();
    }

    /**
     * Supprime un fichier uploadé à partir de son URL ou de son chemin, s'il se trouve dans {uploadDir}/{subDirectory}/.
     */
    public function deleteRawPath(?string $urlOrPath, string $subDirectory = ''): void
    {
        $relativePath = $this->fileResolver->extractUploadedPath($urlOrPath, $subDirectory);
        if ($relativePath) {
            $this->uploader->delete($relativePath);
        }
    }

    private static function mediaDirectory(?Post $post): string
    {
        return 'posts/' . (string) $post?->getId();
    }

    private static function thumbnailDirectory(Post $post): string
    {
        return self::mediaDirectory($post) . '/thumbnail';
    }
}
