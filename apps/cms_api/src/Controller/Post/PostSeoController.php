<?php

declare(strict_types=1);

namespace App\Controller\Post;

use Fagathe\CmsCore\Entity\Post;
use Fagathe\CmsCore\Repository\PostRepository;
use Fagathe\CmsCore\Service\SeoMetadataService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Uid\Uuid;

#[Route('/posts', name: 'api_post_seo_')]
final class PostSeoController extends AbstractController
{
    public function __construct(
        private readonly SeoMetadataService $seoService,
        private readonly PostRepository $postRepository,
    ) {}

    /**
     * Récupère les métadonnées SEO brutes enregistrées pour un article.
     */
    #[Route('/{postId}/seo', name: 'show', methods: ['GET'])]
    public function show(string $postId): JsonResponse
    {
        $res = $this->seoService->showByTarget('post', $postId);

        return $this->json($res->data, $res->status, $res->headers, $res->context);
    }

    /**
     * Génère le paquet complet (Meta + OpenGraph + GEO + JSON-LD) pour un article (par ID ou Slug).
     */
    #[Route('/{identifier}/seo/schema', name: 'schema', methods: ['GET'])]
    public function schema(string $identifier, Request $request): JsonResponse
    {
        $post = Uuid::isValid($identifier)
            ? $this->postRepository->find(Uuid::fromString($identifier))
            : $this->postRepository->findOneBy(['slug' => $identifier]);

        if (!$post instanceof Post) {
            return $this->json(['message' => 'Article introuvable.'], Response::HTTP_NOT_FOUND);
        }

        $path = (string) $request->query->get('path', '/blog/' . $post->getSlug());
        $data = $this->seoService->buildForArticle($post, $path);

        return $this->json($data, Response::HTTP_OK);
    }

    /**
     * Crée ou met à jour (Upsert) les métadonnées SEO d'un article.
     */
    #[Route('/{postId}/seo', name: 'save', methods: ['POST', 'PUT', 'PATCH'])]
    public function save(string $postId, Request $request): JsonResponse
    {
        $payload = json_decode($request->getContent(), true);
        if (!is_array($payload)) {
            $payload = [];
        }

        $payload['targetType'] = $payload['targetType'] ?? 'post';
        $payload['targetIdentifier'] = $postId;

        $internalRequest = new Request(
            $request->query->all(),
            $request->request->all(),
            $request->attributes->all(),
            $request->cookies->all(),
            $request->files->all(),
            $request->server->all(),
            json_encode($payload, JSON_THROW_ON_ERROR)
        );

        $res = $this->seoService->save($internalRequest);

        return $this->json($res->data, $res->status, $res->headers, $res->context);
    }

    /**
     * Supprime une entrée SeoMetadata par son identifiant UUID.
     */
    #[Route('/seo/{seoId}', name: 'delete', methods: ['DELETE'])]
    public function delete(string $seoId): JsonResponse
    {
        $res = $this->seoService->delete($seoId);

        return $this->json($res->data, $res->status, $res->headers, $res->context);
    }
}
