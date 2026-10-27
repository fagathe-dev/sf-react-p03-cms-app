<?php

declare(strict_types=1);

namespace Fagathe\CmsCore\Dashboard\Section;

use Fagathe\CmsCore\Dashboard\DashboardSectionProviderInterface;
use Fagathe\CmsCore\Entity\User;
use Fagathe\CmsCore\Repository\PostRepository;

/**
 * Palmarès des articles publiés : plus lus, plus aimés.
 */
final class TopPostsSection implements DashboardSectionProviderInterface
{
    private const LIMIT = 5;

    public function __construct(
        private readonly PostRepository $postRepository,
    ) {}

    public function supports(User $user): bool
    {
        return true;
    }

    public function provide(User $user): array
    {
        return [
            'topViewedPosts' => $this->postRepository->findTopPostsByViews(self::LIMIT),
            'topLikedPosts'  => $this->postRepository->findTopPostsByLikes(self::LIMIT),
        ];
    }

    public function getSerializationGroups(): array
    {
        return ['post.list', 'dashboard.read'];
    }
}
