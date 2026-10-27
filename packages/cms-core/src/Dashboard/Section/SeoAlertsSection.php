<?php

declare(strict_types=1);

namespace Fagathe\CmsCore\Dashboard\Section;

use Fagathe\CmsCore\Dashboard\DashboardSectionProviderInterface;
use Fagathe\CmsCore\Entity\User;
use Fagathe\CmsCore\Repository\PostRepository;
use Fagathe\CmsCore\Repository\SeoMetadataRepository;
use Symfony\Component\Security\Core\Authorization\AuthorizationCheckerInterface;

/**
 * Santé & couverture SEO des articles publiés (ROLE_MANAGER).
 */
final class SeoAlertsSection implements DashboardSectionProviderInterface
{
    public function __construct(
        private readonly PostRepository $postRepository,
        private readonly SeoMetadataRepository $seoMetadataRepository,
        private readonly AuthorizationCheckerInterface $authorizationChecker,
    ) {}

    public function supports(User $user): bool
    {
        return $this->authorizationChecker->isGranted('ROLE_MANAGER');
    }

    public function provide(User $user): array
    {
        return [
            'seoAlerts' => [
                ...$this->postRepository->getSeoQualityAlertsCount(),
                'publishedWithoutSeoMeta' => $this->seoMetadataRepository->countPublishedPostsWithoutSeoMeta(),
            ],
        ];
    }

    public function getSerializationGroups(): array
    {
        return [];
    }
}
