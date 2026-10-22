<?php

declare(strict_types=1);

namespace Fagathe\CmsCore\Dto\User;

use Fagathe\CmsCore\Enum\Auth\UserRole;
use Symfony\Component\Validator\Constraints as Assert;

final class UpdateUserDto
{
    #[Assert\NotBlank(message: 'L\'adresse e-mail est obligatoire.')]
    #[Assert\Email(message: 'Cette adresse e-mail est invalide.')]
    #[Assert\Length(max: 180)]
    public string $email = '';

    #[Assert\NotBlank(message: 'Le nom d\'utilisateur est obligatoire.')]
    #[Assert\Length(min: 3, max: 90)]
    public string $username = '';

    #[Assert\Regex(
        pattern: '#^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).{8,}$#',
        message: 'Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et 8 caractères minimum.'
    )]
    public ?string $password = null;

    #[Assert\NotBlank(message: 'Le rôle est obligatoire.')]
    #[Assert\Choice(
        callback: [UserRole::class, 'values'],
        message: 'Le rôle "{{ value }}" est invalide.'
    )]
    public string $role = UserRole::ROLE_CONTRIBUTOR->value;

    #[Assert\Length(max: 80)]
    public ?string $firstname = null;

    #[Assert\Length(max: 80)]
    public ?string $lastname = null;

    public ?bool $isVerified = null;

    /**
     * @var array<string, mixed>|null
     */
    #[Assert\Type('array')]
    public ?array $settings = null;
}