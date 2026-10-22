<?php

declare(strict_types=1);

namespace Fagathe\CmsCore\Repository;

use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Fagathe\CmsCore\Entity\SeoMetadata;
use Fagathe\CmsCore\Enum\Seo\SeoTargetType;

/**
 * @extends ServiceEntityRepository<SeoMetadata>
 */
class SeoMetadataRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, SeoMetadata::class);
    }

    public function findByTarget(SeoTargetType|string $targetType, string $targetIdentifier): ?SeoMetadata
    {
        if (is_string($targetType)) {
            $targetType = SeoTargetType::tryFrom($targetType);
            if ($targetType === null) {
                return null;
            }
        }

        return $this->findOneBy([
            'targetType'       => $targetType,
            'targetIdentifier' => trim($targetIdentifier),
        ]);
    }

    //    /**
    //     * @return SeoMetadata[] Returns an array of SeoMetadata objects
    //     */
    //    public function findByExampleField($value): array
    //    {
    //        return $this->createQueryBuilder('s')
    //            ->andWhere('s.exampleField = :val')
    //            ->setParameter('val', $value)
    //            ->orderBy('s.id', 'ASC')
    //            ->setMaxResults(10)
    //            ->getQuery()
    //            ->getResult()
    //        ;
    //    }

    //    public function findOneBySomeField($value): ?SeoMetadata
    //    {
    //        return $this->createQueryBuilder('s')
    //            ->andWhere('s.exampleField = :val')
    //            ->setParameter('val', $value)
    //            ->getQuery()
    //            ->getOneOrNullResult()
    //        ;
    //    }
}
