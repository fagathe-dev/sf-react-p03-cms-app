<?php

declare(strict_types=1);

namespace Fagathe\CmsCore\Dashboard\Section;

use Fagathe\CmsCore\Dashboard\DashboardSectionProviderInterface;
use Fagathe\CmsCore\Entity\User;
use Fagathe\CmsCore\Repository\CommentRepository;
use Fagathe\CmsCore\Repository\PostRepository;

/**
 * Bandeau « D'un coup d'œil » : articles par statut, audience, commentaires, articles signalés.
 */
final class KpisSection implements DashboardSectionProviderInterface
{
    public function __construct(
        private readonly PostRepository $postRepository,
        private readonly CommentRepository $commentRepository,
    ) {}

    public function supports(User $user): bool
    {
        return true;
    }

    public function provide(User $user): array
    {
        $audience = $this->postRepository->getAudienceTotals();

        return [
            'kpis' => [
                'posts'             => $this->postRepository->countByStatus(),
                'audience'          => [
                    'totalViews' => $audience['totalViews'],
                    'totalLikes' => $audience['totalLikes'],
                ],
                'comments'          => $this->commentRepository->getModerationStats(),
                'flaggedPostsCount' => $audience['flaggedPostsCount'],
            ],
        ];
    }

    public function getSerializationGroups(): array
    {
        return [];
    }
}
