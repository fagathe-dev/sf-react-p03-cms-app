<?php

declare(strict_types=1);

namespace App\Controller\Post;

use Fagathe\CmsCore\Service\PostService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/posts/{postId}', name: 'api_post_medias_')]
#[IsGranted('ROLE_CONTRIBUTOR')]
final class PostMediaController extends AbstractController
{
    public function __construct(
        private readonly PostService $service,
    ) {}

    /**
     * Upload ou remplacement de la miniature (thumbnail) de l'article.
     */
    #[Route('/thumbnail', name: 'upload_thumbnail', methods: ['POST'])]
    public function uploadThumbnail(string $postId, Request $request): JsonResponse
    {
        $res = $this->service->uploadThumbnail($postId, $request);

        return $this->json($res->data, $res->status, $res->headers, $res->context);
    }

    /**
     * Upload d'un média (image, vidéo, audio) rattaché à l'article.
     */
    #[Route('/medias', name: 'upload_media', methods: ['POST'])]
    public function uploadMedia(string $postId, Request $request): JsonResponse
    {
        $res = $this->service->uploadMedia($postId, $request);

        return $this->json($res->data, $res->status, $res->headers, $res->context);
    }

    /**
     * Suppression d'un média rattaché à l'article.
     */
    #[Route('/medias/{mediaId}', name: 'delete_media', methods: ['DELETE'])]
    public function deleteMedia(string $postId, string $mediaId): JsonResponse
    {
        $res = $this->service->deleteMedia($postId, $mediaId);

        return $this->json($res->data, $res->status, $res->headers, $res->context);
    }
}
