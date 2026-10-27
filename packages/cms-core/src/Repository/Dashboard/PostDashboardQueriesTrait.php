<?php

declare(strict_types=1);

namespace Fagathe\CmsCore\Repository\Dashboard;

use Doctrine\ORM\QueryBuilder;
use Fagathe\CmsCore\Entity\Post;
use Fagathe\CmsCore\Entity\User;
use Fagathe\CmsCore\Enum\Post\PostStatus;
use InvalidArgumentException;

/**
 * Agrégations du tableau de bord sur les articles (utilisé par PostRepository).
 */
trait PostDashboardQueriesTrait
{
    /** Champs autorisés pour le palmarès (liste blanche : le nom est injecté dans le DQL) */
    private const TOP_POSTS_SORT_FIELDS = ['viewsCount', 'likesCount'];

    /**
     * Nombre d'articles par statut (toutes les clés de PostStatus, même à 0) et total hors corbeille.
     *
     * @return array<string, int> ['total' => int, 'published' => int, 'draft' => int, …]
     */
    public function countByStatus(): array
    {
        $rows = $this->createQueryBuilder('p')
            ->select('p.status AS status', 'COUNT(p.id) AS postsCount')
            ->groupBy('p.status')
            ->getQuery()
            ->getArrayResult();

        $counts = array_fill_keys(PostStatus::values(), 0);
        foreach ($rows as $row) {
            $status = $row['status'] instanceof PostStatus ? $row['status']->value : (string) $row['status'];
            $counts[$status] = (int) $row['postsCount'];
        }

        $total = array_sum($counts) - $counts[PostStatus::TRASH->value];

        return ['total' => $total, ...$counts];
    }

    /**
     * Lectures et likes cumulés des articles publiés, et nombre d'articles signalés (hors corbeille).
     *
     * @return array{totalViews: int, totalLikes: int, flaggedPostsCount: int}
     */
    public function getAudienceTotals(): array
    {
        $row = $this->createQueryBuilder('p')
            ->select(
                'COALESCE(SUM(CASE WHEN p.status = :published THEN p.viewsCount ELSE 0 END), 0) AS totalViews',
                'COALESCE(SUM(CASE WHEN p.status = :published THEN p.likesCount ELSE 0 END), 0) AS totalLikes',
                'COALESCE(SUM(CASE WHEN p.flags > 0 AND p.status != :trash THEN 1 ELSE 0 END), 0) AS flaggedPostsCount'
            )
            ->setParameter('published', PostStatus::PUBLISHED)
            ->setParameter('trash', PostStatus::TRASH)
            ->getQuery()
            ->getSingleResult();

        return [
            'totalViews'        => (int) $row['totalViews'],
            'totalLikes'        => (int) $row['totalLikes'],
            'flaggedPostsCount' => (int) $row['flaggedPostsCount'],
        ];
    }

    /**
     * Derniers articles hors corbeille, par date de publication (à défaut de création).
     *
     * @return Post[]
     */
    public function findRecentPosts(int $limit = 5): array
    {
        $posts = $this->createDashboardPostQuery()
            ->addSelect('COALESCE(p.publishedAt, p.createdAt) AS HIDDEN sortDate')
            ->andWhere('p.status != :trash')
            ->setParameter('trash', PostStatus::TRASH)
            ->orderBy('sortDate', 'DESC')
            ->setMaxResults($limit)
            ->getQuery()
            ->getResult();

        return $this->preloadTags($posts);
    }

    /**
     * Articles à traiter : file globale review + rewriting pour un modérateur,
     * sinon ses propres brouillons et articles à réécrire.
     *
     * @return Post[]
     */
    public function findPostsNeedingAttention(?User $user, bool $isModerator, int $limit = 5): array
    {
        if (!$isModerator && $user === null) {
            return [];
        }

        $qb = $this->createDashboardPostQuery()
            ->addSelect('COALESCE(p.updatedAt, p.createdAt) AS HIDDEN sortDate')
            ->orderBy('sortDate', 'DESC')
            ->setMaxResults($limit);

        if ($isModerator) {
            $qb->andWhere('p.status IN (:statuses)')
                ->setParameter('statuses', [PostStatus::REVIEW->value, PostStatus::REWRITING->value]);
        } else {
            $qb->andWhere('p.status IN (:statuses)')
                ->andWhere('p.author = :author')
                ->setParameter('statuses', [PostStatus::DRAFT->value, PostStatus::REWRITING->value])
                ->setParameter('author', $user);
        }

        return $this->preloadTags($qb->getQuery()->getResult());
    }

    /**
     * Derniers articles placés dans la corbeille.
     *
     * @return Post[]
     */
    public function findTrashedPosts(int $limit = 5): array
    {
        $posts = $this->createDashboardPostQuery()
            ->andWhere('p.status = :trash')
            ->setParameter('trash', PostStatus::TRASH)
            ->orderBy('p.trashedAt', 'DESC')
            ->setMaxResults($limit)
            ->getQuery()
            ->getResult();

        return $this->preloadTags($posts);
    }

    /**
     * @return Post[]
     */
    public function findTopPostsByViews(int $limit = 5): array
    {
        return $this->findTopPublishedPosts('viewsCount', $limit);
    }

    /**
     * @return Post[]
     */
    public function findTopPostsByLikes(int $limit = 5): array
    {
        return $this->findTopPublishedPosts('likesCount', $limit);
    }

    /**
     * Articles publiés sans miniature ou sans extrait (NULL ou chaîne vide).
     *
     * @return array{publishedWithoutThumbnail: int, publishedWithoutExcerpt: int}
     */
    public function getSeoQualityAlertsCount(): array
    {
        $row = $this->createQueryBuilder('p')
            ->select(
                "COALESCE(SUM(CASE WHEN p.thumbnail IS NULL OR p.thumbnail = '' THEN 1 ELSE 0 END), 0) AS publishedWithoutThumbnail",
                "COALESCE(SUM(CASE WHEN p.excerpt IS NULL OR p.excerpt = '' THEN 1 ELSE 0 END), 0) AS publishedWithoutExcerpt"
            )
            ->andWhere('p.status = :published')
            ->setParameter('published', PostStatus::PUBLISHED)
            ->getQuery()
            ->getSingleResult();

        return [
            'publishedWithoutThumbnail' => (int) $row['publishedWithoutThumbnail'],
            'publishedWithoutExcerpt'   => (int) $row['publishedWithoutExcerpt'],
        ];
    }

    /**
     * Identifiants (RFC 4122, en texte) des articles publiés.
     *
     * @return string[]
     */
    public function findPublishedPostIds(): array
    {
        $rows = $this->createQueryBuilder('p')
            ->select('p.id')
            ->andWhere('p.status = :published')
            ->setParameter('published', PostStatus::PUBLISHED)
            ->getQuery()
            ->getResult();

        return array_map(static fn(array $row): string => (string) $row['id'], $rows);
    }

    /**
     * @return Post[]
     */
    private function findTopPublishedPosts(string $field, int $limit): array
    {
        if (!in_array($field, self::TOP_POSTS_SORT_FIELDS, true)) {
            throw new InvalidArgumentException(sprintf('Tri du palmarès non autorisé : "%s".', $field));
        }

        $posts = $this->createDashboardPostQuery()
            ->andWhere('p.status = :published')
            ->setParameter('published', PostStatus::PUBLISHED)
            ->orderBy('p.' . $field, 'DESC')
            ->addOrderBy('p.publishedAt', 'DESC')
            ->setMaxResults($limit)
            ->getQuery()
            ->getResult();

        return $this->preloadTags($posts);
    }

    /**
     * Articles avec auteur et catégorie chargés (relations sérialisées par post.list).
     */
    private function createDashboardPostQuery(): QueryBuilder
    {
        return $this->createQueryBuilder('p')
            ->leftJoin('p.author', 'a')->addSelect('a')
            ->leftJoin('p.category', 'c')->addSelect('c');
    }

    /**
     * Charge en une requête les tags (ManyToMany, sérialisés par post.list) des articles trouvés.
     * Un fetch-join de collection fausserait setMaxResults : les collections sont initialisées dans l'identity map.
     *
     * @param Post[] $posts
     *
     * @return Post[]
     */
    private function preloadTags(array $posts): array
    {
        if ($posts !== []) {
            $this->createQueryBuilder('p')
                ->leftJoin('p.tags', 't')->addSelect('t')
                ->andWhere('p IN (:posts)')
                ->setParameter('posts', $posts)
                ->getQuery()
                ->getResult();
        }

        return $posts;
    }
}
