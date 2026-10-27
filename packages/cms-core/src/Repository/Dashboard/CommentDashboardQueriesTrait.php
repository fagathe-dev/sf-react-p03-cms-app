<?php

declare(strict_types=1);

namespace Fagathe\CmsCore\Repository\Dashboard;

use Fagathe\CmsCore\Entity\Comment;
use Fagathe\CmsCore\Enum\CommentStatus;

/**
 * Agrégations du tableau de bord sur les commentaires (utilisé par CommentRepository).
 */
trait CommentDashboardQueriesTrait
{
    /**
     * Un signalement ne compte que sur un commentaire encore approuvé : rejeté ou spam, il est déjà traité.
     *
     * @return array{totalApproved: int, pendingCount: int, flaggedCount: int}
     */
    public function getModerationStats(): array
    {
        $row = $this->createQueryBuilder('c')
            ->select(
                'COALESCE(SUM(CASE WHEN c.status = :approved THEN 1 ELSE 0 END), 0) AS totalApproved',
                'COALESCE(SUM(CASE WHEN c.status = :pending THEN 1 ELSE 0 END), 0) AS pendingCount',
                'COALESCE(SUM(CASE WHEN c.flags > 0 AND c.status = :approved THEN 1 ELSE 0 END), 0) AS flaggedCount'
            )
            ->setParameter('approved', CommentStatus::APPROVED)
            ->setParameter('pending', CommentStatus::PENDING)
            ->getQuery()
            ->getSingleResult();

        return [
            'totalApproved' => (int) $row['totalApproved'],
            'pendingCount'  => (int) $row['pendingCount'],
            'flaggedCount'  => (int) $row['flaggedCount'],
        ];
    }

    /**
     * File de modération : commentaires en attente, ou approuvés mais signalés.
     *
     * @return Comment[]
     */
    public function findRecentModerationQueue(int $limit = 5): array
    {
        return $this->createQueryBuilder('c')
            ->leftJoin('c.owner', 'o')->addSelect('o')
            ->leftJoin('c.post', 'p')->addSelect('p')
            ->andWhere('c.status = :pending OR (c.flags > 0 AND c.status = :approved)')
            ->setParameter('pending', CommentStatus::PENDING)
            ->setParameter('approved', CommentStatus::APPROVED)
            ->orderBy('c.createdAt', 'DESC')
            ->setMaxResults($limit)
            ->getQuery()
            ->getResult();
    }
}
