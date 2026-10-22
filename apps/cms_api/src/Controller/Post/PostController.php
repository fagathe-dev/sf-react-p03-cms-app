<?php

declare(strict_types=1);

namespace App\Controller\Post;

use Fagathe\CmsCore\Service\PostService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/posts', name: 'api_posts_')]
final class PostController extends AbstractController
{
    public function __construct(
        private readonly PostService $service,
    ) {}

    #[Route('', name: 'list', methods: ['GET'])]
    public function list(Request $request): JsonResponse
    {
        $onlyPublished = !$this->isGranted('ROLE_CONTRIBUTOR')
            || filter_var($request->query->get('onlyPublished', false), FILTER_VALIDATE_BOOLEAN);

        $res = $this->service->list($request, $onlyPublished);

        return $this->json($res->data, $res->status, $res->headers, $res->context);
    }

    #[Route('/{identifier}', name: 'show', methods: ['GET'])]
    public function show(string $identifier, Request $request): JsonResponse
    {
        $trackView = filter_var($request->query->get('trackView', true), FILTER_VALIDATE_BOOLEAN);
        $res = $this->service->show($identifier, $request, $trackView);

        return $this->json($res->data, $res->status, $res->headers, $res->context);
    }

    #[Route('', name: 'create', methods: ['POST'])]
    #[IsGranted('ROLE_CONTRIBUTOR')]
    public function create(Request $request): JsonResponse
    {
        $res = $this->service->create($request);

        return $this->json($res->data, $res->status, $res->headers, $res->context);
    }

    #[Route('/{id}', name: 'update', methods: ['PUT', 'PATCH'])]
    #[IsGranted('ROLE_CONTRIBUTOR')]
    public function update(string $id, Request $request): JsonResponse
    {
        $res = $this->service->update($id, $request);

        return $this->json($res->data, $res->status, $res->headers, $res->context);
    }

    #[Route('/{id}/trash', name: 'trash', methods: ['POST', 'PATCH'])]
    #[IsGranted('ROLE_CONTRIBUTOR')]
    public function trash(string $id): JsonResponse
    {
        $res = $this->service->trash($id);

        return $this->json($res->data, $res->status, $res->headers, $res->context);
    }

    #[Route('/{id}/restore', name: 'restore', methods: ['POST', 'PATCH'])]
    #[IsGranted('ROLE_CONTRIBUTOR')]
    public function restore(string $id): JsonResponse
    {
        $res = $this->service->restore($id);

        return $this->json($res->data, $res->status, $res->headers, $res->context);
    }

    #[Route('/{id}', name: 'delete_permanently', methods: ['DELETE'])]
    #[IsGranted('ROLE_CONTRIBUTOR')]
    public function deletePermanently(string $id): JsonResponse
    {
        $res = $this->service->deletePermanently($id);

        return $this->json($res->data, $res->status, $res->headers, $res->context);
    }

    #[Route('/{postId}/blocks', name: 'create_block', methods: ['POST'])]
    #[IsGranted('ROLE_CONTRIBUTOR')]
    public function createBlock(string $postId, Request $request): JsonResponse
    {
        $res = $this->service->saveBlock($postId, $request);

        return $this->json($res->data, $res->status, $res->headers, $res->context);
    }

    #[Route('/{postId}/blocks/{blockId}', name: 'update_block', methods: ['PUT', 'PATCH'])]
    #[IsGranted('ROLE_CONTRIBUTOR')]
    public function updateBlock(string $postId, string $blockId, Request $request): JsonResponse
    {
        $res = $this->service->saveBlock($postId, $request, $blockId);

        return $this->json($res->data, $res->status, $res->headers, $res->context);
    }

    #[Route('/{postId}/blocks/{blockId}', name: 'remove_block', methods: ['DELETE'])]
    #[IsGranted('ROLE_CONTRIBUTOR')]
    public function removeBlock(string $postId, string $blockId): JsonResponse
    {
        $res = $this->service->removeBlock($postId, $blockId);

        return $this->json($res->data, $res->status, $res->headers, $res->context);
    }

    #[Route('/{postId}/like', name: 'toggle_like', methods: ['POST'])]
    #[IsGranted('ROLE_USER')]
    public function toggleLike(string $postId): JsonResponse
    {
        $res = $this->service->toggleLike($postId);

        return $this->json($res->data, $res->status, $res->headers, $res->context);
    }
}