<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Fichiers uploadés : la BDD stocke désormais le chemin relatif (uploads/...) et l'API résout l'URL absolue
 * (Fagathe\CmsCore\Service\FilePathResolver). Convertit les anciennes URL absolues de l'API, quel que soit
 * l'hôte (DEFAULT_URI a pu changer), ainsi que les chemins commençant par "/".
 *
 * Seules les URL dont le chemin commence par /uploads/avatars/ ou /uploads/posts/ sont converties :
 * les URL externes (pravatar, picsum…) sont conservées.
 */
final class Version20261025120000 extends AbstractMigration
{
    private const COLUMNS = [
        'user'       => 'avatar',
        'post'       => 'thumbnail',
        'post_media' => 'file_path',
    ];

    public function getDescription(): string
    {
        return 'Fichiers uploadés : URL absolues → chemins relatifs (uploads/...)';
    }

    public function up(Schema $schema): void
    {
        foreach (self::COLUMNS as $table => $column) {
            $this->addSql(sprintf(
                "UPDATE `%1\$s` SET `%2\$s` = SUBSTRING(`%2\$s`, LOCATE('/uploads/', `%2\$s`) + 1) WHERE `%2\$s` REGEXP '^https?://[^/]+/uploads/(avatars|posts)/'",
                $table,
                $column
            ));
            $this->addSql(sprintf(
                "UPDATE `%1\$s` SET `%2\$s` = SUBSTRING(`%2\$s`, 2) WHERE `%2\$s` LIKE '/uploads/%%'",
                $table,
                $column
            ));
        }
    }

    public function down(Schema $schema): void
    {
        // Pas de retour arrière : l'hôte d'origine n'est pas connu, et l'API sait servir les deux formats
        // (FilePathResolver::resolveUrl() renvoie les URL absolues telles quelles).
    }
}
