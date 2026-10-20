<?php

namespace Fagathe\CmsCore\Enum\Auth;

enum UserRole: string
{
    case ROLE_USER = 'ROLE_USER';
    case ROLE_SUPER_ADMIN = 'ROLE_SUPER_ADMIN';
    case ROLE_MODERATOR = 'ROLE_MODERATOR';
    case ROLE_CONTRIBUTOR = 'ROLE_ONTRIBUTOR';
    case ROLE_ADMIN = 'ROLE_ADMIN';
    case ROLE_MANAGER = 'ROLE_MANAGER';

    /**
     * @param null|string|UserRole|null $role
     * 
     * @return string
     */
    public static function getRole(null|string|UserRole $role = null): string
    {
        if (is_string($role)) {
            $role = UserRole::tryFrom($role);
        }
        if ($role instanceof UserRole === false || $role === null) {
            return 'Tous les rôles';
        }

        return static::mapRole($role);
    }

    /**
     * @param UserRole $role
     * 
     * @return string
     */
    public static function mapRole(UserRole $role): string
    {
        return match ($role) {
            static::ROLE_USER => 'Utilisateur',
            static::ROLE_CONTRIBUTOR => 'Contributeur',
            static::ROLE_MODERATOR => 'Modérateur',
            static::ROLE_MANAGER => 'Gestionnaire',
            static::ROLE_ADMIN => 'Administrateur',
            static::ROLE_SUPER_ADMIN => 'Administrateur technique',
        };
    }

    /**
     * @return array
     */
    public static function choices(): array
    {
        return [
            'Utilisateur' => static::ROLE_USER->value,
            'Contributeur' => static::ROLE_CONTRIBUTOR->value,
            'Modérateur' => static::ROLE_MODERATOR->value,
            'Gestionnaire' => static::ROLE_MANAGER->value,
            'Administrateur' => static::ROLE_ADMIN->value,
            'Administrateur technique' => static::ROLE_SUPER_ADMIN->value,
        ];
    }

    /**
     * @return array
     */
    public static function values(): array
    {
        return array_map(fn($e) => $e->value, self::cases());
    }
}
