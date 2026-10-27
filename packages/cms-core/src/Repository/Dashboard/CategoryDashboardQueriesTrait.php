<?php

declare(strict_types=1);

namespace Fagathe\CmsCore\Repository\Dashboard;

use Fagathe\CmsCore\Entity\Category;
use Fagathe\CmsCore\Entity\Post;
use Fagathe\CmsCore\Enum\Post\PostStatus;

/**
 * Agrégations du tableau de bord sur les catégories (utilisé par CategoryRepository).
 */
trait CategoryDashboardQueriesTrait
{
    /**
     * Toutes les catégories (y compris vides) avec leur nombre d'articles publiés.
     * icon / color / isFeatured sont lus dans settings (JSON, sans fonction DQL dédiée).
     *
     * @return list<array{id: string, name: string, slug: string, image: string|null, icon: string|null, color: string|null, isFeatured: bool, postsCount: int}>
     */
    public function findCategoriesWithPublishedPostCount(): array
    {
        $rows = $this->createQueryBuilder('c')
            ->select('c AS category', 'COUNT(p.id) AS postsCount')
            ->leftJoin(Post::class, 'p', 'WITH', 'p.category = c AND p.status = :published')
            ->setParameter('published', PostStatus::PUBLISHED)
            ->groupBy('c.id')
            ->orderBy('postsCount', 'DESC')
            ->addOrderBy('c.name', 'ASC')
            ->getQuery()
            ->getResult();

        return array_map(static function (array $row): array {
            /** @var Category $category */
            $category = $row['category'];
            $color = $category->getSetting('color');

            return [
                'id'         => (string) $category->getId(),
                'name'       => (string) $category->getName(),
                'slug'       => (string) $category->getSlug(),
                // Chemin relatif : résolu en URL absolue par la section du dashboard
                'image'      => $category->getImage(),
                'icon'       => $category->getSetting('icon'),
                'color'      => is_string($color) && $color !== '' ? $color : null,
                'isFeatured' => (bool) $category->getSetting('is_featured', false),
                'postsCount' => (int) $row['postsCount'],
            ];
        }, $rows);
    }
}
