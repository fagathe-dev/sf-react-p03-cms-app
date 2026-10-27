<?php

declare(strict_types=1);

namespace Fagathe\CmsCore\Dashboard\Section;

use Fagathe\CmsCore\Dashboard\DashboardSectionProviderInterface;
use Fagathe\CmsCore\Entity\User;
use Fagathe\CmsCore\Repository\CommentRepository;
use Symfony\Component\Security\Core\Authorization\AuthorizationCheckerInterface;

/**
 * Modération rapide : commentaires en attente ou signalés (ROLE_MODERATOR).
 */
final class ModerationQueueSection implements DashboardSectionProviderInterface
{
    private const LIMIT = 5;

    public function __construct(
        private readonly CommentRepository $commentRepository,
        private readonly AuthorizationCheckerInterface $authorizationChecker,
    ) {}

    public function supports(User $user): bool
    {
        return $this->authorizationChecker->isGranted('ROLE_MODERATOR');
    }

    public function provide(User $user): array
    {
        return [
            'moderationQueue' => $this->commentRepository->findRecentModerationQueue(self::LIMIT),
        ];
    }

    public function getSerializationGroups(): array
    {
        return ['comment.read'];
    }
}
