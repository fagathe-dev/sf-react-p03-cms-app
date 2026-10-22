<?php

declare(strict_types=1);

namespace Fagathe\CmsCore\Trait;

use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Fagathe\CmsCore\Entity\User;
use Fagathe\CmsCore\Enum\Post\FlagReason;
use Symfony\Component\Serializer\Attribute\Groups;

trait FlaggableTrait
{
    /**
     * Nombre de signalements reçus.
     */
    #[ORM\Column(type: Types::INTEGER, options: ['default' => 0])]
    #[Groups(['post.read', 'post.list', 'comment.read', 'comment.list'])]
    private int $flags = 0;

    public function getFlags(): int
    {
        return $this->flags;
    }

    public function setFlags(int $flags): static
    {
        $this->flags = max(0, $flags);

        return $this;
    }

    public function hasBeenFlaggedBy(User $user): bool
    {
        $userId = (string) $user->getId();
        $flaggedBy = (array) $this->getSetting('flagged_by', []);

        return isset($flaggedBy[$userId]);
    }

    /**
     * Ajoute un signalement d'un utilisateur connecté (1 seul par utilisateur).
     * Retourne false si l'utilisateur a déjà signalé ce contenu.
     */
    public function flagByUser(
        User $user,
        FlagReason|string $reason = FlagReason::OTHER,
        ?string $comment = null
    ): bool {
        if ($this->hasBeenFlaggedBy($user)) {
            return false;
        }

        if (is_string($reason)) {
            $reason = FlagReason::tryFrom($reason) ?? FlagReason::OTHER;
        }

        $userId = (string) $user->getId();
        $flaggedBy = (array) $this->getSetting('flagged_by', []);
        $flaggedBy[$userId] = [
            'reason'     => $reason->value,
            'comment'    => $comment !== null && trim($comment) !== '' ? trim($comment) : null,
            'flagged_at' => (new \DateTimeImmutable())->format(\DateTimeInterface::ATOM),
        ];

        $this->setSetting('flagged_by', $flaggedBy);
        $this->flags = count($flaggedBy);

        $this->onFlagThresholdReached();

        return true;
    }

    /**
     * Réinitialise tous les signalements (ex: après validation par un modérateur).
     */
    public function clearFlags(): static
    {
        $this->flags = 0;
        $this->setSetting('flagged_by', []);

        return $this;
    }

    /**
     * Hook interne (Open-Closed) permettant aux entités d'appliquer une règle métier
     * quand un seuil de signalements est atteint.
     */
    protected function onFlagThresholdReached(): void
    {
        // Surchargé dans Comment ou Post si besoin
    }
}
