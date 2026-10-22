<?php

namespace Fagathe\CmsCore\Repository;

use Fagathe\CmsCore\Entity\Category;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Fagathe\CmsCore\Trait\FullTextSearchTrait;

/**
 * @extends ServiceEntityRepository<Category>
 */
class CategoryRepository extends ServiceEntityRepository
{
    use FullTextSearchTrait;

    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Category::class);
    }

    /**
     * @return Category[]
     */
    public function searchFullText(string $query, int $limit = 10): array
    {
        $booleanQuery = $this->formatBooleanSearchQuery($query);
        if ($booleanQuery === '') {
            return [];
        }

        return $this->createQueryBuilder('c')
            ->addSelect('MATCH(c.name, c.description) AGAINST (:searchQuery BOOLEAN) AS HIDDEN score')
            ->andWhere('MATCH(c.name, c.description) AGAINST (:searchQuery BOOLEAN) > 0')
            ->setParameter('searchQuery', $booleanQuery)
            ->orderBy('score', 'DESC')
            ->addOrderBy('c.name', 'ASC')
            ->setMaxResults($limit)
            ->getQuery()
            ->getResult();
    }

    //    /**
    //     * @return Category[] Returns an array of Category objects
    //     */
    //    public function findByExampleField($value): array
    //    {
    //        return $this->createQueryBuilder('c')
    //            ->andWhere('c.exampleField = :val')
    //            ->setParameter('val', $value)
    //            ->orderBy('c.id', 'ASC')
    //            ->setMaxResults(10)
    //            ->getQuery()
    //            ->getResult()
    //        ;
    //    }

    //    public function findOneBySomeField($value): ?Category
    //    {
    //        return $this->createQueryBuilder('c')
    //            ->andWhere('c.exampleField = :val')
    //            ->setParameter('val', $value)
    //            ->getQuery()
    //            ->getOneOrNullResult()
    //        ;
    //    }
}
