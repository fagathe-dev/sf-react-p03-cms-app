<?php

declare(strict_types=1);

namespace Fagathe\CmsCore\Repository\Dashboard;

use Doctrine\DBAL\ArrayParameterType;
use Fagathe\CmsCore\Entity\Post;
use Fagathe\CmsCore\Enum\Seo\SeoTargetType;

/**
 * Agrégations du tableau de bord sur les métadonnées SEO (utilisé par SeoMetadataRepository).
 */
trait SeoMetadataDashboardQueriesTrait
{
    /**
     * Articles publiés sans SeoMetadata.
     *
     * targetIdentifier stocke l'UUID en texte alors que Post::id est binaire : pas de jointure SQL directe.
     * On récupère les ids publiés (en texte), on compte ceux couverts, puis on fait la différence.
     */
    public function countPublishedPostsWithoutSeoMeta(): int
    {
        $publishedIds = $this->getEntityManager()->getRepository(Post::class)->findPublishedPostIds();
        if ($publishedIds === []) {
            return 0;
        }

        $covered = (int) $this->createQueryBuilder('s')
            ->select('COUNT(DISTINCT s.targetIdentifier)')
            ->andWhere('s.targetType = :post')
            ->andWhere('s.targetIdentifier IN (:ids)')
            ->setParameter('post', SeoTargetType::POST)
            ->setParameter('ids', $publishedIds, ArrayParameterType::STRING)
            ->getQuery()
            ->getSingleScalarResult();

        return max(0, count($publishedIds) - $covered);
    }
}
