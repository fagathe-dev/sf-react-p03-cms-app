<?php

declare(strict_types=1);

namespace Fagathe\CmsCore\Repository;

use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\DBAL\Exception\UniqueConstraintViolationException;
use Doctrine\ORM\Exception\ORMException;
use Doctrine\Persistence\ManagerRegistry;
use Fagathe\CmsCore\Entity\Post;
use Fagathe\CmsCore\Entity\PostView;
use Fagathe\CorePhp\Trait\DatetimeTrait;
use Symfony\Bridge\Doctrine\Types\UuidType;

/**
 * @extends ServiceEntityRepository<PostView>
 */
class PostViewRepository extends ServiceEntityRepository
{
    use DatetimeTrait;

    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, PostView::class);
    }

    /**
     * Enregistre la vue uniquement si elle n'existe pas encore pour ce visiteur aujourd'hui.
     * Retourne true si la vue a été comptabilisée, false si c'est un doublon.
     */
    public function registerOrganicView(Post $post, string $visitorHash): bool
    {
        $today = $this->now()->setTime(0, 0, 0);

        $alreadyViewed = (int) $this->createQueryBuilder('pv')
            ->select('COUNT(pv.id)')
            ->andWhere('pv.post = :postId')
            ->andWhere('pv.visitorHash = :hash')
            ->andWhere('pv.viewedDate = :today')
            ->setParameter('postId', $post->getId(), UuidType::NAME)
            ->setParameter('hash', $visitorHash)
            ->setParameter('today', $today)
            ->getQuery()
            ->getSingleScalarResult();

        if ($alreadyViewed > 0) {
            return false;
        }

        $em = $this->getEntityManager();

        try {
            $postView = new PostView($post, $visitorHash);
            if (!$this->save($postView, flush: true, isCreation: true)) {
                return false;
            }

            // Incrémentation atomique en base pour éviter les conflits d'accès concurrents
            $em->createQueryBuilder()
                ->update(Post::class, 'p')
                ->set('p.viewsCount', 'p.viewsCount + 1')
                ->where('p.id = :postId')
                ->setParameter('postId', $post->getId(), UuidType::NAME)
                ->getQuery()
                ->execute();

            // Synchronise l'état de l'entité en mémoire pour la réponse JSON courante
            $post->setViewsCount($post->getViewsCount() + 1);

            return true;
        } catch (UniqueConstraintViolationException) {
            return false;
        }
    }

    public function remove(PostView $postView, bool $flush = true): bool
    {
        try {
            $this->getEntityManager()->remove($postView);

            if ($flush) {
                $this->getEntityManager()->flush();
            }

            return true;
        } catch (ORMException) {
            return false;
        }
    }

    public function save(PostView $postView, bool $flush = true, bool $isCreation = false): bool
    {
        try {
            $this->getEntityManager()->persist($postView);

            if ($flush) {
                $this->getEntityManager()->flush();
            }

            return true;
        } catch (ORMException) {
            return false;
        }
    }

    //    /**
    //     * @return PostView[] Returns an array of PostView objects
    //     */
    //    public function findByExampleField($value): array
    //    {
    //        return $this->createQueryBuilder('p')
    //            ->andWhere('p.exampleField = :val')
    //            ->setParameter('val', $value)
    //            ->orderBy('p.id', 'ASC')
    //            ->setMaxResults(10)
    //            ->getQuery()
    //            ->getResult()
    //        ;
    //    }

    //    public function findOneBySomeField($value): ?PostView
    //    {
    //        return $this->createQueryBuilder('p')
    //            ->andWhere('p.exampleField = :val')
    //            ->setParameter('val', $value)
    //            ->getQuery()
    //            ->getOneOrNullResult()
    //        ;
    //    }
}
