<?php

declare(strict_types=1);

namespace Fagathe\CmsCore\Dashboard\Section;

use Fagathe\CmsCore\Dashboard\DashboardSectionProviderInterface;
use Fagathe\CmsCore\Entity\User;
use Fagathe\CmsCore\Repository\PostRepository;
use Symfony\Component\Security\Core\Authorization\AuthorizationCheckerInterface;

/**
 * Activité éditoriale : derniers articles, articles à retravailler, corbeille.
 */
final class EditorialActivitySection implements DashboardSectionProviderInterface
{
    private const LIMIT = 5;

    public function __construct(
        private readonly PostRepository $postRepository,
        private readonly AuthorizationCheckerInterface $authorizationChecker,
    ) {}

    public function supports(User $user): bool
    {
        return true;
    }

    public function provide(User $user): array
    {
        // Modérateur et + : file globale de relecture ; sinon ses propres brouillons et réécritures
        $isModerator = $this->authorizationChecker->isGranted('ROLE_MODERATOR');

        return [
            'recentPosts'    => $this->postRepository->findRecentPosts(self::LIMIT),
            'attentionPosts' => $this->postRepository->findPostsNeedingAttention($user, $isModerator, self::LIMIT),
            'trashedPosts'   => $this->postRepository->findTrashedPosts(self::LIMIT),
        ];
    }

    public function getSerializationGroups(): array
    {
        // dashboard.read : settings (is_featured, moderation_note) des articles listés
        return ['post.list', 'dashboard.read'];
    }
}
