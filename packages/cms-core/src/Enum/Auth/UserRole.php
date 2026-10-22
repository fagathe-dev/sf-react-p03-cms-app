<?php

declare(strict_types=1);

namespace Fagathe\CmsCore\Enum\Auth;

enum UserRole: string
{
    case ROLE_USER = 'ROLE_USER';               // hierarchy: 1
    case ROLE_CONTRIBUTOR = 'ROLE_CONTRIBUTOR'; // hierarchy: 150
    case ROLE_EDITOR = 'ROLE_EDITOR';           // hierarchy: 200
    case ROLE_MODERATOR = 'ROLE_MODERATOR';     // hierarchy: 250
    case ROLE_MANAGER = 'ROLE_MANAGER';         // hierarchy: 500
    case ROLE_ADMIN = 'ROLE_ADMIN';             // hierarchy: 750
    case ROLE_SUPER_ADMIN = 'ROLE_SUPER_ADMIN'; // hierarchy: 1000

    /**
     * Poids hiérarchique du rôle (permet de comparer facilement deux rôles).
     */
    public function rank(): int
    {
        return match ($this) {
            self::ROLE_USER => 1,
            self::ROLE_CONTRIBUTOR => 150,
            self::ROLE_EDITOR => 200,
            self::ROLE_MODERATOR => 250,
            self::ROLE_MANAGER => 500,
            self::ROLE_ADMIN => 750,
            self::ROLE_SUPER_ADMIN => 1000,
        };
    }

    public function isAtLeast(self $minimumRole): bool
    {
        return $this->rank() >= $minimumRole->rank();
    }

    public function isStrictlyHigherThan(self $otherRole): bool
    {
        return $this->rank() > $otherRole->rank();
    }

    public static function getRole(null|string|UserRole $role = null): string
    {
        if (is_string($role)) {
            $role = self::tryFrom($role);
        }

        if (!$role instanceof self) {
            return 'Tous les rôles';
        }

        return static::mapRole($role);
    }

    public static function mapRole(UserRole $role): string
    {
        return match ($role) {
            self::ROLE_USER => 'Utilisateur',
            self::ROLE_CONTRIBUTOR => 'Contributeur',
            self::ROLE_EDITOR => 'Éditeur',
            self::ROLE_MODERATOR => 'Modérateur',
            self::ROLE_MANAGER => 'Gestionnaire',
            self::ROLE_ADMIN => 'Administrateur',
            self::ROLE_SUPER_ADMIN => 'Administrateur technique',
        };
    }

    /**
     * @return array<string, string>
     */
    public static function choices(): array
    {
        return [
            'Utilisateur' => self::ROLE_USER->value,
            'Contributeur' => self::ROLE_CONTRIBUTOR->value,
            'Éditeur' => self::ROLE_EDITOR->value,
            'Modérateur' => self::ROLE_MODERATOR->value,
            'Gestionnaire' => self::ROLE_MANAGER->value,
            'Administrateur' => self::ROLE_ADMIN->value,
            'Administrateur technique' => self::ROLE_SUPER_ADMIN->value,
        ];
    }

    /**
     * @return string[]
     */
    public static function values(): array
    {
        return array_map(static fn(self $e): string => $e->value, self::cases());
    }
}
