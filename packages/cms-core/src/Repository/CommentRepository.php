<?php

declare(strict_types=1);

namespace Fagathe\CmsCore\Repository;

use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\ORM\Exception\ORMException;
use Doctrine\Persistence\ManagerRegistry;
use Fagathe\CmsCore\Entity\Comment;
use Fagathe\CmsCore\Entity\Post;
use Fagathe\CmsCore\Enum\CommentStatus;
use Fagathe\CorePhp\Trait\DatetimeTrait;
use Symfony\Bridge\Doctrine\Types\UuidType;

/**
 * @extends ServiceEntityRepository<Comment>
 */
class CommentRepository extends ServiceEntityRepository
{
    use DatetimeTrait;

    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Comment::class);
    }

    /**
     * Récupère les commentaires racines (sans parent) d'un article, avec leurs réponses.
     *
     * @return Comment[]
     */
    public function findRootCommentsByPost(Post $post, bool $onlyApproved = true): array
    {
        $qb = $this->createQueryBuilder('c')
            ->leftJoin('c.owner', 'o')->addSelect('o')
            ->leftJoin('c.replies', 'r')->addSelect('r')
            ->andWhere('c.post = :postId')
            ->andWhere('c.parent IS NULL')
            ->setParameter('postId', $post->getId(), UuidType::NAME)
            ->orderBy('c.createdAt', 'DESC');

        if ($onlyApproved) {
            $qb->andWhere('c.status = :status')
                ->setParameter('status', CommentStatus::APPROVED);
        }

        return $qb->getQuery()->getResult();
    }

    /**
     * Récupère les commentaires signalés (flags >= minFlags) pour la file de modération.
     *
     * @return Comment[]
     */
    public function findFlaggedComments(int $minFlags = 1, int $limit = 50): array
    {
        return $this->createQueryBuilder('c')
            ->leftJoin('c.owner', 'o')->addSelect('o')
            ->leftJoin('c.post', 'p')->addSelect('p')
            ->andWhere('c.flags >= :minFlags')
            ->setParameter('minFlags', max(1, $minFlags))
            ->orderBy('c.flags', 'DESC')
            ->addOrderBy('c.createdAt', 'DESC')
            ->setMaxResults($limit)
            ->getQuery()
            ->getResult();
    }

    public function remove(Comment $comment, bool $flush = true): bool
    {
        try {
            $this->getEntityManager()->remove($comment);

            if ($flush) {
                $this->getEntityManager()->flush();
            }

            return true;
        } catch (ORMException) {
            return false;
        }
    }

    public function save(Comment $comment, bool $flush = true, bool $isCreation = false): bool
    {
        $now = $this->now();

        if ($isCreation && $comment->getCreatedAt() === null) {
            $comment->setCreatedAt($now);
        }

        if (!$isCreation) {
            $comment->setUpdatedAt($now);
        }

        try {
            $this->getEntityManager()->persist($comment);

            if ($flush) {
                $this->getEntityManager()->flush();
            }

            return true;
        } catch (ORMException) {
            return false;
        }
    }

    //    /**
    //     * @return Comment[] Returns an array of Comment objects
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

    //    public function findOneBySomeField($value): ?Comment
    //    {
    //        return $this->createQueryBuilder('c')
    //            ->andWhere('c.exampleField = :val')
    //            ->setParameter('val', $value)
    //            ->getQuery()
    //            ->getOneOrNullResult()
    //        ;
    //    }
}
