<?php

declare(strict_types=1);

namespace Fagathe\CmsCore\Repository\Dashboard;

use Fagathe\CmsCore\Entity\User;
use Fagathe\CmsCore\Enum\Auth\UserRole;

/**
 * Agrégations du tableau de bord sur les utilisateurs (utilisé par UserRepository).
 */
trait UserDashboardQueriesTrait
{
    /**
     * Nombre d'utilisateurs par rôle (tous les UserRole, même à 0).
     *
     * @return array<string, int>
     */
    public function countByRole(): array
    {
        $rows = $this->createQueryBuilder('u')
            ->select('u.role AS role', 'COUNT(u.id) AS usersCount')
            ->groupBy('u.role')
            ->getQuery()
            ->getArrayResult();

        $counts = array_fill_keys(array_map(static fn(UserRole $role): string => $role->value, UserRole::cases()), 0);
        foreach ($rows as $row) {
            $role = $row['role'] instanceof UserRole ? $row['role']->value : (string) $row['role'];
            $counts[$role] = (int) $row['usersCount'];
        }

        return $counts;
    }

    /**
     * @return User[]
     */
    public function findRecentUsers(int $limit = 5): array
    {
        return $this->createQueryBuilder('u')
            ->orderBy('u.createdAt', 'DESC')
            ->setMaxResults($limit)
            ->getQuery()
            ->getResult();
    }
}
