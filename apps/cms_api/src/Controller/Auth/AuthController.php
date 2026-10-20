<?php

namespace App\Controller\Auth;

use Fagathe\CmsCore\Service\AuthService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/auth', name: 'api_auth_')]
final class AuthController extends AbstractController
{
    public function __construct(private readonly AuthService $service) {}

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
        // Cette méthode ne sera jamais exécutée car le firewall "json_login" intercepte la requête avant.
        // Mais elle est nécessaire pour que le routeur de Symfony ne renvoie pas une erreur 404.
        return $this->json(['message' => 'Missing credentials']);
    }
}
