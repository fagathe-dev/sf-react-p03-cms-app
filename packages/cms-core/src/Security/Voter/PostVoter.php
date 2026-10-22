<?php

declare(strict_types=1);

namespace Fagathe\CmsCore\Security\Voter;

use Fagathe\CmsCore\Entity\Post;
use Fagathe\CmsCore\Entity\User;
use Fagathe\CmsCore\Enum\Post\PostStatus;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Authorization\Voter\Voter;
use Symfony\Component\Security\Core\Authorization\Voter\Vote;

/**
 * @extends Voter<string, Post|null>
 */
final class PostVoter extends Voter
{
    public const VIEW = 'POST_VIEW';
    public const REACT = 'POST_REACT';       // Liker, commenter, signaler
    public const CREATE = 'POST_CREATE';     // Rédiger un article
    public const EDIT = 'POST_EDIT';         // Modifier le contenu/blocs/médias
    public const REVIEW = 'POST_REVIEW';     // Valider ou passer en REVIEW / REWRITING
    public const DELETE = 'POST_DELETE';     // Mettre à la corbeille / Supprimer

    private const ATTRIBUTES = [
        self::VIEW,
        self::REACT,
        self::CREATE,
        self::EDIT,
        self::REVIEW,
        self::DELETE,
    ];

    public function __construct(
        private readonly Security $security,
    ) {}

    protected function supports(string $attribute, mixed $subject): bool
    {
        if (!in_array($attribute, self::ATTRIBUTES, true)) {
            return false;
        }

        if ($attribute === self::CREATE) {
            return true;
        }

        return $subject instanceof Post;
    }


    public function supportsClass(string $class): bool
    {
        return true;
    }

    protected function voteOnAttribute(string $attribute, mixed $subject, TokenInterface $token, ?Vote $vote = null): bool
    {
        $user = $token->getUser();

        // 1. Lecture d'un article : public si publié, sinon accessible à tout membre de l'admin (ROLE_CONTRIBUTOR+)
        if ($attribute === self::VIEW) {
            /** @var Post $post */
            $post = $subject;

            if ($post->getStatus() === PostStatus::PUBLISHED) {
                return true;
            }

            return $user instanceof User && $this->security->isGranted('ROLE_CONTRIBUTOR');
        }

        // Toutes les autres actions exigent un utilisateur connecté
        if (!$user instanceof User) {
            return false;
        }

        // Les administrateurs et gestionnaires ont tous les droits sur les articles
        if ($this->security->isGranted('ROLE_MANAGER')) {
            return true;
        }

        // 2. Création d'un article (ROLE_CONTRIBUTOR minimum)
        if ($attribute === self::CREATE) {
            return $this->security->isGranted('ROLE_CONTRIBUTOR');
        }

        /** @var Post $post */
        $post = $subject;

        return match ($attribute) {
            self::REACT => $this->canReact($post),
            self::EDIT => $this->canEdit($post, $user),
            self::REVIEW => $this->canReview($post, $user),
            self::DELETE => $this->canDelete($post, $user),
            default => false,
        };
    }

    private function canReact(Post $post): bool
    {
        return $post->getStatus() === PostStatus::PUBLISHED
            && $this->security->isGranted('ROLE_USER');
    }

    /**
     * Un contributeur, éditeur ou modérateur ne peut modifier QUE ses propres articles.
     * (ROLE_MANAGER, ROLE_ADMIN et ROLE_SUPER_ADMIN sont déjà autorisés plus haut).
     */
    private function canEdit(Post $post, User $user): bool
    {
        return $this->security->isGranted('ROLE_CONTRIBUTOR')
            && $this->isAuthor($post, $user);
    }

    /**
     * Le modérateur (et +) peut passer un article en REVIEW / REWRITING ou le valider,
     * sans pouvoir en modifier le texte.
     */
    private function canReview(Post $post, User $user): bool
    {
        return $this->security->isGranted('ROLE_MODERATOR')
            && !$this->isAuthor($post, $user);
    }

    /**
     * L'auteur peut supprimer son propre article ; le modérateur peut supprimer n'importe quel article.
     */
    private function canDelete(Post $post, User $user): bool
    {
        if ($this->security->isGranted('ROLE_MODERATOR')) {
            return true;
        }

        return $this->security->isGranted('ROLE_CONTRIBUTOR')
            && $this->isAuthor($post, $user);
    }

    private function isAuthor(Post $post, User $user): bool
    {
        return $post->getAuthor() !== null
            && (string) $post->getAuthor()->getId() === (string) $user->getId();
    }
}
