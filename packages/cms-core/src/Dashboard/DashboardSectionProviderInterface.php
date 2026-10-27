<?php

declare(strict_types=1);

namespace Fagathe\CmsCore\Dashboard;

use Fagathe\CmsCore\Entity\User;
use Symfony\Component\DependencyInjection\Attribute\AutoconfigureTag;

/**
 * Section du tableau de bord, découverte automatiquement par DashboardService.
 *
 * Ajouter un bloc au dashboard = une classe implémentant cette interface : DashboardService n'est pas modifié.
 * Une section non supportée est absente de la réponse ; le back-office masque alors le widget correspondant.
 */
#[AutoconfigureTag(self::TAG)]
interface DashboardSectionProviderInterface
{
    public const TAG = 'cms.dashboard_section';

    /**
     * Rôle minimum, etc.
     */
    public function supports(User $user): bool;

    /**
     * Clés fusionnées à la racine de la réponse du dashboard.
     *
     * @return array<string, mixed>
     */
    public function provide(User $user): array;

    /**
     * Groupes de sérialisation nécessaires aux entités renvoyées.
     *
     * @return string[]
     */
    public function getSerializationGroups(): array;
}
