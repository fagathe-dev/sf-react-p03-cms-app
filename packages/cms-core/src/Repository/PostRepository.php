<?php

namespace Fagathe\CmsCore\Repository;

use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Fagathe\CmsCore\Entity\Post;
use Fagathe\CmsCore\Enum\Post\BlockType;
use Fagathe\CmsCore\Enum\Post\PostStatus;
use Fagathe\CmsCore\Trait\FullTextSearchTrait;

/**
 * @extends ServiceEntityRepository<Post>
 */
class PostRepository extends ServiceEntityRepository
{
    use FullTextSearchTrait;

    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Post::class);
    }

    /**
     * Recherche Full-Text sur les articles (titre, extrait), leurs blocs de texte (BlockType::TEXT),
     * ainsi que leur catégorie, leurs tags et leur auteur.
     *
     * @return Post[]
     */
    public function searchFullText(
        string $query,
        int $limit = 20,
        bool $onlyPublished = true
    ): array {
        $booleanQuery = $this->formatBooleanSearchQuery($query);
        if ($booleanQuery === '') {
            return [];
        }

        $qb = $this->createQueryBuilder('p')
            ->addSelect(
                '(
                    (MATCH(p.title, p.excerpt) AGAINST (:searchQuery BOOLEAN) * 2)
                    + COALESCE(MAX(MATCH(b.searchText) AGAINST (:searchQuery BOOLEAN)), 0)
                ) AS HIDDEN score'
            )
            // Jointure filtrée exclusivement sur les blocs de type TEXT
            ->leftJoin('p.blocks', 'b', 'WITH', 'b.type = :textBlockType')
            ->leftJoin('p.category', 'c')->addSelect('c')
            ->leftJoin('p.author', 'a')->addSelect('a')
            ->leftJoin('p.tags', 't')
            ->andWhere(
                'MATCH(p.title, p.excerpt) AGAINST (:searchQuery BOOLEAN) > 0
                 OR MATCH(b.searchText) AGAINST (:searchQuery BOOLEAN) > 0
                 OR MATCH(c.name, c.description) AGAINST (:searchQuery BOOLEAN) > 0
                 OR MATCH(t.name, t.description) AGAINST (:searchQuery BOOLEAN) > 0
                 OR MATCH(a.username, a.firstname, a.lastname) AGAINST (:searchQuery BOOLEAN) > 0'
            )
            ->setParameter('searchQuery', $booleanQuery)
            ->setParameter('textBlockType', BlockType::TEXT)
            ->groupBy('p.id')
            ->addGroupBy('c.id')
            ->addGroupBy('a.id')
            ->orderBy('score', 'DESC')
            ->addOrderBy('p.publishedAt', 'DESC')
            ->setMaxResults($limit);

        if ($onlyPublished) {
            $qb->andWhere('p.status = :status')
                ->setParameter('status', PostStatus::PUBLISHED);
        }

        return $qb->getQuery()->getResult();
    }
}
