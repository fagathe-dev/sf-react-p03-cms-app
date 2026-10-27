<?php

declare(strict_types=1);

namespace App\Controller\Admin;

use Fagathe\CmsCore\Service\EmailPreviewService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

/**
 * Prévisualisation des templates d'e-mails avec des données factices (réservé ROLE_SUPER_ADMIN).
 */
#[Route('/admin/emails', name: 'api_admin_emails_')]
#[IsGranted('ROLE_SUPER_ADMIN')]
final class EmailPreviewController extends AbstractController
{
    public function __construct(private readonly EmailPreviewService $emailPreviewService) {}

    /**
     * Liste des e-mails prévisualisables (objet, expéditeur, destinataire).
     */
    #[Route('', name: 'index', methods: ['GET'])]
    public function index(): JsonResponse
    {
        $res = $this->emailPreviewService->listPreviews();

        return $this->json($res->data, $res->status, $res->headers, $res->context);
    }

    /**
     * HTML rendu du template d'e-mail (affiché dans une iframe sandbox par le back-office).
     */
    #[Route('/{slug}', name: 'preview', requirements: ['slug' => '[a-z0-9-]+'], methods: ['GET'])]
    public function preview(string $slug): Response
    {
        $html = $this->emailPreviewService->renderPreview($slug);

        if ($html === null) {
            return $this->json(['message' => sprintf('Aucun e-mail "%s" à prévisualiser.', $slug)], Response::HTTP_NOT_FOUND);
        }

        return new Response($html, Response::HTTP_OK, ['Content-Type' => 'text/html; charset=UTF-8']);
    }
}
