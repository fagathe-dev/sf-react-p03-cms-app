<?php

declare(strict_types=1);

namespace App\Service;

use App\Entity\Post;
use App\Repository\PostViewRepository;
use Fagathe\CmsCore\Enum\PostStatus;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\Request;

class PostViewTracker
{
    private const BOT_PATTERN = '/bot|crawl|slurp|spider|mediapartners|curl|wget|python|postman|insomnia|headless|lighthouse|gtmetrix|pingdom|facebookexternalhit|discordbot|twitterbot|linkedinbot|whatsapp|slackbot/i';

    public function __construct(
        private readonly PostViewRepository $postViewRepository,
        private readonly Security $security,
        #[Autowire('%kernel.secret%')]
        private readonly string $appSecret,
    ) {}

    public function track(Post $post, Request $request): bool
    {
        // 1. On ne compte que les articles publiés
        if ($post->getStatus() !== PostStatus::PUBLISHED) {
            return false;
        }

        // 2. Filtrage des bots, scripts et préchargements navigateur (prefetch/prerender)
        if ($this->isBotOrPrefetch($request)) {
            return false;
        }

        // 3. Génération de l'empreinte anonymisée du visiteur
        $visitorHash = $this->generateVisitorHash($request);

        return $this->postViewRepository->registerOrganicView($post, $visitorHash);
    }

    private function isBotOrPrefetch(Request $request): bool
    {
        $userAgent = $request->headers->get('User-Agent', '');

        // Pas de User-Agent ou User-Agent trop court = script automatisé
        if (mb_strlen(trim($userAgent)) < 15) {
            return true;
        }

        // Détection des bots connus
        if (preg_match(self::BOT_PATTERN, $userAgent) === 1) {
            return true;
        }

        // Ignorer les préchargements automatiques du navigateur
        $purpose = strtolower((string) $request->headers->get('Purpose', $request->headers->get('X-Purpose', '')));
        $secPurpose = strtolower((string) $request->headers->get('Sec-Purpose', ''));
        if (str_contains($purpose, 'preview') || str_contains($purpose, 'prefetch') || str_contains($secPurpose, 'prefetch')) {
            return true;
        }

        return false;
    }

    private function generateVisitorHash(Request $request): string
    {
        $ip = $request->getClientIp() ?? '0.0.0.0';
        $userAgent = $request->headers->get('User-Agent', 'unknown');
        $userId = $this->security->getUser()?->getUserIdentifier() ?? 'guest';

        return hash('sha256', sprintf('%s|%s|%s|%s', $ip, $userAgent, $userId, $this->appSecret));
    }
}
