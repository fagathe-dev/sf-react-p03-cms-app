<?php

namespace Fagathe\CmsCore\Repository;

use Fagathe\CmsCore\Entity\Tag;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\ORM\Exception\ORMException;
use Doctrine\Persistence\ManagerRegistry;
use Fagathe\CmsCore\Entity\User;
use Fagathe\CmsCore\Enum\ColorEnum;
use Fagathe\CmsCore\Trait\FullTextSearchTrait;
use Fagathe\CorePhp\Trait\DatetimeTrait;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Uid\Uuid;

/**
 * @extends ServiceEntityRepository<Tag>
 */
class TagRepository extends ServiceEntityRepository
{
    use DatetimeTrait, FullTextSearchTrait;

    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Tag::class);
    }

    /**
     * Recherche Full-Text sur les tags.
     *
     * @return Tag[]
     */
    public function searchFullText(string $query, int $limit = 15): array
    {
        $booleanQuery = $this->formatBooleanSearchQuery($query);
        if ($booleanQuery === '') {
            return [];
        }

        return $this->createQueryBuilder('t')
            ->addSelect('MATCH(t.name, t.description) AGAINST (:searchQuery BOOLEAN) AS HIDDEN score')
            ->andWhere('MATCH(t.name, t.description) AGAINST (:searchQuery BOOLEAN) > 0')
            ->setParameter('searchQuery', $booleanQuery)
            ->orderBy('score', 'DESC')
            ->addOrderBy('t.name', 'ASC')
            ->setMaxResults($limit)
            ->getQuery()
            ->getResult();
    }

    /**
     * Vérifie si un utilisateur possède déjà un tag avec cette couleur.
     */
    public function colorExistsForUser(User $owner, ColorEnum|string $color, ?Uuid $excludeId = null): bool
    {
        if (is_string($color)) {
            $color = ColorEnum::tryFrom($color);
            if ($color === null) {
                return false;
            }
        }

        $qb = $this->createQueryBuilder('t')
            ->select('COUNT(t.id)')
            ->andWhere('t.owner = :ownerId')
            ->andWhere('t.color = :color')
            ->setParameter('ownerId', $owner->getId(), UuidType::NAME)
            ->setParameter('color', $color);

        if ($excludeId !== null) {
            $qb->andWhere('t.id != :excludeId')
                ->setParameter('excludeId', $excludeId, UuidType::NAME);
        }

        return (int) $qb->getQuery()->getSingleScalarResult() > 0;
    }

    /**
     * Supprime un tag et le détache de ses articles.
     */
    public function remove(Tag $tag, bool $flush = true): bool
    {
        try {
            foreach ($tag->getPosts() as $post) {
                $post->removeTag($tag);
            }

            $this->getEntityManager()->remove($tag);

            if ($flush) {
                $this->getEntityManager()->flush();
            }

            return true;
        } catch (ORMException) {
            return false;
        }
    }

    public function save(Tag $tag, bool $flush = true, bool $isCreation = false): bool
    {
        $now = $this->now();

        if ($isCreation) {
            $tag->setCreatedAt($now);
        } else {
            $tag->setUpdatedAt($now);
        }

        try {
            $this->getEntityManager()->persist($tag);

            if ($flush) {
                $this->getEntityManager()->flush();
            }

            return true;
        } catch (ORMException) {
            return false;
        }
    }

    //    /**
    //     * @return Tag[] Returns an array of Tag objects
    //     */
    //    public function findByExampleField($value): array
    //    {
    //        return $this->createQueryBuilder('t')
    //            ->andWhere('t.exampleField = :val')
    //            ->setParameter('val', $value)
    //            ->orderBy('t.id', 'ASC')
    //            ->setMaxResults(10)
    //            ->getQuery()
    //            ->getResult()
    //        ;
    //    }

    //    public function findOneBySomeField($value): ?Tag
    //    {
    //        return $this->createQueryBuilder('t')
    //            ->andWhere('t.exampleField = :val')
    //            ->setParameter('val', $value)
    //            ->getQuery()
    //            ->getOneOrNullResult()
    //        ;
    //    }
}
