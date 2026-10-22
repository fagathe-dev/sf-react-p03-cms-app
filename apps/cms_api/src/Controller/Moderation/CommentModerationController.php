<?php

declare(strict_types=1);

namespace App\Controller\Moderation;

use Fagathe\CmsCore\Service\CommentService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/moderation/comments', name: 'api_moderation_comments_')]
final class CommentModerationController extends AbstractController
{
    public function __construct(
        private readonly CommentService $service,
    ) {}

    /**
     * File de modération des commentaires (filtrable par ?flagged=true ou ?status=pending).
     */
    #[Route('', name: 'queue', methods: ['GET'])]
    #[IsGranted('ROLE_MODERATOR')]
    public function listForModeration(Request $request): JsonResponse
    {
        $res = $this->service->listForModeration($request);

        return $this->json($res->data, $res->status, $res->headers, $res->context);
    }

    /**
     * Liste des commentaires rattachés à un article.
     */
    #[Route('/post/{postId}', name: 'list_by_post', methods: ['GET'])]
    public function listByPost(string $postId, Request $request): JsonResponse
    {
        $onlyApproved = filter_var($request->query->get('onlyApproved', true), FILTER_VALIDATE_BOOLEAN);
        $res = $this->service->listByPost($postId, $onlyApproved);

        return $this->json($res->data, $res->status, $res->headers, $res->context);
    }

    /**
     * Publication d'un commentaire sur un article (utilisateur connecté).
     */
    #[Route('', name: 'create', methods: ['POST'])]
    #[IsGranted('ROLE_USER')]
    public function create(Request $request): JsonResponse
    {
        $res = $this->service->create($request);

        return $this->json($res->data, $res->status, $res->headers, $res->context);
    }

    /**
     * Modification d'un commentaire par son auteur.
     */
    #[Route('/{id}', name: 'update', methods: ['PUT', 'PATCH'])]
    #[IsGranted('ROLE_USER')]
    public function update(string $id, Request $request): JsonResponse
    {
        $res = $this->service->update($id, $request);

        return $this->json($res->data, $res->status, $res->headers, $res->context);
    }

    /**
     * Signalement d'un commentaire par un lecteur connecté.
     */
    #[Route('/{id}/flag', name: 'flag', methods: ['POST'])]
    #[IsGranted('ROLE_USER')]
    public function flag(string $id, Request $request): JsonResponse
    {
        $res = $this->service->flag($id, $request);

        return $this->json($res->data, $res->status, $res->headers, $res->context);
    }

    /**
     * Validation / Rejet d'un commentaire par un modérateur (ROLE_MODERATOR+).
     */
    #[Route('/{id}/moderate', name: 'moderate', methods: ['POST', 'PATCH'])]
    #[IsGranted('ROLE_MODERATOR')]
    public function moderate(string $id, Request $request): JsonResponse
    {
        $res = $this->service->moderate($id, $request);

        return $this->json($res->data, $res->status, $res->headers, $res->context);
    }

    /**
     * Suppression d'un commentaire (auteur ou ROLE_MODERATOR+).
     */
    #[Route('/{id}', name: 'delete', methods: ['DELETE'])]
    #[IsGranted('ROLE_USER')]
    public function delete(string $id): JsonResponse
    {
        $res = $this->service->delete($id);

        return $this->json($res->data, $res->status, $res->headers, $res->context);
    }
}
