<?php

declare(strict_types=1);

namespace Fagathe\CmsCore\Repository;

use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\ORM\Exception\ORMException;
use Doctrine\Persistence\ManagerRegistry;
use Fagathe\CmsCore\Entity\CmsSetting;
use Fagathe\CorePhp\Trait\DatetimeTrait;

/**
 * @extends ServiceEntityRepository<CmsSetting>
 */
class CmsSettingRepository extends ServiceEntityRepository
{
    use DatetimeTrait;

    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, CmsSetting::class);
    }

    public function findByKey(string $key): ?CmsSetting
    {
        return $this->findOneBy(['settingKey' => trim($key)]);
    }

    public function remove(CmsSetting $cmsSetting, bool $flush = true): bool
    {
        try {
            $this->getEntityManager()->remove($cmsSetting);

            if ($flush) {
                $this->getEntityManager()->flush();
            }

            return true;
        } catch (ORMException) {
            return false;
        }
    }

    public function save(CmsSetting $cmsSetting, bool $flush = true, bool $isCreation = false): bool
    {
        $now = $this->now();

        if ($isCreation && $cmsSetting->getCreatedAt() === null) {
            $cmsSetting->setCreatedAt($now);
        }

        if (!$isCreation) {
            $cmsSetting->setUpdatedAt($now);
        }

        try {
            $this->getEntityManager()->persist($cmsSetting);

            if ($flush) {
                $this->getEntityManager()->flush();
            }

            return true;
        } catch (ORMException) {
            return false;
        }
    }

    //    /**
    //     * @return CmsSetting[] Returns an array of CmsSetting objects
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

    //    public function findOneBySomeField($value): ?CmsSetting
    //    {
    //        return $this->createQueryBuilder('c')
    //            ->andWhere('c.exampleField = :val')
    //            ->setParameter('val', $value)
    //            ->getQuery()
    //            ->getOneOrNullResult()
    //        ;
    //    }
}
