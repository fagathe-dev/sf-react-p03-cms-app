<?php

declare(strict_types=1);

namespace Fagathe\CmsCore\Trait;

trait FullTextSearchTrait
{
    /**
     * Formate une chaîne de recherche pour MySQL MATCH ... AGAINST (... IN BOOLEAN MODE).
     * Exemple : "symfony docker" -> "+symfony* +docker*"
     */
    protected function formatBooleanSearchQuery(string $rawQuery): string
    {
        // Supprime les caractères spéciaux réservés au mode booléen MySQL
        $cleaned = preg_replace('/[+\-><\(\)~*\"@]+/', ' ', $rawQuery) ?? '';
        $words = preg_split('/\s+/', trim($cleaned), -1, PREG_SPLIT_NO_EMPTY) ?: [];

        $tokens = [];
        foreach ($words as $word) {
            if (mb_strlen($word) >= 2) {
                $tokens[] = '+' . $word . '*';
            }
        }

        return implode(' ', $tokens);
    }
}
