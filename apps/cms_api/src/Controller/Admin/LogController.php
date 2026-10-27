<?php

declare(strict_types=1);

namespace App\Controller\Admin;

use Fagathe\CmsCore\Service\LogViewerService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

/**
 * Consultation des fichiers de log de l'API (réservé ROLE_SUPER_ADMIN).
 */
#[Route('/admin/logs', name: 'api_admin_logs_')]
#[IsGranted('ROLE_SUPER_ADMIN')]
final class LogController extends AbstractController
{
    public function __construct(private readonly LogViewerService $logViewerService) {}

    /**
     * Arborescence des fichiers de log groupés par date.
     */
    #[Route('', name: 'index', methods: ['GET'])]
    public function index(): JsonResponse
    {
        $res = $this->logViewerService->getTree();

        return $this->json($res->data, $res->status, $res->headers, $res->context);
    }

    /**
     * Entrées d'un fichier de log ; filePath utilise des points comme séparateurs (ex: service.post-service).
     */
    #[Route(
        '/{date}/{filePath}',
        name: 'view',
        requirements: ['date' => '\d{2}-\d{2}-\d{4}', 'filePath' => '[\w\-]+(\.[\w\-]+)*'],
        methods: ['GET']
    )]
    public function view(string $date, string $filePath): JsonResponse
    {
        $res = $this->logViewerService->getFile($date, $filePath);

        return $this->json($res->data, $res->status, $res->headers, $res->context);
    }
}
