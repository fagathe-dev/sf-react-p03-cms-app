<?php

declare(strict_types=1);

namespace App\Controller\Moderation;

use Fagathe\CmsCore\Service\PostService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/moderation/posts', name: 'api_moderation_posts_')]
final class PostModerationController extends AbstractController
{
    public function __construct(
        private readonly PostService $service,
    ) {}

    /**
     * Liste des articles à modérer (signalés via ?flagged=true ou en statut REVIEW / REWRITING).
     */
    #[Route('', name: 'queue', methods: ['GET'])]
    #[IsGranted('ROLE_MODERATOR')]
    public function listForModeration(Request $request): JsonResponse
    {
        $res = $this->service->listForModeration($request);

        return $this->json($res->data, $res->status, $res->headers, $res->context);
    }

    /**
     * Signalement d'un article par un utilisateur connecté (choix FlagReason + commentaire).
     */
    #[Route('/{id}/flag', name: 'flag', methods: ['POST'])]
    #[IsGranted('ROLE_USER')]
    public function flag(string $id, Request $request): JsonResponse
    {
        $res = $this->service->flag($id, $request);

        return $this->json($res->data, $res->status, $res->headers, $res->context);
    }

    /**
     * Revue / Modération d'un article par un ROLE_MODERATOR+ (statuts PUBLISHED, REVIEW, REWRITING).
     */
    #[Route('/{id}/review', name: 'review', methods: ['POST', 'PATCH'])]
    #[IsGranted('ROLE_MODERATOR')]
    public function review(string $id, Request $request): JsonResponse
    {
        $res = $this->service->review($id, $request);

        return $this->json($res->data, $res->status, $res->headers, $res->context);
    }
}