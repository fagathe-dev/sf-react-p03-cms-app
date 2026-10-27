<?php

declare(strict_types=1);

namespace Fagathe\CmsCore\Trait;

use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;

trait ConfigurableEntityTrait
{
    /**
     * @var array<string, mixed>|null
     */
    #[ORM\Column(type: Types::JSON, nullable: true)]
    // category.list : l'icône de repli (settings.icon) d'une catégorie sans image est affichée dans les listes
    // dashboard.read : le tableau de bord lit settings.is_featured / settings.moderation_note des articles listés
    #[Groups(['post.read', 'bloc.read', 'file.read', 'category.list', 'category.read', 'comment.read', 'dashboard.read'])]
    private ?array $settings = null;

    /**
     * À surcharger dans l'entité si elle possède des clés par défaut.
     *
     * @return array<string, mixed>
     */
    protected static function getDefaultSettings(): array
    {
        return [];
    }

    /**
     * @return array<string, mixed>
     */
    public function getSettings(): array
    {
        return array_replace(static::getDefaultSettings(), $this->settings ?? []);
    }

    /**
     * @param array<string, mixed>|null $settings
     */
    public function setSettings(?array $settings): static
    {
        $this->settings = array_replace(static::getDefaultSettings(), $settings ?? []);

        return $this;
    }

    public function getSetting(string $key, mixed $default = null): mixed
    {
        $merged = $this->getSettings();

        return $merged[$key] ?? $default;
    }

    public function getOption(string $key, mixed $default = null): mixed
    {
        return $this->getSetting($key, $default);
    }

    public function setSetting(string $key, mixed $value): static
    {
        $current = $this->getSettings();
        $current[$key] = $value;
        $this->settings = $current;

        return $this;
    }
}
