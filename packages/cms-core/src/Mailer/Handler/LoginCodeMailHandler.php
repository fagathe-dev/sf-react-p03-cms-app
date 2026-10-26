<?php

declare(strict_types=1);

namespace Fagathe\CmsCore\Mailer\Handler;

use Fagathe\CmsCore\Dto\Mail\LoginCodeMailDto;
use Fagathe\CmsCore\Mailer\MailHandlerInterface;
use Fagathe\CorePhp\Mailer\AbstractMailerHandler;
use Symfony\Component\Mime\Address;

/**
 * @extends AbstractMailerHandler<LoginCodeMailDto>
 */
final class LoginCodeMailHandler extends AbstractMailerHandler implements MailHandlerInterface
{
    public static function getDtoClass(): string
    {
        return LoginCodeMailDto::class;
    }

    protected function getTemplate(): string
    {
        return '@CmsCore/emails/auth/login_code.html.twig';
    }

    protected function getSubject(object $dto): string
    {
        return sprintf('Votre code de connexion : %s', $dto->code);
    }

    protected function getRecipients(object $dto): array
    {
        return [new Address($dto->recipientEmail, $dto->recipientName)];
    }
}
