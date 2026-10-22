<?php

declare(strict_types=1);

namespace Fagathe\CmsCore\Service;

use Fagathe\CmsCore\Repository\CategoryRepository;
use Fagathe\CmsCore\Repository\PostRepository;
use Fagathe\CmsCore\Repository\TagRepository;
use Fagathe\CmsCore\Repository\UserRepository;

final class SearchService
{
    public function __construct(
        private readonly PostRepository $postRepository,
        private readonly CategoryRepository $categoryRepository,
        private readonly TagRepository $tagRepository,
        private readonly UserRepository $userRepository,
    ) {}

    /**
     * Recherche globale (Front ou Back-Office).
     *
     * @return array{
     *     posts: array<int, object>,
     *     categories: array<int, object>,
     *     tags: array<int, object>,
     *     users: array<int, object>
     * }
     */
    public function globalSearch(string $query, bool $isFront = true): array
    {
        $cleanQuery = trim($query);
        if (mb_strlen($cleanQuery) < 2) {
            return [
                'posts'      => [],
                'categories' => [],
                'tags'       => [],
                'users'      => [],
            ];
        }

        return [
            'posts'      => $this->postRepository->searchFullText($cleanQuery, limit: 20, onlyPublished: $isFront),
            'categories' => $this->categoryRepository->searchFullText($cleanQuery, limit: 10),
            'tags'       => $this->tagRepository->searchFullText($cleanQuery, limit: 15),
            'users'      => $this->userRepository->searchFullText($cleanQuery, limit: 10, onlyVerified: $isFront),
        ];
    }
}
