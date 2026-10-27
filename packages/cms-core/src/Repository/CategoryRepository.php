<?php

declare(strict_types=1);

namespace Fagathe\CmsCore\Repository;

use Fagathe\CmsCore\Repository\Dashboard\CategoryDashboardQueriesTrait;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\ORM\Exception\ORMException;
use Doctrine\Persistence\ManagerRegistry;
use Fagathe\CmsCore\Entity\Category;
use Fagathe\CmsCore\Trait\FullTextSearchTrait;
use Fagathe\CorePhp\Trait\DatetimeTrait;

/**
 * @extends ServiceEntityRepository<Category>
 */
class CategoryRepository extends ServiceEntityRepository
{
    use DatetimeTrait, FullTextSearchTrait, CategoryDashboardQueriesTrait;

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

    public function remove(Category $category, bool $flush = true): bool
    {
        try {
            foreach ($category->getPosts() as $post) {
                $post->setCategory(null);
            }

            $this->getEntityManager()->remove($category);

            if ($flush) {
                $this->getEntityManager()->flush();
            }

            return true;
        } catch (ORMException) {
            return false;
        }
    }

    public function save(Category $category, bool $flush = true, bool $isCreation = false): bool
    {
        $now = $this->now();

        if ($isCreation && $category->getCreatedAt() === null) {
            $category->setCreatedAt($now);
        }

        if (!$isCreation) {
            $category->setUpdatedAt($now);
        }

        try {
            $this->getEntityManager()->persist($category);

            if ($flush) {
                $this->getEntityManager()->flush();
            }

            return true;
        } catch (ORMException) {
            return false;
        }
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
