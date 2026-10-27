<?php

declare(strict_types=1);

namespace Fagathe\CmsCore\Repository\Dashboard;

use Fagathe\CmsCore\Entity\Post;
use Fagathe\CmsCore\Enum\ColorEnum;
use Fagathe\CmsCore\Enum\Post\PostStatus;

/**
 * Agrégations du tableau de bord sur les tags (utilisé par TagRepository).
 */
trait TagDashboardQueriesTrait
{
    /**
     * Tags les plus utilisés par les articles publiés, agrégés depuis Post (côté propriétaire du ManyToMany).
     *
     * @return list<array{id: string, name: string, slug: string, color: string|null, postsCount: int}>
     */
    public function findPopularTags(int $limit = 10): array
    {
        // Champs scalaires : une entité jointe ne peut pas être sélectionnée sans l'alias racine (Post)
        $rows = $this->getEntityManager()->createQueryBuilder()
            ->select('t.id AS id', 't.name AS name', 't.slug AS slug', 't.color AS color', 'COUNT(p.id) AS postsCount')
            ->from(Post::class, 'p')
            ->innerJoin('p.tags', 't')
            ->andWhere('p.status = :published')
            ->setParameter('published', PostStatus::PUBLISHED)
            ->groupBy('t.id')
            ->addGroupBy('t.name')
            ->addGroupBy('t.slug')
            ->addGroupBy('t.color')
            ->orderBy('postsCount', 'DESC')
            ->addOrderBy('t.name', 'ASC')
            ->setMaxResults($limit)
            ->getQuery()
            ->getResult();

        return array_map(static fn(array $row): array => [
            'id'         => (string) $row['id'],
            'name'       => (string) $row['name'],
            'slug'       => (string) $row['slug'],
            'color'      => $row['color'] instanceof ColorEnum ? $row['color']->value : ($row['color'] ?: null),
            'postsCount' => (int) $row['postsCount'],
        ], $rows);
    }
}
