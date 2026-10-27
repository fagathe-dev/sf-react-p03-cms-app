<?php

declare(strict_types=1);

namespace Fagathe\CmsCore\Mailer\Preview;

use Fagathe\CmsCore\Dto\Mail\RegistrationConfirmedMailDto;
use Fagathe\CmsCore\Generator\AuthLinkGenerator;

final class RegistrationConfirmedMailPreview implements MailPreviewInterface
{
    public function __construct(
        private readonly AuthLinkGenerator $linkGenerator,
    ) {}

    public static function getSlug(): string
    {
        return 'registration-confirmed';
    }

    public function getLabel(): string
    {
        return 'Bienvenue';
    }

    public function getDescription(): string
    {
        return 'Confirmation envoyée une fois l\'adresse e-mail vérifiée.';
    }

    public function createDto(): object
    {
        return new RegistrationConfirmedMailDto(
            recipientEmail: self::RECIPIENT_EMAIL,
            recipientName: self::RECIPIENT_NAME,
            loginUrl: $this->linkGenerator->loginUrl(),
        );
    }
}
