<?php

declare(strict_types=1);

namespace Fagathe\CmsCore\Service;

use Doctrine\ORM\EntityManagerInterface;
use Fagathe\CmsCore\Dto\User\CreateUserDto;
use Fagathe\CmsCore\Dto\User\UpdateUserDto;
use Fagathe\CmsCore\Entity\User;
use Fagathe\CmsCore\Enum\Auth\UserRole;
use Fagathe\CmsCore\Repository\UserRepository;
use Fagathe\CmsCore\Security\Voter\UserVoter;
use Fagathe\CorePhp\Enum\LoggerLevelEnum;
use Fagathe\CorePhp\Http\RequestTrait;
use Fagathe\CorePhp\Http\ResponseTrait;
use Fagathe\CorePhp\Trait\DatetimeTrait;
use Fagathe\CorePhp\Trait\LoggerTrait;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Serializer\SerializerInterface;
use Symfony\Component\Uid\Uuid;
use Symfony\Component\Validator\Validator\ValidatorInterface;
use Throwable;

final class UserService
{
    use ResponseTrait, DatetimeTrait, LoggerTrait, RequestTrait;

    public function __construct(
        private readonly UserRepository $userRepository,
        private readonly EntityManagerInterface $em,
        private readonly SerializerInterface $serializer,
        private readonly ValidatorInterface $validator,
        private readonly UserPasswordHasherInterface $hasher,
        private readonly Security $security,
    ) {}

    public function list(Request $request): object
    {
        if (!$this->security->isGranted(UserVoter::LIST)) {
            return $this->sendForbidden('Vous n\'avez pas accès à la gestion des utilisateurs.');
        }

        $allowedRoles = $this->getManageableRoles();
        $roleFilter = $request->query->get('role');
        $limit = max(1, min(100, (int) $request->query->get('limit', 50)));
        $page = max(1, (int) $request->query->get('page', 1));
        $offset = ($page - 1) * $limit;

        $qb = $this->userRepository->createQueryBuilder('u')
            ->andWhere('u.role IN (:allowedRoles)')
            ->setParameter('allowedRoles', $allowedRoles)
            ->orderBy('u.createdAt', 'DESC')
            ->setFirstResult($offset)
            ->setMaxResults($limit);

        if (is_string($roleFilter) && UserRole::tryFrom($roleFilter) !== null) {
            $requestedRole = UserRole::from($roleFilter);
            if (!in_array($requestedRole, $allowedRoles, true)) {
                return $this->sendForbidden('Vous n\'êtes pas autorisé à consulter ce rôle.');
            }
            $qb->andWhere('u.role = :roleFilter')
                ->setParameter('roleFilter', $requestedRole);
        }

        $users = $qb->getQuery()->getResult();

        return $this->sendJson($users, Response::HTTP_OK, context: ['groups' => ['user.read']]);
    }

    public function show(string $id): object
    {
        $targetUser = $this->findUserById($id);
        if (!$targetUser instanceof User) {
            return $this->notFoundResponse('Utilisateur introuvable.');
        }

        if (!$this->security->isGranted(UserVoter::VIEW, $targetUser)) {
            return $this->sendForbidden('Vous n\'avez pas les droits pour consulter cet utilisateur.');
        }

        return $this->sendJson($targetUser, Response::HTTP_OK, context: ['groups' => ['user.read']]);
    }

    public function create(Request $request): object
    {
        if (!$this->security->isGranted(UserVoter::CREATE)) {
            return $this->sendForbidden('Vous n\'avez pas les droits pour créer un utilisateur.');
        }

        try {
            /** @var CreateUserDto $dto */
            $dto = $this->serializer->deserialize($request->getContent(), CreateUserDto::class, 'json');
        } catch (Throwable) {
            return $this->sendJson(['message' => 'Format de données JSON invalide.'], Response::HTTP_BAD_REQUEST);
        }

        $violations = $this->validator->validate($dto);
        if (count($violations) > 0) {
            return $this->sendViolations($violations);
        }

        $now = $this->now();
        $targetRole = UserRole::from($dto->role);

        $user = (new User())
            ->setEmail(strtolower(trim($dto->email)))
            ->setUsername(trim($dto->username))
            ->setRole($targetRole)
            ->setFirstname($this->nullIfEmpty($dto->firstname))
            ->setLastname($this->nullIfEmpty($dto->lastname))
            ->setIsVerified($dto->isVerified)
            ->setEmailVerifiedAt($dto->isVerified ? $now : null)
            ->setCreatedAt($now);

        if ($dto->settings !== null) {
            $user->setSettings($dto->settings);
        }

        // Vérifie que l'opérateur a le droit d'attribuer ce rôle précis (via UserVoter)
        if (!$this->security->isGranted(UserVoter::CREATE, $user)) {
            return $this->sendForbidden('Vous n\'êtes pas autorisé à créer un utilisateur avec ce rôle.');
        }

        $user->setPassword($this->hasher->hashPassword($user, $dto->password));

        $entityViolations = $this->validator->validate($user);
        if (count($entityViolations) > 0) {
            return $this->sendViolations($entityViolations);
        }

        if (!$this->userRepository->save($user, flush: true, isCreation: true)) {
            return $this->sendJson(
                ['message' => 'Erreur interne lors de la création de l\'utilisateur.'],
                Response::HTTP_INTERNAL_SERVER_ERROR
            );
        }

        $this->generateLog(
            LoggerLevelEnum::Info,
            [
                'message' => 'Utilisateur créé depuis l\'administration',
                'data'    => [
                    'target_user_id' => (string) $user->getId(),
                    'role'           => $user->getRole()->value,
                ],
            ],
            ['action' => 'admin.user.create']
        );

        return $this->sendJson($user, Response::HTTP_CREATED, context: ['groups' => ['user.read']]);
    }

    public function update(string $id, Request $request): object
    {
        $targetUser = $this->findUserById($id);
        if (!$targetUser instanceof User) {
            return $this->notFoundResponse('Utilisateur introuvable.');
        }

        if (!$this->security->isGranted(UserVoter::EDIT, $targetUser)) {
            return $this->sendForbidden('Vous n\'avez pas les droits pour modifier cet utilisateur.');
        }

        try {
            /** @var UpdateUserDto $dto */
            $dto = $this->serializer->deserialize($request->getContent(), UpdateUserDto::class, 'json');
        } catch (Throwable) {
            return $this->sendJson(['message' => 'Format de données JSON invalide.'], Response::HTTP_BAD_REQUEST);
        }

        $violations = $this->validator->validate($dto);
        if (count($violations) > 0) {
            return $this->sendViolations($violations);
        }

        $newRole = UserRole::from($dto->role);
        if (!in_array($newRole, $this->getManageableRoles(), true)) {
            return $this->sendForbidden('Vous n\'êtes pas autorisé à attribuer ce rôle.');
        }

        $targetUser
            ->setEmail(strtolower(trim($dto->email)))
            ->setUsername(trim($dto->username))
            ->setRole($newRole)
            ->setFirstname($this->nullIfEmpty($dto->firstname))
            ->setLastname($this->nullIfEmpty($dto->lastname));

        if ($dto->password !== null && trim($dto->password) !== '') {
            $targetUser->setPassword($this->hasher->hashPassword($targetUser, $dto->password));
        }

        if ($dto->isVerified !== null) {
            $targetUser->setIsVerified($dto->isVerified);
            if ($dto->isVerified && $targetUser->getEmailVerifiedAt() === null) {
                $targetUser->setEmailVerifiedAt($this->now());
            }
        }

        if ($dto->settings !== null) {
            $targetUser->setSettings($dto->settings);
        }

        $entityViolations = $this->validator->validate($targetUser);
        if (count($entityViolations) > 0) {
            return $this->sendViolations($entityViolations);
        }

        if (!$this->userRepository->save($targetUser, flush: true, isCreation: false)) {
            return $this->sendJson(
                ['message' => 'Erreur interne lors de la mise à jour de l\'utilisateur.'],
                Response::HTTP_INTERNAL_SERVER_ERROR
            );
        }

        $this->generateLog(
            LoggerLevelEnum::Info,
            [
                'message' => 'Utilisateur mis à jour depuis l\'administration',
                'data'    => [
                    'target_user_id' => (string) $targetUser->getId(),
                    'role'           => $targetUser->getRole()->value,
                ],
            ],
            ['action' => 'admin.user.update']
        );

        return $this->sendJson($targetUser, Response::HTTP_OK, context: ['groups' => ['user.read']]);
    }

    public function delete(string $id): object
    {
        $targetUser = $this->findUserById($id);
        if (!$targetUser instanceof User) {
            return $this->notFoundResponse('Utilisateur introuvable.');
        }

        if (!$this->security->isGranted(UserVoter::DELETE, $targetUser)) {
            return $this->sendForbidden('Vous n\'avez pas les droits pour supprimer cet utilisateur.');
        }

        if (!$this->userRepository->remove($targetUser, flush: true)) {
            return $this->sendJson(
                ['message' => 'Erreur interne lors de la suppression de l\'utilisateur.'],
                Response::HTTP_INTERNAL_SERVER_ERROR
            );
        }

        $this->generateLog(
            LoggerLevelEnum::Info,
            [
                'message' => 'Utilisateur supprimé depuis l\'administration',
                'data'    => ['target_user_id' => $id, 'username' => $targetUser->getUsername()],
            ],
            ['action' => 'admin.user.delete']
        );

        return $this->sendNoContent();
    }

    /**
     * Retourne la liste des rôles que l'opérateur connecté a le droit de voir et d'attribuer.
     *
     * @return UserRole[]
     */
    private function getManageableRoles(): array
    {
        if ($this->security->isGranted('ROLE_SUPER_ADMIN')) {
            return UserRole::cases();
        }

        if ($this->security->isGranted('ROLE_ADMIN')) {
            return [
                UserRole::ROLE_CONTRIBUTOR,
                UserRole::ROLE_EDITOR,
                UserRole::ROLE_MODERATOR,
                UserRole::ROLE_MANAGER,
                UserRole::ROLE_ADMIN,
            ];
        }

        if ($this->security->isGranted('ROLE_MANAGER')) {
            return [
                UserRole::ROLE_CONTRIBUTOR,
                UserRole::ROLE_EDITOR,
                UserRole::ROLE_MODERATOR,
                UserRole::ROLE_MANAGER,
            ];
        }

        return [];
    }

    private function findUserById(string $id): ?User
    {
        if (!Uuid::isValid($id)) {
            return null;
        }

        return $this->userRepository->find(Uuid::fromString($id));
    }

    private function nullIfEmpty(?string $value): ?string
    {
        if ($value === null) {
            return null;
        }
        $trimmed = trim($value);

        return $trimmed !== '' ? $trimmed : null;
    }
}