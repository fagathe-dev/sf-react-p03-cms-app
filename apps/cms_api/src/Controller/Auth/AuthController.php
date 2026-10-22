<?php

declare(strict_types=1);

namespace App\Controller\Auth;

use Fagathe\CmsCore\Service\AuthService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/auth', name: 'api_auth_')]
final class AuthController extends AbstractController
{
    public function __construct(
        private readonly AuthService $service,
    ) {}

    #[Route('/register', name: 'register', methods: ['POST'])]
    public function register(Request $request): JsonResponse
    {
        $res = $this->service->register($request);

        return $this->json($res->data, $res->status, $res->headers, $res->context);
    }

    #[Route('/verify-otp', name: 'verify_otp', methods: ['POST'])]
    public function verifyOtp(Request $request): JsonResponse
    {
        $res = $this->service->verifyOtp($request);

        return $this->json($res->data, $res->status, $res->headers, $res->context);
    }

    #[Route('/resend-otp', name: 'resend_otp', methods: ['POST'])]
    public function resendOtp(Request $request): JsonResponse
    {
        $res = $this->service->resendOtp($request);

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

    #[Route('/login', name: 'login', methods: ['POST'])]
    public function login(): JsonResponse
    {
        // Intercepté en amont par le firewall "json_login" de LexikJWT
        return $this->json(['message' => 'Missing credentials'], Response::HTTP_UNAUTHORIZED);
    }

    #[Route('/logout', name: 'logout', methods: ['POST'])]
    public function logout(): JsonResponse
    {
        // En JWT stateless, la suppression du token est gérée côté client (store React),
        // mais cet endpoint permet un retour HTTP standardisé.
        return $this->json(['message' => 'Déconnexion réussie.'], Response::HTTP_OK);
    }
}
