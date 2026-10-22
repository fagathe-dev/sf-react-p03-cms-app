<?php

declare(strict_types=1);

namespace App\Controller\Taxonomy;

use Fagathe\CmsCore\Service\CategoryService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/categories', name: 'api_categories_')]
final class CategoryController extends AbstractController
{
    public function __construct(
        private readonly CategoryService $service,
    ) {}

    #[Route('', name: 'list', methods: ['GET'])]
    public function list(Request $request): JsonResponse
    {
        $res = $this->service->list($request);

        return $this->json($res->data, $res->status, $res->headers, $res->context);
    }

    #[Route('/{identifier}', name: 'show', methods: ['GET'])]
    public function show(string $identifier): JsonResponse
    {
        $res = $this->service->show($identifier);

        return $this->json($res->data, $res->status, $res->headers, $res->context);
    }

    #[Route('', name: 'create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $res = $this->service->create($request);

        return $this->json($res->data, $res->status, $res->headers, $res->context);
    }

    #[Route('/{id}', name: 'update', methods: ['PUT', 'PATCH'])]
    public function update(string $id, Request $request): JsonResponse
    {
        $res = $this->service->update($id, $request);

        return $this->json($res->data, $res->status, $res->headers, $res->context);
    }

    #[Route('/{id}', name: 'delete', methods: ['DELETE'])]
    public function delete(string $id): JsonResponse
    {
        $res = $this->service->delete($id);

        return $this->json($res->data, $res->status, $res->headers, $res->context);
    }
}
