<?php

declare(strict_types=1);

namespace Fagathe\CmsCore\Dashboard\Section;

use Fagathe\CmsCore\Dashboard\DashboardSectionProviderInterface;
use Fagathe\CmsCore\Entity\User;
use Fagathe\CmsCore\Repository\UserRepository;
use Symfony\Component\Security\Core\Authorization\AuthorizationCheckerInterface;

/**
 * Équipe : répartition par rôle et derniers inscrits (ROLE_MANAGER).
 */
final class UsersOverviewSection implements DashboardSectionProviderInterface
{
    private const LIMIT = 5;

    public function __construct(
        private readonly UserRepository $userRepository,
        private readonly AuthorizationCheckerInterface $authorizationChecker,
    ) {}

    public function supports(User $user): bool
    {
        return $this->authorizationChecker->isGranted('ROLE_MANAGER');
    }

    public function provide(User $user): array
    {
        return [
            'usersOverview' => [
                'byRole'      => $this->userRepository->countByRole(),
                'recentUsers' => $this->userRepository->findRecentUsers(self::LIMIT),
            ],
        ];
    }

    public function getSerializationGroups(): array
    {
        return ['user.read'];
    }
}
