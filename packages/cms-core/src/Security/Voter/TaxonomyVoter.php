<?php

declare(strict_types=1);

namespace Fagathe\CmsCore\Security\Voter;

use Fagathe\CmsCore\Entity\Category;
use Fagathe\CmsCore\Entity\Tag;
use Fagathe\CmsCore\Entity\User;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Authorization\Voter\Voter;
use Symfony\Component\Security\Core\Authorization\Voter\Vote;

/**
 * @extends Voter<string, Category|Tag|null>
 */
final class TaxonomyVoter extends Voter
{
    public const MANAGE_CATEGORY = 'CATEGORY_MANAGE';
    public const MANAGE_TAG = 'TAG_MANAGE';

    public function __construct(
        private readonly Security $security,
    ) {}


    public function supportsClass(string $class): bool
    {
        return true;
    }
    
    protected function supports(string $attribute, mixed $subject): bool
    {
        return in_array($attribute, [self::MANAGE_CATEGORY, self::MANAGE_TAG], true);
    }

    protected function voteOnAttribute(string $attribute, mixed $subject, TokenInterface $token, ?Vote $vote = null): bool
    {
        $user = $token->getUser();
        if (!$user instanceof User) {
            return false;
        }

        // Le gestionnaire (ROLE_MANAGER), l'admin et le super-admin gèrent les catégories et les tags
        return $this->security->isGranted('ROLE_MANAGER');
    }
}
