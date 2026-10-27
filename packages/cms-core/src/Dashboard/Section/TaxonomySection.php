<?php

declare(strict_types=1);

namespace Fagathe\CmsCore\Dashboard\Section;

use Fagathe\CmsCore\Dashboard\DashboardSectionProviderInterface;
use Fagathe\CmsCore\Entity\User;
use Fagathe\CmsCore\Repository\CategoryRepository;
use Fagathe\CmsCore\Repository\TagRepository;
use Fagathe\CmsCore\Service\FilePathResolver;

/**
 * Répartition des articles publiés par catégorie et tags les plus utilisés.
 */
final class TaxonomySection implements DashboardSectionProviderInterface
{
    private const POPULAR_TAGS_LIMIT = 10;

    public function __construct(
        private readonly CategoryRepository $categoryRepository,
        private readonly TagRepository $tagRepository,
        private readonly FilePathResolver $fileResolver,
    ) {}

    public function supports(User $user): bool
    {
        return true;
    }

    public function provide(User $user): array
    {
        // Tableaux (et non entités) : FileUrlNormalizer ne s'applique pas, l'image est résolue ici
        $categories = array_map(
            fn(array $category): array => ['image' => $this->fileResolver->resolveUrl($category['image'])] + $category,
            $this->categoryRepository->findCategoriesWithPublishedPostCount()
        );

        return [
            'categoriesDistribution' => $categories,
            'popularTags'            => $this->tagRepository->findPopularTags(self::POPULAR_TAGS_LIMIT),
        ];
    }

    public function getSerializationGroups(): array
    {
        return [];
    }
}
