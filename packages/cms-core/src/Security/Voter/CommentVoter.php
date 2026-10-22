<?php

declare(strict_types=1);

namespace Fagathe\CmsCore\Security\Voter;

use Fagathe\CmsCore\Entity\Comment;
use Fagathe\CmsCore\Entity\User;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Authorization\Voter\Voter;
use Symfony\Component\Security\Core\Authorization\Voter\Vote;

/**
 * @extends Voter<string, Comment|null>
 */
final class CommentVoter extends Voter
{
    public const CREATE = 'COMMENT_CREATE';
    public const EDIT = 'COMMENT_EDIT';
    public const DELETE = 'COMMENT_DELETE';
    public const FLAG = 'COMMENT_FLAG';
    public const MODERATE = 'COMMENT_MODERATE';

    private const ATTRIBUTES = [
        self::CREATE,
        self::EDIT,
        self::DELETE,
        self::FLAG,
        self::MODERATE,
    ];

    public function __construct(
        private readonly Security $security,
    ) {}

    
    public function supportsClass(string $class): bool
    {
        return true;
    }

    protected function supports(string $attribute, mixed $subject): bool
    {
        if (!in_array($attribute, self::ATTRIBUTES, true)) {
            return false;
        }

        if ($attribute === self::CREATE) {
            return true;
        }

        return $subject instanceof Comment;
    }

    protected function voteOnAttribute(string $attribute, mixed $subject, TokenInterface $token, ?Vote $vote = null): bool
    {
        $user = $token->getUser();
        if (!$user instanceof User) {
            return false;
        }

        if ($this->security->isGranted('ROLE_ADMIN')) {
            return true;
        }

        if ($attribute === self::CREATE) {
            return $this->security->isGranted('ROLE_USER');
        }

        /** @var Comment $comment */
        $comment = $subject;
        $isOwner = $comment->getOwner() !== null
            && (string) $comment->getOwner()->getId() === (string) $user->getId();

        return match ($attribute) {
            self::EDIT => $isOwner,
            self::DELETE => $isOwner || $this->security->isGranted('ROLE_MODERATOR'),
            self::FLAG => !$isOwner && $this->security->isGranted('ROLE_USER'),
            self::MODERATE => $this->security->isGranted('ROLE_MODERATOR'),
            default => false,
        };
    }
}
