<?php

declare(strict_types=1);

namespace Fagathe\CmsCore\Generator;

use Fagathe\CorePhp\Http\RequestTrait;

/**
 * Construit les liens des e-mails d'authentification vers l'application cliente
 * (cms_bo pour cms_api), configurée via cms_core.app_url.
 */
final class AuthLinkGenerator
{
    use RequestTrait;

    public const VERIFY_EMAIL_PATH = '/verify-email';
    public const RESET_PASSWORD_PATH = '/reset-password';
    public const LOGIN_PATH = '/login';

    public function __construct(
        private readonly ?string $appUrl = null,
    ) {}

    public function verifyEmailUrl(string $token): string
    {
        return $this->build(self::VERIFY_EMAIL_PATH, ['token' => $token]);
    }

    public function resetPasswordUrl(string $token): string
    {
        return $this->build(self::RESET_PASSWORD_PATH, ['token' => $token]);
    }

    public function loginUrl(): string
    {
        return $this->build(self::LOGIN_PATH);
    }

    /**
     * @param array<string, string> $query
     */
    private function build(string $path, array $query = []): string
    {
        $baseUrl = rtrim(!empty($this->appUrl) ? $this->appUrl : $this->getOrigin(), '/');

        return $baseUrl . $path . ($query !== [] ? '?' . http_build_query($query) : '');
    }
}
