<?php

declare(strict_types=1);

namespace Fagathe\CmsCore\Repository;

use Fagathe\CmsCore\Repository\Dashboard\UserDashboardQueriesTrait;
use Fagathe\CmsCore\Entity\User;
use Fagathe\CmsCore\Enum\Auth\UserRole;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\ORM\Exception\ORMException;
use Doctrine\Persistence\ManagerRegistry;
use Fagathe\CmsCore\Trait\FullTextSearchTrait;
use Fagathe\CorePhp\Trait\DatetimeTrait;
use Symfony\Component\Security\Core\Exception\UnsupportedUserException;
use Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface;
use Symfony\Component\Security\Core\User\PasswordUpgraderInterface;
use Symfony\Bridge\Doctrine\Security\User\UserLoaderInterface;
use Symfony\Component\Security\Core\User\UserInterface;

/**
 * @extends ServiceEntityRepository<User>
 */
class UserRepository extends ServiceEntityRepository implements PasswordUpgraderInterface, UserLoaderInterface
{
    use DatetimeTrait, FullTextSearchTrait, UserDashboardQueriesTrait;

    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, User::class);
    }

    /**
     * Recherche Full-Text d'utilisateurs (username, prénom, nom).
     *
     * @return User[]
     */
    public function searchFullText(string $query, int $limit = 10, bool $onlyVerified = true): array
    {
        $booleanQuery = $this->formatBooleanSearchQuery($query);
        if ($booleanQuery === '') {
            return [];
        }

        $qb = $this->createQueryBuilder('u')
            ->addSelect('MATCH(u.username, u.firstname, u.lastname) AGAINST (:searchQuery BOOLEAN) AS HIDDEN score')
            ->andWhere('MATCH(u.username, u.firstname, u.lastname) AGAINST (:searchQuery BOOLEAN) > 0')
            ->setParameter('searchQuery', $booleanQuery)
            ->orderBy('score', 'DESC')
            ->addOrderBy('u.username', 'ASC')
            ->setMaxResults($limit);

        if ($onlyVerified) {
            $qb->andWhere('u.isVerified = :verified')
                ->setParameter('verified', true);
        }

        return $qb->getQuery()->getResult();
    }

    /**
     * Used to upgrade (rehash) the user's password automatically over time.
     */
    public function upgradePassword(PasswordAuthenticatedUserInterface $user, string $newHashedPassword): void
    {
        if (!$user instanceof User) {
            throw new UnsupportedUserException(sprintf('Instances of "%s" are not supported.', $user::class));
        }

        $user->setPassword($newHashedPassword);
        $this->getEntityManager()->persist($user);
        $this->getEntityManager()->flush();
    }

    /**
     * Appelé par le provider Doctrine (sans "property") : à la connexion comme au rechargement
     * de l'utilisateur depuis le JWT, l'identifiant peut être un e-mail ou un username.
     */
    public function loadUserByIdentifier(string $identifier): ?UserInterface
    {
        return $this->findByEmailOrUsername($identifier);
    }

    /**
     * Trouve un utilisateur par email ou nom d'utilisateur
     */
    public function findByEmailOrUsername(string $identifier): ?User
    {
        return $this->createQueryBuilder('u')
            ->andWhere('u.email = :identifier OR u.username = :identifier')
            ->setParameter('identifier', $identifier)
            ->getQuery()
            ->getOneOrNullResult();
    }

    /**
     * Supprime un utilisateur
     * @param User $user L'entité à supprimer
     * @param bool $flush Faut-il exécuter la requête tout de suite ?
     * @return bool Succès de l'opération
     */
    public function remove(User $user, bool $flush = true): bool
    {
        try {
            $this->getEntityManager()->remove($user);

            if ($flush) {
                $this->getEntityManager()->flush();
            }

            return true;
        } catch (ORMException $ormException) {
            return false;
        }
    }
    public function save(User $user, bool $flush = true, bool $isCreation = false): bool
    {
        $now = $this->now();

        if ($isCreation && $user->getCreatedAt() === null) {
            $user->setCreatedAt($now);
        }

        if (!$isCreation) {
            $user->setUpdatedAt($now);
        }

        try {
            $this->getEntityManager()->persist($user);

            if ($flush) {
                $this->getEntityManager()->flush();
            }

            return true;
        } catch (ORMException) {
            return false;
        }
    }
    //    /**
    //     * @return User[] Returns an array of User objects
    //     */
    //    public function findByExampleField($value): array
    //    {
    //        return $this->createQueryBuilder('u')
    //            ->andWhere('u.exampleField = :val')
    //            ->setParameter('val', $value)
    //            ->orderBy('u.id', 'ASC')
    //            ->setMaxResults(10)
    //            ->getQuery()
    //            ->getResult()
    //        ;
    //    }

    //    public function findOneBySomeField($value): ?User
    //    {
    //        return $this->createQueryBuilder('u')
    //            ->andWhere('u.exampleField = :val')
    //            ->setParameter('val', $value)
    //            ->getQuery()
    //            ->getOneOrNullResult()
    //        ;
    //    }
}
