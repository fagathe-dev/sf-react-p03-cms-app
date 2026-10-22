<?php

declare(strict_types=1);

namespace Fagathe\CmsCore\Service;

use Fagathe\CmsCore\Entity\Post;
use Fagathe\CmsCore\Entity\User;
use Fagathe\CmsCore\Enum\Post\PostStatus;
use Fagathe\CmsCore\Repository\PostViewRepository;
use Fagathe\CorePhp\Enum\DeviceEnum;
use Fagathe\CorePhp\Http\Cookie;
use Fagathe\CorePhp\Utils\DetectDevice;
use Fagathe\CorePhp\Utils\IPChecker;
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
        private readonly string $appSecret = 'default_cms_secret',
    ) {}

    public function track(Post $post, Request $request): bool
    {
        if ($post->getStatus() !== PostStatus::PUBLISHED) {
            return false;
        }

        $postId = (string) $post->getId();
        $cookieKey = sprintf('viewed_%s', substr(md5($postId), 0, 12));

        if (Cookie::has($cookieKey)) {
            return false;
        }

        if ($this->isBotOrSuspicious($request)) {
            return false;
        }

        $visitorHash = $this->generateVisitorHash($request);
        $registered = $this->postViewRepository->registerOrganicView($post, $visitorHash);

        if ($registered) {
            $endOfDay = (new \DateTimeImmutable('tomorrow'))->getTimestamp() - 1;
            Cookie::set($cookieKey, '1', [
                'expires'  => $endOfDay,
                'path'     => '/',
                'secure'   => $request->isSecure(),
                'httponly' => true,
                'samesite' => 'Lax',
            ]);
        }

        return $registered;
    }

    private function isBotOrSuspicious(Request $request): bool
    {
        $userAgent = $request->headers->get('User-Agent', '');

        if (mb_strlen(trim($userAgent)) < 15 || preg_match(self::BOT_PATTERN, $userAgent) === 1) {
            return true;
        }

        $purpose = strtolower((string) $request->headers->get('Purpose', $request->headers->get('X-Purpose', '')));
        $secPurpose = strtolower((string) $request->headers->get('Sec-Purpose', ''));
        if (str_contains($purpose, 'preview') || str_contains($purpose, 'prefetch') || str_contains($secPurpose, 'prefetch')) {
            return true;
        }

        $detector = new DetectDevice();
        $deviceType = $detector->getDeviceType();

        return $deviceType === DeviceEnum::Terminal || $deviceType->value === 'Terminal / CLI';
    }

    private function generateVisitorHash(Request $request): string
    {
        $ipChecker = new IPChecker($this->security);
        $ip = $ipChecker->getIp();

        if ($ip === 'unknown IP address') {
            $ip = $request->getClientIp() ?? '0.0.0.0';
        }

        $userAgent = $request->headers->get('User-Agent', 'unknown');
        $user = $this->security->getUser();
        $userId = $user instanceof User ? (string) $user->getId() : 'guest';

        return hash('sha256', sprintf('%s|%s|%s|%s', $ip, $userAgent, $userId, $this->appSecret));
    }
}
