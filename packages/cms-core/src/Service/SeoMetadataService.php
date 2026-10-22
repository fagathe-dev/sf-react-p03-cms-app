<?php

declare(strict_types=1);

namespace Fagathe\CmsCore\Service;

use Doctrine\ORM\EntityManagerInterface;
use Fagathe\CmsCore\Contract\ArticleSeoInterface;
use Fagathe\CmsCore\Contract\TaxonomySeoInterface;
use Fagathe\CmsCore\Dto\Seo\SaveSeoMetadataDto;
use Fagathe\CmsCore\Entity\Category;
use Fagathe\CmsCore\Entity\Post;
use Fagathe\CmsCore\Entity\SeoMetadata;
use Fagathe\CmsCore\Entity\Tag;
use Fagathe\CmsCore\Enum\Seo\SchemaType;
use Fagathe\CmsCore\Enum\Seo\SeoTargetType;
use Fagathe\CmsCore\Generator\JsonLdGenerator;
use Fagathe\CmsCore\Generator\SeoSchemaGenerator;
use Fagathe\CmsCore\Repository\SeoMetadataRepository;
use Fagathe\CmsCore\Security\Voter\CmsSettingVoter;
use Fagathe\CorePhp\Enum\LoggerLevelEnum;
use Fagathe\CorePhp\Http\RequestTrait;
use Fagathe\CorePhp\Http\ResponseTrait;
use Fagathe\CorePhp\Trait\DatetimeTrait;
use Fagathe\CorePhp\Trait\LoggerTrait;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Serializer\SerializerInterface;
use Symfony\Component\Uid\Uuid;
use Symfony\Component\Validator\Validator\ValidatorInterface;
use Throwable;

final class SeoMetadataService
{
    use ResponseTrait, DatetimeTrait, LoggerTrait, RequestTrait;

    public function __construct(
        private readonly SeoMetadataRepository $seoRepository,
        private readonly EntityManagerInterface $em,
        private readonly SerializerInterface $serializer,
        private readonly ValidatorInterface $validator,
        private readonly SeoSchemaGenerator $seoSchemaGenerator,
        private readonly JsonLdGenerator $jsonLdGenerator,
        private readonly Security $security,
    ) {}

    public function showByTarget(string $targetType, string $targetIdentifier): object
    {
        $seo = $this->seoRepository->findByTarget($targetType, $targetIdentifier);
        if (!$seo instanceof SeoMetadata) {
            return $this->notFoundResponse('Métadonnées SEO introuvables pour cette cible.');
        }

        return $this->sendJson($seo, Response::HTTP_OK, context: ['groups' => ['seo.read']]);
    }

    public function save(Request $request): object
    {
        if (!$this->security->isGranted(CmsSettingVoter::MANAGE_SEO)) {
            return $this->sendForbidden('Vous n\'avez pas les droits pour gérer les métadonnées SEO.');
        }

        try {
            /** @var SaveSeoMetadataDto $dto */
            $dto = $this->serializer->deserialize($request->getContent(), SaveSeoMetadataDto::class, 'json');
        } catch (Throwable) {
            return $this->sendJson(['message' => 'Format de données JSON invalide.'], Response::HTTP_BAD_REQUEST);
        }

        $violations = $this->validator->validate($dto);
        if (count($violations) > 0) {
            return $this->sendViolations($violations);
        }

        $existing = $this->seoRepository->findByTarget($dto->targetType, $dto->targetIdentifier);
        $isNew = !$existing instanceof SeoMetadata;
        $seo = $existing ?? new SeoMetadata();

        $this->hydrateSeoMetadata($seo, $dto);
        if (!$isNew) {
            $seo->setUpdatedAt($this->now());
        }

        $entityViolations = $this->validator->validate($seo);
        if (count($entityViolations) > 0) {
            return $this->sendViolations($entityViolations);
        }

        try {
            if ($isNew) {
                $this->em->persist($seo);
            }
            $this->em->flush();

            $this->generateLog(
                LoggerLevelEnum::Info,
                [
                    'message' => $isNew ? 'Métadonnées SEO créées' : 'Métadonnées SEO mises à jour',
                    'data'    => [
                        'seo_id'            => (string) $seo->getId(),
                        'target_type'       => $seo->getTargetType()->value,
                        'target_identifier' => $seo->getTargetIdentifier(),
                    ],
                ],
                ['action' => $isNew ? 'seo.create.success' : 'seo.update.success']
            );

            return $this->sendJson(
                $seo,
                $isNew ? Response::HTTP_CREATED : Response::HTTP_OK,
                context: ['groups' => ['seo.read']]
            );
        } catch (Throwable $e) {
            $this->generateLog(
                LoggerLevelEnum::Error,
                [
                    'message'   => 'Erreur lors de la sauvegarde des métadonnées SEO',
                    'data'      => ['target_type' => $dto->targetType, 'target_identifier' => $dto->targetIdentifier],
                    'exception' => $e->getMessage(),
                ],
                ['action' => 'seo.save.error']
            );

            return $this->sendJson(
                ['message' => 'Erreur interne lors de l\'enregistrement des métadonnées SEO.'],
                Response::HTTP_INTERNAL_SERVER_ERROR
            );
        }
    }

    public function delete(string $id): object
    {
        $seo = Uuid::isValid($id) ? $this->seoRepository->find(Uuid::fromString($id)) : null;
        if (!$seo instanceof SeoMetadata) {
            return $this->notFoundResponse('Métadonnées SEO introuvables.');
        }

        if (!$this->security->isGranted(CmsSettingVoter::MANAGE_SEO, $seo)) {
            return $this->sendForbidden('Vous n\'avez pas les droits pour supprimer ces métadonnées SEO.');
        }

        $this->em->remove($seo);
        $this->em->flush();

        return $this->sendNoContent();
    }

    /**
     * @return array{meta: array<string, mixed>, jsonLd: array<string, mixed>}
     */
    public function buildForArticle(
        ArticleSeoInterface $article,
        string $path,
        ?SeoTargetType $targetType = null,
        SchemaType $schemaType = SchemaType::TECH_ARTICLE
    ): array {
        $seo = null;
        if ($article instanceof Post && $article->getId() !== null) {
            $resolvedType = $targetType ?? $this->resolveTargetType('post');
            if ($resolvedType !== null) {
                $seo = $this->seoRepository->findByTarget($resolvedType, (string) $article->getId());
            }
        }

        return [
            'meta'   => $this->seoSchemaGenerator->generateForArticle($article, $path, $seo),
            'jsonLd' => $this->jsonLdGenerator->generateArticleSchema($article, $path, $seo, $schemaType),
        ];
    }

    /**
     * @return array{meta: array<string, mixed>, jsonLd: array<string, mixed>}
     */
    public function buildForTaxonomy(
        TaxonomySeoInterface $taxonomy,
        string $path,
        string $prefixLabel = 'Catégorie',
        ?SeoTargetType $targetType = null
    ): array {
        $seo = null;
        if (($taxonomy instanceof Category || $taxonomy instanceof Tag) && $taxonomy->getId() !== null) {
            $typeHint = $taxonomy instanceof Category ? 'category' : 'tag';
            $resolvedType = $targetType ?? $this->resolveTargetType($typeHint);
            if ($resolvedType !== null) {
                $seo = $this->seoRepository->findByTarget($resolvedType, (string) $taxonomy->getId());
            }
        }

        return [
            'meta'   => $this->seoSchemaGenerator->generateForTaxonomy($taxonomy, $path, $seo),
            'jsonLd' => $this->jsonLdGenerator->generateTaxonomySchema($taxonomy, $path, $prefixLabel, $seo),
        ];
    }

    /**
     * @return array{meta: array<string, mixed>, jsonLd: array<string, mixed>}
     */
    public function buildForStaticPage(
        string $pageKey,
        string $defaultTitle,
        string $defaultDescription,
        string $path,
        SchemaType $pageType = SchemaType::WEB_PAGE,
        ?SeoTargetType $targetType = null
    ): array {
        $resolvedType = $targetType ?? $this->resolveTargetType('page');
        $seo = $resolvedType !== null
            ? $this->seoRepository->findByTarget($resolvedType, $pageKey)
            : null;

        return [
            'meta'   => $this->seoSchemaGenerator->generateForStaticPage($defaultTitle, $defaultDescription, $path, $seo),
            'jsonLd' => $this->jsonLdGenerator->generateStaticPageSchema($path, $pageType, $seo, $defaultTitle),
        ];
    }

    private function hydrateSeoMetadata(SeoMetadata $seo, SaveSeoMetadataDto $dto): void
    {
        $seo
            ->setTargetType($dto->targetType)
            ->setTargetIdentifier(trim($dto->targetIdentifier))
            ->setMetaTitle($this->nullIfEmpty($dto->metaTitle))
            ->setMetaDescription($this->nullIfEmpty($dto->metaDescription))
            ->setCanonicalUrl($this->nullIfEmpty($dto->canonicalUrl))
            ->setRobots($dto->robots)
            ->setOgTitle($this->nullIfEmpty($dto->ogTitle))
            ->setOgDescription($this->nullIfEmpty($dto->ogDescription))
            ->setOgImage($this->nullIfEmpty($dto->ogImage))
            ->setGeoRegion($this->nullIfEmpty($dto->geoRegion))
            ->setGeoPlacename($this->nullIfEmpty($dto->geoPlacename))
            ->setGeoPosition($this->nullIfEmpty($dto->geoPosition))
            ->setJsonLdSchema($dto->jsonLdSchema);

        if ($dto->settings !== null) {
            $seo->setSettings($dto->settings);
        }
    }

    private function nullIfEmpty(?string $value): ?string
    {
        if ($value === null) {
            return null;
        }
        $trimmed = trim($value);

        return $trimmed !== '' ? $trimmed : null;
    }

    private function resolveTargetType(string $needle): ?SeoTargetType
    {
        $direct = SeoTargetType::tryFrom($needle);
        if ($direct !== null) {
            return $direct;
        }

        foreach (SeoTargetType::cases() as $case) {
            if (stripos($case->name, $needle) !== false || stripos($case->value, $needle) !== false) {
                return $case;
            }
        }

        return null;
    }
}