<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20261020150203 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE cms_seo_metadata (id BINARY(16) NOT NULL, target_type VARCHAR(50) NOT NULL, target_identifier VARCHAR(180) NOT NULL, meta_title VARCHAR(70) DEFAULT NULL, meta_description VARCHAR(160) DEFAULT NULL, canonical_url VARCHAR(255) DEFAULT NULL, robots VARCHAR(50) DEFAULT \'index, follow\' NOT NULL, og_title VARCHAR(180) DEFAULT NULL, og_description VARCHAR(255) DEFAULT NULL, og_image VARCHAR(255) DEFAULT NULL, geo_region VARCHAR(100) DEFAULT NULL, geo_placename VARCHAR(100) DEFAULT NULL, geo_position VARCHAR(50) DEFAULT NULL, json_ld_schema JSON DEFAULT NULL, created_at DATETIME NOT NULL, updated_at DATETIME DEFAULT NULL, INDEX idx_seo_target (target_type, target_identifier), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('DROP TABLE seo_metadata');
        $this->addSql('ALTER TABLE bloc_content ADD search_text LONGTEXT DEFAULT NULL');
        $this->addSql('CREATE INDEX idx_bloc_type ON bloc_content (type)');
        $this->addSql('CREATE FULLTEXT INDEX idx_bloc_fulltext ON bloc_content (search_text)');
        $this->addSql('CREATE FULLTEXT INDEX idx_category_fulltext ON category (name, description)');
        $this->addSql('CREATE FULLTEXT INDEX idx_post_fulltext ON post (title, excerpt)');
        $this->addSql('CREATE FULLTEXT INDEX idx_tag_fulltext ON tag (name, description)');
        $this->addSql('ALTER TABLE user ADD role VARCHAR(50) NOT NULL, DROP roles');
        $this->addSql('CREATE FULLTEXT INDEX idx_user_fulltext ON user (username, firstname, lastname)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE seo_metadata (id INT AUTO_INCREMENT NOT NULL, PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_0900_ai_ci` ENGINE = InnoDB COMMENT = \'\' ');
        $this->addSql('DROP TABLE cms_seo_metadata');
        $this->addSql('DROP INDEX idx_bloc_type ON bloc_content');
        $this->addSql('DROP INDEX idx_bloc_fulltext ON bloc_content');
        $this->addSql('ALTER TABLE bloc_content DROP search_text');
        $this->addSql('DROP INDEX idx_category_fulltext ON category');
        $this->addSql('DROP INDEX idx_post_fulltext ON post');
        $this->addSql('DROP INDEX idx_tag_fulltext ON tag');
        $this->addSql('DROP INDEX idx_user_fulltext ON user');
        $this->addSql('ALTER TABLE user ADD roles JSON NOT NULL, DROP role');
    }
}
