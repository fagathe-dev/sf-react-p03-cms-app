<?php

declare(strict_types=1);

namespace App\EventListener;

use Fagathe\CmsCore\Entity\User;
use Fagathe\CmsCore\Service\FilePathResolver;
use Lexik\Bundle\JWTAuthenticationBundle\Event\AuthenticationSuccessEvent;
use Symfony\Component\EventDispatcher\Attribute\AsEventListener;

#[AsEventListener(event: 'lexik_jwt_authentication.on_authentication_success')]
final class JwtAuthenticationSuccessListener
{
    public function __construct(
        private readonly FilePathResolver $fileResolver,
    ) {}

    public function __invoke(AuthenticationSuccessEvent $event): void
    {
        $user = $event->getUser();

        if (!$user instanceof User) {
            return;
        }

        $data = $event->getData();

        // Ajout des informations utilisateur dans la réponse JSON du token
        $data['user'] = [
            'id'       => (string) $user->getId(),
            'email'    => $user->getEmail(),
            'username' => $user->getUsername(),
            'roles'    => $user->getRoles(),
            'avatar'   => $this->fileResolver->resolveUrl($user->getAvatar()),
        ];

        $event->setData($data);
    }
}
