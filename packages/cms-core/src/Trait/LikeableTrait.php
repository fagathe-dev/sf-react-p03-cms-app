<?php

declare(strict_types=1);

namespace Fagathe\CmsCore\Trait;

use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Fagathe\CmsCore\Entity\User;
use Symfony\Component\Serializer\Attribute\Groups;

trait LikableTrait
{
    #[ORM\Column(type: Types::INTEGER, options: ['default' => 0])]
    #[Groups(['post.list', 'post.read', 'comment.read', 'comment.list'])]
    private int $likesCount = 0;

    public function getLikesCount(): int
    {
        return $this->likesCount;
    }

    public function setLikesCount(int $likesCount): static
    {
        $this->likesCount = max(0, $likesCount);

        return $this;
    }

    public function isLikedBy(User $user): bool
    {
        $userId = (string) $user->getId();
        $likedBy = (array) $this->getSetting('liked_by', []);

        return isset($likedBy[$userId]);
    }

    /**
     * Bascule l'état "J'aime" pour l'utilisateur donné.
     * Retourne true si le like a été ajouté, false s'il a été retiré.
     */
    public function toggleLike(User $user): bool
    {
        $userId = (string) $user->getId();
        $likedBy = (array) $this->getSetting('liked_by', []);

        if (isset($likedBy[$userId])) {
            unset($likedBy[$userId]);
            $liked = false;
        } else {
            $likedBy[$userId] = (new \DateTimeImmutable())->format(\DateTimeInterface::ATOM);
            $liked = true;
        }

        $this->setSetting('liked_by', $likedBy);
        $this->likesCount = count($likedBy);

        return $liked;
    }
}
