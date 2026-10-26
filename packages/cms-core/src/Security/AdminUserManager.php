<?php

declare(strict_types=1);

namespace Fagathe\CmsCore\Security;

use Fagathe\CmsCore\Dto\Mail\AdminAccountCreatedMailDto;
use Fagathe\CmsCore\Entity\User;
use Fagathe\CmsCore\Enum\Auth\UserRequestTypeEnum;
use Fagathe\CmsCore\Enum\Auth\UserRole;
use Fagathe\CmsCore\Generator\AuthLinkGenerator;
use Fagathe\CmsCore\Mailer\MailDispatcher;
use Fagathe\CmsCore\Repository\UserRepository;
use Fagathe\CmsCore\Service\UserRequestService;
use Fagathe\CorePhp\Command\AdminUserManagerInterface;
use Fagathe\CorePhp\Enum\LoggerLevelEnum;
use Fagathe\CorePhp\Trait\DatetimeTrait;
use Fagathe\CorePhp\Trait\LoggerTrait;
use Symfony\Component\DependencyInjection\Attribute\AsAlias;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Validator\Validator\ValidatorInterface;
use Throwable;

/**
 * Création des administrateurs du CMS pour la commande core-php:create-admin-user.
 *
 * L'administrateur est créé vérifié, puis reçoit un e-mail récapitulatif avec un lien (72h)
 * pour choisir son propre mot de passe avant sa première connexion (page /reset-password de cms_bo).
 *
 * L'alias est nécessaire : l'interface vit dans core-php, hors du dossier chargé par CmsCoreBundle,
 * donc Symfony ne la relie pas automatiquement à cette implémentation.
 */
#[AsAlias(AdminUserManagerInterface::class)]
final class AdminUserManager implements AdminUserManagerInterface
{
    use DatetimeTrait, LoggerTrait;

    /** Validité du lien de changement de mot de passe envoyé à l'administrateur */
    public const PASSWORD_LINK_TTL_HOURS = 72;

    public function __construct(
        private readonly UserRepository $userRepository,
        private readonly UserPasswordHasherInterface $hasher,
        private readonly ValidatorInterface $validator,
        private readonly UserRequestService $userRequestService,
        private readonly MailDispatcher $mailDispatcher,
        private readonly AuthLinkGenerator $linkGenerator,
    ) {}

    public function getAdminRoles(): array
    {
        return [
            'super_admin' => UserRole::ROLE_SUPER_ADMIN->value,
            'admin'       => UserRole::ROLE_ADMIN->value,
        ];
    }

    public function usernameExists(string $username): bool
    {
        return $this->userRepository->findOneBy(['username' => $username]) !== null;
    }

    public function emailExists(string $email): bool
    {
        return $this->userRepository->findOneBy(['email' => $email]) !== null;
    }

    public function createAdmin(string $username, string $email, string $plainPassword, string $role): void
    {
        $userRole = UserRole::from($role);

        $user = (new User())
            ->setUsername($username)
            ->setEmail($email)
            ->setPassword($plainPassword)
            ->setRole($userRole)
            ->setIsVerified(true)
            ->setEmailVerifiedAt($this->now());

        // Mêmes contraintes que l'inscription (complexité du mot de passe en clair, unicité…)
        $violations = $this->validator->validate($user);
        if (count($violations) > 0) {
            $messages = [];
            foreach ($violations as $violation) {
                $messages[] = $violation->getPropertyPath() . ' : ' . $violation->getMessage();
            }

            throw new \InvalidArgumentException(implode(' ', $messages));
        }

        $user->setPassword($this->hasher->hashPassword($user, $plainPassword));

        if (!$this->userRepository->save($user, flush: true, isCreation: true)) {
            throw new \RuntimeException('L\'administrateur n\'a pas pu être enregistré en base de données.');
        }

        $this->sendAccountCreatedEmail($user, $plainPassword, $userRole);
    }

    /**
     * Récapitulatif + lien de changement de mot de passe. Un échec d'envoi ne remet pas en cause
     * la création (le compte existe) : il est journalisé et l'administrateur peut utiliser « Mot de passe oublié ».
     */
    private function sendAccountCreatedEmail(User $user, string $plainPassword, UserRole $role): void
    {
        $passwordRequest = $this->userRequestService->createRequest(
            user: $user,
            type: UserRequestTypeEnum::PasswordReset,
            ttlMinutes: self::PASSWORD_LINK_TTL_HOURS * 60,
            isOtp: false
        );

        if ($passwordRequest?->getToken() === null) {
            $this->generateLog(
                LoggerLevelEnum::Error,
                ['message' => 'Lien de changement de mot de passe non généré : e-mail administrateur non envoyé', 'data' => ['user_id' => (string) $user->getId()]],
                ['action' => 'admin.account_created.link_error']
            );

            return;
        }

        try {
            $this->mailDispatcher->dispatch(new AdminAccountCreatedMailDto(
                recipientEmail: (string) $user->getEmail(),
                recipientName: (string) $user->getUsername(),
                username: (string) $user->getUsername(),
                plainPassword: $plainPassword,
                roleLabel: UserRole::mapRole($role),
                loginUrl: $this->linkGenerator->loginUrl(),
                changePasswordUrl: $this->linkGenerator->resetPasswordUrl($passwordRequest->getToken()),
                createdAt: $this->now(),
                ttlHours: self::PASSWORD_LINK_TTL_HOURS,
                createdBy: 'command',
            ));
        } catch (Throwable $e) {
            $this->generateLog(
                LoggerLevelEnum::Error,
                [
                    'message'   => 'Administrateur créé mais e-mail récapitulatif non envoyé',
                    'data'      => ['user_id' => (string) $user->getId()],
                    'exception' => $e,
                ],
                ['action' => 'admin.account_created.mail_error']
            );
        }
    }
}
