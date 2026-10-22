<?php

namespace Fagathe\CmsCore\Repository;

use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Fagathe\CmsCore\Entity\BlocContent;
use Fagathe\CmsCore\Enum\Post\BlockType;
use Fagathe\CmsCore\Enum\Post\PostStatus;
use Fagathe\CmsCore\Trait\FullTextSearchTrait;

/**
 * @extends ServiceEntityRepository<BlocContent>
 */
class BlocContentRepository extends ServiceEntityRepository
{
    use FullTextSearchTrait;

    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, BlocContent::class);
    }

    /**
     * Recherche Full-Text directement dans les blocs de type BlockType::TEXT.
     *
     * @return BlocContent[]
     */
    public function searchTextBlocks(
        string $query,
        int $limit = 20,
        bool $onlyPublishedPosts = true
    ): array {
        $booleanQuery = $this->formatBooleanSearchQuery($query);
        if ($booleanQuery === '') {
            return [];
        }

        $qb = $this->createQueryBuilder('b')
            ->addSelect('MATCH(b.searchText) AGAINST (:searchQuery BOOLEAN) AS HIDDEN score')
            ->innerJoin('b.post', 'p')->addSelect('p')
            ->andWhere('b.type = :textType')
            ->andWhere('MATCH(b.searchText) AGAINST (:searchQuery BOOLEAN) > 0')
            ->setParameter('textType', BlockType::TEXT)
            ->setParameter('searchQuery', $booleanQuery)
            ->orderBy('score', 'DESC')
            ->addOrderBy('b.position', 'ASC')
            ->setMaxResults($limit);

        if ($onlyPublishedPosts) {
            $qb->andWhere('p.status = :status')
                ->setParameter('status', PostStatus::PUBLISHED);
        }

        return $qb->getQuery()->getResult();
    }

    //    /**
    //     * @return BlocContent[] Returns an array of BlocContent objects
    //     */
    //    public function findByExampleField($value): array
    //    {
    //        return $this->createQueryBuilder('b')
    //            ->andWhere('b.exampleField = :val')
    //            ->setParameter('val', $value)
    //            ->orderBy('b.id', 'ASC')
    //            ->setMaxResults(10)
    //            ->getQuery()
    //            ->getResult()
    //        ;
    //    }

    //    public function findOneBySomeField($value): ?BlocContent
    //    {
    //        return $this->createQueryBuilder('b')
    //            ->andWhere('b.exampleField = :val')
    //            ->setParameter('val', $value)
    //            ->getQuery()
    //            ->getOneOrNullResult()
    //        ;
    //    }
}
