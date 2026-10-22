<?php

declare(strict_types=1);

namespace App\Controller;

use Fagathe\CmsCore\Enum\Seo\SchemaType;
use Fagathe\CmsCore\Repository\CategoryRepository;
use Fagathe\CmsCore\Repository\TagRepository;
use Fagathe\CmsCore\Service\SeoMetadataService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;
use Symfony\Component\Uid\Uuid;

#[Route('/seo', name: 'api_seo_')]
final class SeoMetadataController extends AbstractController
{
    public function __construct(
        private readonly SeoMetadataService $seoService,
        private readonly CategoryRepository $categoryRepository,
        private readonly TagRepository $tagRepository,
    ) {}

    /**
     * Récupère les métadonnées SEO brutes d'une cible (?targetType=page&targetIdentifier=home).
     */
    #[Route('/target', name: 'show_by_target', methods: ['GET'])]
    public function showByTarget(Request $request): JsonResponse
    {
        $targetType = (string) $request->query->get('targetType', '');
        $targetIdentifier = (string) $request->query->get('targetIdentifier', '');

        $res = $this->seoService->showByTarget($targetType, $targetIdentifier);

        return $this->json($res->data, $res->status, $res->headers, $res->context);
    }

    /**
     * Génère le paquet complet (Meta + OpenGraph + GEO + JSON-LD) pour une Page Statique.
     */
    #[Route('/static/{pageKey}/schema', name: 'static_schema', methods: ['GET'])]
    public function staticPageSchema(string $pageKey, Request $request): JsonResponse
    {
        $title = (string) $request->query->get('title', ucfirst($pageKey));
        $description = (string) $request->query->get('description', '');
        $path = (string) $request->query->get('path', '/' . ltrim($pageKey, '/'));
        $typeParam = (string) $request->query->get('type', SchemaType::WEB_PAGE->value);
        $schemaType = SchemaType::tryFrom($typeParam) ?? SchemaType::WEB_PAGE;

        $data = $this->seoService->buildForStaticPage(
            pageKey: $pageKey,
            defaultTitle: $title,
            defaultDescription: $description,
            path: $path,
            pageType: $schemaType
        );

        return $this->json($data, Response::HTTP_OK);
    }

    /**
     * Génère le paquet complet (Meta + OpenGraph + GEO + JSON-LD) pour une Catégorie ou un Tag.
     */
    #[Route('/taxonomy/{type}/{identifier}/schema', name: 'taxonomy_schema', methods: ['GET'])]
    public function taxonomySchema(string $type, string $identifier, Request $request): JsonResponse
    {
        $isCategory = strtolower($type) === 'category';
        $repo = $isCategory ? $this->categoryRepository : $this->tagRepository;

        $taxonomy = Uuid::isValid($identifier)
            ? $repo->find(Uuid::fromString($identifier))
            : $repo->findOneBy(['slug' => $identifier]);

        if ($taxonomy === null) {
            return $this->json(['message' => 'Taxonomie introuvable.'], Response::HTTP_NOT_FOUND);
        }

        $defaultPath = sprintf('/%s/%s', $isCategory ? 'categories' : 'tags', $taxonomy->getSlug());
        $path = (string) $request->query->get('path', $defaultPath);
        $prefixLabel = $isCategory ? 'Catégorie' : 'Tag';

        $data = $this->seoService->buildForTaxonomy($taxonomy, $path, $prefixLabel);

        return $this->json($data, Response::HTTP_OK);
    }

    /**
     * Crée ou met à jour (Upsert) des métadonnées SEO pour n'importe quelle cible.
     */
    #[Route('', name: 'save', methods: ['POST', 'PUT', 'PATCH'])]
    #[IsGranted('ROLE_MANAGER')]
    public function save(Request $request): JsonResponse
    {
        $res = $this->seoService->save($request);

        return $this->json($res->data, $res->status, $res->headers, $res->context);
    }

    /**
     * Supprime une entrée SeoMetadata par son UUID.
     */
    #[Route('/{id}', name: 'delete', methods: ['DELETE'])]
    #[IsGranted('ROLE_MANAGER')]
    public function delete(string $id): JsonResponse
    {
        $res = $this->seoService->delete($id);

        return $this->json($res->data, $res->status, $res->headers, $res->context);
    }
}
