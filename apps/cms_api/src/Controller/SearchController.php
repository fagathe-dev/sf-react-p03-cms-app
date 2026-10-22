<?php

declare(strict_types=1);

namespace App\Controller;

use Fagathe\CmsCore\Service\SearchService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/search', name: 'api_search_')]
final class SearchController extends AbstractController
{
    public function __construct(
        private readonly SearchService $searchService,
    ) {}

    /**
     * Recherche Full-Text globale sur les articles, catégories, tags et utilisateurs.
     * Paramètres query : ?q=terme&front=true
     */
    #[Route('', name: 'global', methods: ['GET'])]
    public function __invoke(Request $request): JsonResponse
    {
        $query = (string) $request->query->get('q', '');

        // Si l'utilisateur n'est pas membre du back-office (ROLE_CONTRIBUTOR+), on force le mode front
        $isFront = !$this->isGranted('ROLE_CONTRIBUTOR')
            || filter_var($request->query->get('front', false), FILTER_VALIDATE_BOOLEAN);

        $results = $this->searchService->globalSearch($query, $isFront);

        return $this->json(
            $results,
            Response::HTTP_OK,
            [],
            [
                'groups' => [
                    'post.list',
                    'category.list',
                    'tag.list',
                    'user.read',
                ],
            ]
        );
    }
}
