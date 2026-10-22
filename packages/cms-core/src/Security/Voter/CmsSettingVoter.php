<?php

declare(strict_types=1);

namespace Fagathe\CmsCore\Security\Voter;

use Fagathe\CmsCore\Entity\User;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Authorization\Voter\Voter;
use Symfony\Component\Security\Core\Authorization\Voter\Vote;

/**
 * @extends Voter<string, mixed>
 */
final class CmsSettingVoter extends Voter
{
    public const MANAGE_SETTINGS = 'CMS_SETTINGS_MANAGE';
    public const MANAGE_SEO = 'CMS_SEO_MANAGE';

    public function __construct(
        private readonly Security $security,
    ) {}

    protected function supports(string $attribute, mixed $subject): bool
    {
        return in_array($attribute, [self::MANAGE_SETTINGS, self::MANAGE_SEO], true);
    }

    
    public function supportsClass(string $class): bool
    {
        return true;
    }

    protected function voteOnAttribute(string $attribute, mixed $subject, TokenInterface $token, ?Vote $vote = null): bool
    {
        $user = $token->getUser();
        if (!$user instanceof User) {
            return false;
        }

        if ($attribute === self::MANAGE_SEO) {
            return $this->security->isGranted('ROLE_MANAGER');
        }

        // Seuls ROLE_ADMIN et ROLE_SUPER_ADMIN peuvent modifier les paramètres globaux du CMS
        return $this->security->isGranted('ROLE_ADMIN');
    }
}
