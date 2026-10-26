<?php

declare(strict_types=1);

namespace App\Controller\Auth;

use Fagathe\CmsCore\Service\AuthService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

/**
 * Routes publiques d'authentification (access_control : ^/api/auth/ en PUBLIC_ACCESS).
 */
#[Route('/auth', name: 'api_auth_')]
final class AuthController extends AbstractController
{
    public function __construct(
        private readonly AuthService $service,
    ) {}

    /**
     * Connexion par mot de passe : interceptée par Fagathe\CmsCore\Security\ApiAuthenticator
     * (firewall "api"), qui renvoie le JWT. La route n'existe que pour être résolue par le routeur.
     */
    #[Route('/login', name: 'login', methods: ['POST'])]
    public function login(): never
    {
        throw new \LogicException('Cette route est gérée par ApiAuthenticator (firewall "api").');
    }

    /**
     * Connexion sans mot de passe, étape 1 : envoi du code temporaire par e-mail
     */
    #[Route('/login-code', name: 'login_code_request', methods: ['POST'])]
    public function requestLoginCode(Request $request): JsonResponse
    {
        $res = $this->service->requestLoginCode($request);

        return $this->json($res->data, $res->status, $res->headers, $res->context);
    }

    /**
     * Connexion sans mot de passe, étape 2 : identifiant + code → JWT
     */
    #[Route('/login-code/verify', name: 'login_code_verify', methods: ['POST'])]
    public function loginWithCode(Request $request): JsonResponse
    {
        $res = $this->service->loginWithCode($request);

        return $this->json($res->data, $res->status, $res->headers, $res->context);
    }

    #[Route('/register', name: 'register', methods: ['POST'])]
    public function register(Request $request): JsonResponse
    {
        $res = $this->service->register($request);

        return $this->json($res->data, $res->status, $res->headers, $res->context);
    }

    /**
     * Lien de vérification reçu à l'inscription : active le compte et renvoie un JWT (connexion automatique)
     */
    #[Route('/verify-email', name: 'verify_email', methods: ['POST'])]
    public function verifyEmail(Request $request): JsonResponse
    {
        $res = $this->service->verifyEmail($request);

        return $this->json($res->data, $res->status, $res->headers, $res->context);
    }

    #[Route('/resend-verification', name: 'resend_verification', methods: ['POST'])]
    public function resendVerification(Request $request): JsonResponse
    {
        $res = $this->service->resendVerification($request);

        return $this->json($res->data, $res->status, $res->headers, $res->context);
    }

    #[Route('/forgot-password', name: 'forgot_password', methods: ['POST'])]
    public function forgotPassword(Request $request): JsonResponse
    {
        $res = $this->service->forgotPassword($request);

        return $this->json($res->data, $res->status, $res->headers, $res->context);
    }

    #[Route('/reset-password', name: 'reset_password', methods: ['POST'])]
    public function resetPassword(Request $request): JsonResponse
    {
        $res = $this->service->resetPassword($request);

        return $this->json($res->data, $res->status, $res->headers, $res->context);
    }

    #[Route('/logout', name: 'logout', methods: ['POST'])]
    public function logout(): JsonResponse
    {
        return $this->json(['message' => 'Déconnexion réussie.'], Response::HTTP_OK);
    }
}
