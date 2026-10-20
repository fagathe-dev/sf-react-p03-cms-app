<?php

declare(strict_types=1);

namespace Fagathe\CmsCore\Service;

use App\Entity\AbstractFile;
use App\Entity\Post;
use App\Entity\PostMedia;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Fagathe\CorePhp\Enum\LoggerLevelEnum;
use Fagathe\CorePhp\File\FileTrait;
use Fagathe\CorePhp\File\MimeType;
use Fagathe\CorePhp\Http\RequestTrait;
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
    use LoggerTrait, DatetimeTrait, FileTrait, RequestTrait;

    private const MAX_SIZE = 50 * 1024 * 1024; // 50 Mo

    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly UploaderService $uploader,
        private readonly Security $security,
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
            ->setFilePath($this->formatFileUri($uploadResult->relativePath))
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
                'post_id' => (string) $post->getId(),
                'file'    => $uploadResult->originalName,
                'size'    => $this->formatFileSize($uploadResult->size),
            ],
            ['action' => 'post_media.upload.success']
        );

        return $media;
    }

    public function delete(AbstractFile $file): bool
    {
        try {
            if ($file->getFilePath()) {
                $this->uploader->delete((string) $this->extractRelativePath($file->getFilePath()));
            }

            $this->em->remove($file);
            $this->em->flush();

            $this->generateLog(
                LoggerLevelEnum::Info,
                ['message' => 'Fichier supprimé', 'file_id' => (string) $file->getId()],
                ['action' => 'post_media.delete.success']
            );

            return true;
        } catch (Throwable $e) {
            $this->generateLog(
                LoggerLevelEnum::Error,
                ['message' => 'Erreur lors de la suppression du fichier', 'file_id' => (string) $file->getId(), 'error' => $e->getMessage()],
                ['action' => 'post_media.delete.error']
            );

            return false;
        }
    }

    public function deleteByPost(Post $post): void
    {
        if ($post->getThumbnail()) {
            $this->uploader->delete((string) $this->extractRelativePath($post->getThumbnail()));
        }

        foreach ($post->getMedias() as $media) {
            $this->delete($media);
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
