<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

final class PostController extends AbstractController
{
    #[Route('/posts/{id}/track-view', name: 'app_post_track_view', methods: ['POST'])]
    public function trackView(Post $post, Request $request, PostViewTracker $tracker): Response
    {
        $tracker->track($post, $request);

        return new Response(null, Response::HTTP_NO_CONTENT);
    }
}
