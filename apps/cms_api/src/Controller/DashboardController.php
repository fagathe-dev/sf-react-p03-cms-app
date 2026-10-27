<?php

declare(strict_types=1);

namespace App\Controller;

use Fagathe\CmsCore\Service\DashboardService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

/**
 * Tableau de bord du back-office : sections agrégées selon les droits de l'utilisateur (DashboardService).
 */
#[Route('/dashboard', name: 'api_dashboard_index', methods: ['GET'])]
#[IsGranted('ROLE_CONTRIBUTOR')]
final class DashboardController extends AbstractController
{
    public function __construct(private readonly DashboardService $dashboardService) {}

    public function __invoke(): JsonResponse
    {
        $res = $this->dashboardService->getDashboardData();

        return $this->json($res->data, $res->status, $res->headers, $res->context);
    }
}
