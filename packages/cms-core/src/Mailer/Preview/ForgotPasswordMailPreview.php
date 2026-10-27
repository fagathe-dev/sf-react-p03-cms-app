<?php

declare(strict_types=1);

namespace Fagathe\CmsCore\Mailer\Preview;

use Fagathe\CmsCore\Dto\Mail\ForgotPasswordMailDto;
use Fagathe\CmsCore\Generator\AuthLinkGenerator;
use Fagathe\CmsCore\Service\AuthService;

final class ForgotPasswordMailPreview implements MailPreviewInterface
{
    public function __construct(
        private readonly AuthLinkGenerator $linkGenerator,
    ) {}

    public static function getSlug(): string
    {
        return 'forgot-password';
    }

    public function getLabel(): string
    {
        return 'Mot de passe oublié';
    }

    public function getDescription(): string
    {
        return 'Lien de réinitialisation du mot de passe (24 h).';
    }

    public function createDto(): object
    {
        return new ForgotPasswordMailDto(
            recipientEmail: self::RECIPIENT_EMAIL,
            recipientName: self::RECIPIENT_NAME,
            resetUrl: $this->linkGenerator->resetPasswordUrl(bin2hex(random_bytes(32))),
            ttlHours: AuthService::PASSWORD_RESET_TTL_HOURS,
        );
    }
}
