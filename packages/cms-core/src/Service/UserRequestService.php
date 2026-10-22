<?php

declare(strict_types=1);

namespace Fagathe\CmsCore\Service;

use Doctrine\ORM\EntityManagerInterface;
use Fagathe\CmsCore\Entity\User;
use Fagathe\CmsCore\Entity\UserRequest;
use Fagathe\CmsCore\Enum\Auth\UserRequestTypeEnum;
use Fagathe\CmsCore\Repository\UserRequestRepository;
use Fagathe\CorePhp\Enum\LoggerLevelEnum;
use Fagathe\CorePhp\Trait\DatetimeTrait;
use Fagathe\CorePhp\Trait\LoggerTrait;
use Symfony\Bundle\SecurityBundle\Security;
use Throwable;

final class UserRequestService
{
    use DatetimeTrait, LoggerTrait;

    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly UserRequestRepository $repository,
        private readonly Security $security,
    ) {}

    /**
     * @param array<string, mixed>|null $payload
     */
    public function createRequest(
        User $user,
        UserRequestTypeEnum $type,
        int $ttlMinutes = 15,
        bool $isOtp = true,
        ?array $payload = null
    ): ?UserRequest {
        $now = $this->now();
        $expiresAt = $this->modifyDateTime(sprintf('+%d minutes', $ttlMinutes), $now);

        $this->invalidateActiveRequests($user, $type);

        $request = new UserRequest();
        $request
            ->setUser($user)
            ->setType($type)
            ->setCreatedAt($now)
            ->setExpiresAt($expiresAt)
            ->setPayload($payload);

        if ($isOtp) {
            $request->setCode((string) random_int(100000, 999999));
        } else {
            $request->setToken(bin2hex(random_bytes(32)));
        }

        try {
            $this->em->persist($request);
            $this->em->flush();

            $this->generateLog(
                LoggerLevelEnum::Info,
                [
                    'message' => 'Demande utilisateur créée avec succès',
                    'data'    => [
                        'user_id'    => (string) $user->getId(),
                        'type'       => $type->value,
                        'is_otp'     => $isOtp,
                        'expires_at' => $this->formatDateTime('Y-m-d H:i:s', $expiresAt),
                    ],
                ],
                ['action' => 'user_request.create.success']
            );

            return $request;
        } catch (Throwable $e) {
            $this->generateLog(
                LoggerLevelEnum::Critical,
                [
                    'message'   => 'Échec lors de la création de la UserRequest',
                    'data'      => ['user_id' => (string) $user->getId()],
                    'exception' => $e->getMessage(),
                ],
                ['action' => 'user_request.create.error']
            );

            return null;
        }
    }

    public function findValidRequest(string $identifier, UserRequestTypeEnum $type): ?UserRequest
    {
        /** @var UserRequest|null $userRequest */
        $userRequest = $this->repository->findOneBy([
            'code'   => $identifier,
            'type'   => $type,
            'isUsed' => false,
        ]) ?? $this->repository->findOneBy([
            'token'  => $identifier,
            'type'   => $type,
            'isUsed' => false,
        ]);

        if (!$userRequest) {
            return null;
        }

        if ($this->isPastDate($userRequest->getExpiresAt())) {
            $this->consume($userRequest);

            return null;
        }

        return $userRequest;
    }

    public function consume(UserRequest $request): void
    {
        $request->setIsUsed(true);
        $request->setUpdatedAt($this->now());
        $this->em->flush();
    }

    private function invalidateActiveRequests(User $user, UserRequestTypeEnum $type): void
    {
        $activeRequests = $this->repository->findBy([
            'user'   => $user,
            'type'   => $type,
            'isUsed' => false,
        ]);

        $now = $this->now();
        foreach ($activeRequests as $req) {
            $req->setIsUsed(true);
            $req->setUpdatedAt($now);
        }
    }
}
