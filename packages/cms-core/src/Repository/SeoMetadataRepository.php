<?php

declare(strict_types=1);

namespace Fagathe\CmsCore\Repository;

use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\ORM\Exception\ORMException;
use Doctrine\Persistence\ManagerRegistry;
use Fagathe\CmsCore\Entity\SeoMetadata;
use Fagathe\CmsCore\Enum\Seo\SeoTargetType;
use Fagathe\CorePhp\Trait\DatetimeTrait;

/**
 * @extends ServiceEntityRepository<SeoMetadata>
 */
class SeoMetadataRepository extends ServiceEntityRepository
{
    use DatetimeTrait;

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

    public function remove(SeoMetadata $seoMetadata, bool $flush = true): bool
    {
        try {
            $this->getEntityManager()->remove($seoMetadata);

            if ($flush) {
                $this->getEntityManager()->flush();
            }

            return true;
        } catch (ORMException) {
            return false;
        }
    }

    public function save(SeoMetadata $seoMetadata, bool $flush = true, bool $isCreation = false): bool
    {
        $now = $this->now();

        if ($isCreation && $seoMetadata->getCreatedAt() === null) {
            $seoMetadata->setCreatedAt($now);
        }

        if (!$isCreation) {
            $seoMetadata->setUpdatedAt($now);
        }

        try {
            $this->getEntityManager()->persist($seoMetadata);

            if ($flush) {
                $this->getEntityManager()->flush();
            }

            return true;
        } catch (ORMException) {
            return false;
        }
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
