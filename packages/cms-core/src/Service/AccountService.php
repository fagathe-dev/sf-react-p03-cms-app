<?php

declare(strict_types=1);

namespace Fagathe\CmsCore\Service;

use Doctrine\ORM\EntityManagerInterface;
use Fagathe\CmsCore\Dto\Account\ChangeEmailDto;
use Fagathe\CmsCore\Dto\Account\ChangePasswordDto;
use Fagathe\CmsCore\Dto\Account\UpdateAccountDto;
use Fagathe\CmsCore\Dto\Account\UploadAvatarDto;
use Fagathe\CmsCore\Entity\User;
use Fagathe\CmsCore\Repository\UserRepository;
use Fagathe\CorePhp\Enum\LoggerLevelEnum;
use Fagathe\CorePhp\File\FileTrait;
use Fagathe\CorePhp\Http\RequestTrait;
use Fagathe\CorePhp\Http\ResponseTrait;
use Fagathe\CorePhp\Trait\DatetimeTrait;
use Fagathe\CorePhp\Trait\LoggerTrait;
use Fagathe\CorePhp\Uploader\FileUploadException;
use Fagathe\CorePhp\Uploader\UploaderService;
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

    public function __construct(
        private readonly Security $security,
        private readonly UserRepository $userRepository,
        private readonly ValidatorInterface $validator,
        private readonly SerializerInterface $serializer,
        private readonly UserPasswordHasherInterface $hasher,
        private readonly UploaderService $uploader,
        private readonly FilePathResolver $fileResolver,
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

    public function deleteAccount(): object
    {
        $user = $this->getAuthenticatedUser();
        if (!$user) {
            return $this->sendJson(['message' => 'Utilisateur non authentifié.'], Response::HTTP_UNAUTHORIZED);
        }

        try {
            $avatarPath = $this->fileResolver->extractUploadedPath($user->getAvatar(), self::avatarDirectory($user));
            if ($avatarPath) {
                $this->uploader->delete($avatarPath);
            }

            $this->userRepository->remove($user, true);

            return $this->sendNoContent();
        } catch (Throwable $e) {
            $this->generateLog(
                LoggerLevelEnum::Critical,
                [
                    'message'   => 'Erreur critique lors de la suppression du compte',
                    'data'      => ['user_id' => (string) $user->getId()],
                    'exception' => $e->getMessage(),
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

    private static function avatarDirectory(User $user): string
    {
        return 'avatars/' . (string) $user->getId();
    }
}
