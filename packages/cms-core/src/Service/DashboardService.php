<?php

declare(strict_types=1);

namespace Fagathe\CmsCore\Service;

use Fagathe\CmsCore\Dashboard\DashboardSectionProviderInterface;
use Fagathe\CmsCore\Entity\User;
use Fagathe\CorePhp\Http\ResponseTrait;
use Symfony\Component\DependencyInjection\Attribute\AutowireIterator;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Security\Core\Authentication\Token\Storage\TokenStorageInterface;
use Symfony\Component\Security\Core\Authorization\AuthorizationCheckerInterface;

/**
 * Données du tableau de bord : agrège les sections (DashboardSectionProviderInterface) autorisées pour l'utilisateur.
 *
 * Aucune logique de rôle propre à un bloc ici : chaque section décide via supports().
 */
final class DashboardService
{
    use ResponseTrait;

    /**
     * @param iterable<DashboardSectionProviderInterface> $sections
     */
    public function __construct(
        #[AutowireIterator(DashboardSectionProviderInterface::TAG)]
        private readonly iterable $sections,
        private readonly AuthorizationCheckerInterface $authorizationChecker,
        private readonly TokenStorageInterface $tokenStorage,
    ) {}

    public function getDashboardData(): object
    {
        $user = $this->tokenStorage->getToken()?->getUser();
        if (!$user instanceof User) {
            return $this->sendUnauthorized();
        }

        if (!$this->authorizationChecker->isGranted('ROLE_CONTRIBUTOR')) {
            return $this->sendForbidden('Le tableau de bord est réservé aux membres du back-office.');
        }

        $data = [];
        $groups = [];

        foreach ($this->sections as $section) {
            if (!$section->supports($user)) {
                continue;
            }

            $data = [...$data, ...$section->provide($user)];
            $groups = [...$groups, ...$section->getSerializationGroups()];
        }

        return $this->sendJson($data, Response::HTTP_OK, context: ['groups' => array_values(array_unique($groups))]);
    }
}
