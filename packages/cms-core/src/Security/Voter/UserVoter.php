<?php

declare(strict_types=1);

namespace Fagathe\CmsCore\Security\Voter;

use Fagathe\CmsCore\Entity\User;
use Fagathe\CmsCore\Enum\Auth\UserRole;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Authorization\Voter\Voter;
use Symfony\Component\Security\Core\Authorization\Voter\Vote;

/**
 * @extends Voter<string, User|null>
 */
final class UserVoter extends Voter
{
    public const LIST = 'USER_LIST';
    public const VIEW = 'USER_VIEW';
    public const CREATE = 'USER_CREATE';
    public const EDIT = 'USER_EDIT';
    public const DELETE = 'USER_DELETE';

    private const ATTRIBUTES = [
        self::LIST,
        self::VIEW,
        self::CREATE,
        self::EDIT,
        self::DELETE,
    ];

    public function __construct(
        private readonly Security $security,
    ) {}

    protected function supports(string $attribute, mixed $subject): bool
    {
        if (!in_array($attribute, self::ATTRIBUTES, true)) {
            return false;
        }

        if (in_array($attribute, [self::LIST, self::CREATE], true)) {
            return $subject === null || $subject instanceof User;
        }

        return $subject instanceof User;
    }

    public function supportsClass(string $class): bool
    {
        return true;
    }

    protected function voteOnAttribute(string $attribute, mixed $subject, TokenInterface $token, ?Vote $vote = null): bool
    {
        $currentUser = $token->getUser();
        if (!$currentUser instanceof User) {
            return false;
        }

        // L'administrateur technique (ROLE_SUPER_ADMIN) a tous les droits sur tous les profils
        if ($this->security->isGranted('ROLE_SUPER_ADMIN')) {
            return true;
        }

        // Seuls ROLE_MANAGER et ROLE_ADMIN ont accès à la gestion des utilisateurs
        if (!$this->security->isGranted('ROLE_MANAGER')) {
            return false;
        }

        if ($attribute === self::LIST || ($attribute === self::CREATE && !$subject instanceof User)) {
            return true;
        }

        /** @var User $targetUser */
        $targetUser = $subject;
        $targetRole = $targetUser->getRole();

        // Règle métier : Ni le Manager ni l'Admin ne gèrent les utilisateurs du blog (ROLE_USER)
        // ni les Administrateurs techniques (ROLE_SUPER_ADMIN)
        if (in_array($targetRole, [UserRole::ROLE_USER, UserRole::ROLE_SUPER_ADMIN], true)) {
            return false;
        }

        // Un utilisateur ne peut pas se supprimer lui-même via le back-office
        if ($attribute === self::DELETE && (string) $targetUser->getId() === (string) $currentUser->getId()) {
            return false;
        }

        // Cas ROLE_ADMIN : peut gérer de ROLE_CONTRIBUTOR jusqu'à ROLE_ADMIN
        if ($this->security->isGranted('ROLE_ADMIN')) {
            return true;
        }

        // Cas ROLE_MANAGER : peut gérer tous les rôles sauf ROLE_ADMIN (et ROLE_SUPER_ADMIN / ROLE_USER déjà filtrés)
        return $targetRole !== UserRole::ROLE_ADMIN;
    }
}
