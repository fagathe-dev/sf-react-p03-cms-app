<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20261022114129 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE cms_setting (id BINARY(16) NOT NULL, setting_key VARCHAR(100) NOT NULL, setting_value LONGTEXT DEFAULT NULL, type VARCHAR(50) DEFAULT \'string\' NOT NULL, created_at DATETIME NOT NULL, updated_at DATETIME DEFAULT NULL, settings JSON DEFAULT NULL, UNIQUE INDEX UNIQ_C198B7895FA1E697 (setting_key), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('ALTER TABLE post ADD likes_count INT DEFAULT 0 NOT NULL, ADD flags INT DEFAULT 0 NOT NULL');
        $this->addSql('CREATE INDEX idx_post_flags ON post (flags)');
        $this->addSql('CREATE INDEX idx_post_likes ON post (likes_count)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('DROP TABLE cms_setting');
        $this->addSql('DROP INDEX idx_post_flags ON post');
        $this->addSql('DROP INDEX idx_post_likes ON post');
        $this->addSql('ALTER TABLE post DROP likes_count, DROP flags');
    }
}
