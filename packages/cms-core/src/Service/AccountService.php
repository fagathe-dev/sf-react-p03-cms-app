<?php

declare(strict_types=1);

namespace Fagathe\CmsCore\Service;

use Doctrine\ORM\EntityManagerInterface;
use Fagathe\CmsCore\Dto\Account\ChangeEmailDto;
use Fagathe\CmsCore\Dto\Account\ChangePasswordDto;
use Fagathe\CmsCore\Dto\Account\DeleteAccountDto;
use Fagathe\CmsCore\Dto\Account\UpdateAccountDto;
use Fagathe\CmsCore\Dto\Account\UploadAvatarDto;
use Fagathe\CmsCore\Dto\Mail\AccountDeletionCodeMailDto;
use Fagathe\CmsCore\Entity\User;
use Fagathe\CmsCore\Enum\Auth\UserRequestTypeEnum;
use Fagathe\CmsCore\Mailer\MailDispatcher;
use Fagathe\CmsCore\Repository\UserRepository;
use Fagathe\CorePhp\Enum\LoggerLevelEnum;
use Fagathe\CorePhp\File\FileTrait;
use Fagathe\CorePhp\Http\RequestTrait;
use Fagathe\CorePhp\Http\ResponseTrait;
use Fagathe\CorePhp\Mailer\Exception\MailerExceptionInterface;
use Fagathe\CorePhp\Trait\DatetimeTrait;
use Fagathe\CorePhp\Trait\LoggerTrait;
use Fagathe\CorePhp\Uploader\FileUploadException;
use Fagathe\CorePhp\Uploader\UploaderService;
use Psr\Cache\CacheItemPoolInterface;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Serializer\SerializerInterface;
use Symfony\Component\Validator\Validator\ValidatorInterface;
use Throwable;

final class AccountService
{
    use ResponseTrait, DatetimeTrait, LoggerTrait, RequestTrait, FileTrait;

    /** Suppression de compte : validité du code, essais autorisés, délai entre deux envois */
    public const DELETION_CODE_TTL_MINUTES = 10;
    public const DELETION_CODE_MAX_ATTEMPTS = 5;
    public const DELETION_CODE_RESEND_DELAY_SECONDS = 30;

    public function __construct(
        private readonly Security $security,
        private readonly UserRepository $userRepository,
        private readonly ValidatorInterface $validator,
        private readonly SerializerInterface $serializer,
        private readonly UserPasswordHasherInterface $hasher,
        private readonly UploaderService $uploader,
        private readonly FilePathResolver $fileResolver,
        private readonly UserRequestService $userRequestService,
        private readonly MailDispatcher $mailDispatcher,
        private readonly CacheItemPoolInterface $cache,
    ) {}

    public function getProfile(): object
    {
        $user = $this->getAuthenticatedUser();
        if (!$user) {
            return $this->sendJson(['message' => 'Utilisateur non authentifié.'], Response::HTTP_UNAUTHORIZED);
        }

        return $this->sendJson($user, Response::HTTP_OK, context: ['groups' => ['user.read']]);
    }

    public function updateProfile(Request $request): object
    {
        $user = $this->getAuthenticatedUser();
        if (!$user) {
            return $this->sendJson(['message' => 'Utilisateur non authentifié.'], Response::HTTP_UNAUTHORIZED);
        }

        try {
            /** @var UpdateAccountDto $dto */
            $dto = $this->serializer->deserialize($request->getContent(), UpdateAccountDto::class, 'json');
        } catch (Throwable) {
            return $this->sendJson(['message' => 'Format de données JSON invalide.'], Response::HTTP_BAD_REQUEST);
        }

        $violations = $this->validator->validate($dto);
        if (count($violations) > 0) {
            return $this->sendViolations($violations);
        }

        $cleanUsername = trim($dto->username);
        if ($cleanUsername !== $user->getUsername()) {
            $existing = $this->userRepository->findOneBy(['username' => $cleanUsername]);
            if ($existing && (string) $existing->getId() !== (string) $user->getId()) {
                return $this->sendViolations(['username' => 'Ce nom d\'utilisateur est déjà utilisé.']);
            }
            $user->setUsername($cleanUsername);
        }

        $user->setFirstname($dto->firstname !== null && trim($dto->firstname) !== '' ? trim($dto->firstname) : null);
        $user->setLastname($dto->lastname !== null && trim($dto->lastname) !== '' ? trim($dto->lastname) : null);
        $user->setUpdatedAt($this->now());

        try {
            $this->userRepository->save($user, flush: true, isCreation: false);

            return $this->sendJson($user, Response::HTTP_OK, context: ['groups' => ['user.read']]);
        } catch (Throwable $e) {
            $this->generateLog(
                LoggerLevelEnum::Critical,
                [
                    'message'   => 'Erreur critique lors de la mise à jour du profil',
                    'data'      => ['user_id' => (string) $user->getId()],
                    'exception' => $e->getMessage(),
                ],
                ['action' => 'account.update.critical_error']
            );

            return $this->sendJson(
                ['message' => 'Erreur interne lors de la mise à jour du profil.'],
                Response::HTTP_INTERNAL_SERVER_ERROR
            );
        }
    }

    public function changeEmail(Request $request): object
    {
        $user = $this->getAuthenticatedUser();
        if (!$user) {
            return $this->sendJson(['message' => 'Utilisateur non authentifié.'], Response::HTTP_UNAUTHORIZED);
        }

        try {
            /** @var ChangeEmailDto $dto */
            $dto = $this->serializer->deserialize($request->getContent(), ChangeEmailDto::class, 'json');
        } catch (Throwable) {
            return $this->sendJson(['message' => 'Format de données JSON invalide.'], Response::HTTP_BAD_REQUEST);
        }

        $violations = $this->validator->validate($dto);
        if (count($violations) > 0) {
            return $this->sendViolations($violations);
        }

        $cleanEmail = strtolower(trim($dto->email));
        if ($cleanEmail !== strtolower((string) $user->getEmail())) {
            $existing = $this->userRepository->findOneBy(['email' => $cleanEmail]);
            if ($existing && (string) $existing->getId() !== (string) $user->getId()) {
                return $this->sendViolations(['email' => 'Cette adresse e-mail est déjà utilisée.']);
            }

            $user->setEmail($cleanEmail);
            $user->setUpdatedAt($this->now());
            $this->userRepository->save($user, flush: true, isCreation: false);
        }

        return $this->sendJson($user, Response::HTTP_OK, context: ['groups' => ['user.read']]);
    }

    public function changePassword(Request $request): object
    {
        $user = $this->getAuthenticatedUser();
        if (!$user) {
            return $this->sendJson(['message' => 'Utilisateur non authentifié.'], Response::HTTP_UNAUTHORIZED);
        }

        try {
            /** @var ChangePasswordDto $dto */
            $dto = $this->serializer->deserialize($request->getContent(), ChangePasswordDto::class, 'json');
        } catch (Throwable) {
            return $this->sendJson(['message' => 'Format de données JSON invalide.'], Response::HTTP_BAD_REQUEST);
        }

        $violations = $this->validator->validate($dto);
        if (count($violations) > 0) {
            return $this->sendViolations($violations);
        }

        if (!$this->hasher->isPasswordValid($user, $dto->currentPassword)) {
            return $this->sendJson(
                ['message' => 'Le mot de passe actuel est incorrect.'],
                Response::HTTP_UNPROCESSABLE_ENTITY
            );
        }

        $user->setPassword($this->hasher->hashPassword($user, $dto->newPassword));
        $user->setUpdatedAt($this->now());
        $this->userRepository->save($user, flush: true, isCreation: false);

        return $this->sendJson(['message' => 'Mot de passe modifié avec succès.']);
    }

    public function updateAvatar(Request $request): object
    {
        $user = $this->getAuthenticatedUser();
        if (!$user) {
            return $this->sendJson(['message' => 'Utilisateur non authentifié.'], Response::HTTP_UNAUTHORIZED);
        }

        $uploadedFile = $request->files->get('avatar') ?? $request->files->get('file');
        $dto = new UploadAvatarDto($uploadedFile);

        $violations = $this->validator->validate($dto);
        if (count($violations) > 0) {
            return $this->sendViolations($violations);
        }

        try {
            $subDir = self::avatarDirectory($user);

            // Ancien avatar supprimé par l'uploader une fois le nouveau déplacé (ignoré s'il est externe, ex. pravatar)
            $uploadResult = $this->uploader
                ->setUploadDirectory($subDir)
                ->upload($dto->file, $this->fileResolver->extractUploadedPath($user->getAvatar(), $subDir));

            // Chemin relatif en BDD, l'URL absolue est résolue à la sérialisation (FileUrlNormalizer)
            $user->setAvatar($uploadResult->relativePath);
            $user->setUpdatedAt($this->now());

            $this->userRepository->save($user, flush: true, isCreation: false);

            return $this->sendJson($user, Response::HTTP_OK, context: ['groups' => ['user.read']]);
        } catch (FileUploadException $e) {
            return $this->sendJson(['message' => $e->getMessage()], Response::HTTP_UNPROCESSABLE_ENTITY);
        } catch (Throwable $e) {
            $this->generateLog(
                LoggerLevelEnum::Critical,
                [
                    'message'   => 'Erreur critique lors de l\'upload de l\'avatar',
                    'data'      => ['user_id' => (string) $user->getId()],
                    'exception' => $e->getMessage(),
                ],
                ['action' => 'account.avatar.update.error']
            );

            return $this->sendJson(
                ['message' => 'Erreur interne lors de la mise à jour de l\'avatar.'],
                Response::HTTP_INTERNAL_SERVER_ERROR
            );
        }
    }

    /**
     * POST /api/account/delete-request : envoie un code (OTP 10 min) confirmant la suppression du compte.
     * Un nouvel envoi n'est possible qu'après 30 secondes.
     */
    public function requestAccountDeletion(): object
    {
        $user = $this->getAuthenticatedUser();
        if (!$user) {
            return $this->sendJson(['message' => 'Utilisateur non authentifié.'], Response::HTTP_UNAUTHORIZED);
        }

        $sentItem = $this->cache->getItem('cms_account_deletion_code_sent_' . $user->getId());
        if ($sentItem->isHit()) {
            return $this->sendJson(
                ['message' => sprintf('Un code vient déjà de vous être envoyé. Patientez %d secondes avant d\'en demander un nouveau.', self::DELETION_CODE_RESEND_DELAY_SECONDS)],
                Response::HTTP_TOO_MANY_REQUESTS
            );
        }

        $deletionRequest = $this->userRequestService->createRequest(
            user: $user,
            type: UserRequestTypeEnum::AccountDeletion,
            ttlMinutes: self::DELETION_CODE_TTL_MINUTES,
            isOtp: true
        );

        if ($deletionRequest?->getCode() === null) {
            return $this->sendJson(
                ['message' => 'Erreur lors de la génération du code de confirmation.'],
                Response::HTTP_INTERNAL_SERVER_ERROR
            );
        }

        try {
            $this->mailDispatcher->dispatch(new AccountDeletionCodeMailDto(
                recipientEmail: (string) $user->getEmail(),
                recipientName: $this->resolveRecipientName($user),
                code: $deletionRequest->getCode(),
                ttlMinutes: self::DELETION_CODE_TTL_MINUTES,
            ));
        } catch (MailerExceptionInterface) {
            // Déjà journalisé par AbstractMailerHandler
            $this->userRequestService->revokeActiveRequests($user, UserRequestTypeEnum::AccountDeletion);

            return $this->sendJson(
                ['message' => 'Impossible d\'envoyer le code de confirmation pour le moment.'],
                Response::HTTP_BAD_GATEWAY
            );
        }

        $this->cache->save($sentItem->set(true)->expiresAfter(self::DELETION_CODE_RESEND_DELAY_SECONDS));
        $this->cache->deleteItem('cms_account_deletion_attempts_' . $user->getId());

        $this->generateLog(
            LoggerLevelEnum::Info,
            ['message' => 'Code de suppression de compte envoyé', 'data' => ['user_id' => (string) $user->getId()]],
            ['action' => 'account.delete.code_sent']
        );

        return $this->sendJson([
            'message'         => sprintf('Un code de confirmation valable %d minutes a été envoyé à l\'adresse %s.', self::DELETION_CODE_TTL_MINUTES, $user->getEmail()),
            'expiresIn'       => self::DELETION_CODE_TTL_MINUTES * 60,
            'resendAvailable' => self::DELETION_CODE_RESEND_DELAY_SECONDS,
        ]);
    }

    /**
     * DELETE /api/account : vérifie le code reçu par e-mail puis supprime le compte et son avatar.
     * Au-delà de 5 essais erronés, le code est révoqué (un nouveau doit être demandé).
     */
    public function deleteAccount(Request $request): object
    {
        $user = $this->getAuthenticatedUser();
        if (!$user) {
            return $this->sendJson(['message' => 'Utilisateur non authentifié.'], Response::HTTP_UNAUTHORIZED);
        }

        try {
            /** @var DeleteAccountDto $dto */
            $dto = $this->serializer->deserialize($request->getContent() ?: '{}', DeleteAccountDto::class, 'json');
        } catch (Throwable) {
            return $this->sendJson(['message' => 'Format de données JSON invalide.'], Response::HTTP_BAD_REQUEST);
        }

        $violations = $this->validator->validate($dto);
        if (count($violations) > 0) {
            return $this->sendViolations($violations);
        }

        $deletionRequest = $this->userRequestService->findValidRequestForUser($user, trim($dto->code), UserRequestTypeEnum::AccountDeletion);

        if (!$deletionRequest) {
            $attemptsItem = $this->cache->getItem('cms_account_deletion_attempts_' . $user->getId());
            $attempts = (int) $attemptsItem->get() + 1;
            $this->cache->save($attemptsItem->set($attempts)->expiresAfter(self::DELETION_CODE_TTL_MINUTES * 60));

            if ($attempts >= self::DELETION_CODE_MAX_ATTEMPTS) {
                $this->userRequestService->revokeActiveRequests($user, UserRequestTypeEnum::AccountDeletion);
                $this->generateLog(
                    LoggerLevelEnum::Warning,
                    ['message' => 'Code de suppression de compte révoqué après trop de tentatives', 'data' => ['user_id' => (string) $user->getId()]],
                    ['action' => 'account.delete.code_revoked']
                );

                return $this->sendJson(
                    ['message' => 'Trop de tentatives. Demandez un nouveau code de confirmation.'],
                    Response::HTTP_TOO_MANY_REQUESTS
                );
            }

            return $this->sendJson(['message' => 'Code de confirmation invalide ou expiré.'], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $this->userRequestService->consume($deletionRequest);
        $this->cache->deleteItem('cms_account_deletion_attempts_' . $user->getId());

        return $this->performAccountDeletion($user);
    }

    /**
     * Suppression du compte (et de son avatar sur le disque) une fois le code vérifié.
     */
    private function performAccountDeletion(User $user): object
    {
        try {
            $avatarPath = $this->fileResolver->extractUploadedPath($user->getAvatar(), self::avatarDirectory($user));
            if ($avatarPath) {
                $this->uploader->delete($avatarPath);
            }

            $userId = (string) $user->getId();
            $this->userRepository->remove($user, true);

            $this->generateLog(
                LoggerLevelEnum::Info,
                ['message' => 'Compte supprimé après confirmation par code', 'data' => ['user_id' => $userId]],
                ['action' => 'account.delete.success']
            );

            return $this->sendNoContent();
        } catch (Throwable $e) {
            $this->generateLog(
                LoggerLevelEnum::Critical,
                [
                    'message'   => 'Erreur critique lors de la suppression du compte',
                    'data'      => ['user_id' => (string) $user->getId()],
                    'exception' => $e,
                ],
                ['action' => 'account.delete.critical_error']
            );

            return $this->sendJson(
                ['message' => 'Erreur interne lors de la suppression du compte.'],
                Response::HTTP_INTERNAL_SERVER_ERROR
            );
        }
    }

    private function getAuthenticatedUser(): ?User
    {
        $user = $this->security->getUser();

        return $user instanceof User ? $user : null;
    }

    private function resolveRecipientName(User $user): string
    {
        $fullName = trim(sprintf('%s %s', (string) $user->getFirstname(), (string) $user->getLastname()));

        return $fullName !== '' ? $fullName : (string) ($user->getUsername() ?? 'Utilisateur');
    }

    private static function avatarDirectory(User $user): string
    {
        return 'avatars/' . (string) $user->getId();
    }
}
