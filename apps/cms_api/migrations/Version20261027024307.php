<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20261027024307 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE bloc_content (id BINARY(16) NOT NULL, type VARCHAR(30) NOT NULL, position INT DEFAULT 1 NOT NULL, data JSON NOT NULL, search_text LONGTEXT DEFAULT NULL, created_at DATETIME NOT NULL, updated_at DATETIME DEFAULT NULL, settings JSON DEFAULT NULL, post_id BINARY(16) NOT NULL, INDEX idx_bloc_position (position), INDEX idx_bloc_type (type), FULLTEXT INDEX idx_bloc_fulltext (search_text), INDEX IDX_4FDFDC264B89032C (post_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE category (id BINARY(16) NOT NULL, name VARCHAR(100) NOT NULL, slug VARCHAR(120) NOT NULL, description LONGTEXT DEFAULT NULL, image VARCHAR(255) DEFAULT NULL, created_at DATETIME NOT NULL, updated_at DATETIME DEFAULT NULL, settings JSON DEFAULT NULL, UNIQUE INDEX UNIQ_64C19C1989D9B62 (slug), FULLTEXT INDEX idx_category_fulltext (name, description), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE cms_post_view (id BINARY(16) NOT NULL, visitor_hash VARCHAR(64) NOT NULL, viewed_date DATE NOT NULL, viewed_at DATETIME NOT NULL, post_id BINARY(16) NOT NULL, INDEX idx_post_view_date (viewed_date), UNIQUE INDEX uniq_post_visitor_daily (post_id, visitor_hash, viewed_date), INDEX IDX_F4CEACE84B89032C (post_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE cms_seo_metadata (id BINARY(16) NOT NULL, target_type VARCHAR(50) NOT NULL, target_identifier VARCHAR(180) NOT NULL, meta_title VARCHAR(70) DEFAULT NULL, meta_description VARCHAR(160) DEFAULT NULL, canonical_url VARCHAR(255) DEFAULT NULL, robots VARCHAR(50) DEFAULT \'index, follow\' NOT NULL, og_title VARCHAR(180) DEFAULT NULL, og_description VARCHAR(255) DEFAULT NULL, og_image VARCHAR(255) DEFAULT NULL, geo_region VARCHAR(100) DEFAULT NULL, geo_placename VARCHAR(100) DEFAULT NULL, geo_position VARCHAR(50) DEFAULT NULL, json_ld_schema JSON DEFAULT NULL, created_at DATETIME NOT NULL, updated_at DATETIME DEFAULT NULL, settings JSON DEFAULT NULL, UNIQUE INDEX uniq_seo_target (target_type, target_identifier), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE cms_setting (id BINARY(16) NOT NULL, setting_key VARCHAR(100) NOT NULL, setting_value LONGTEXT DEFAULT NULL, type VARCHAR(50) DEFAULT \'string\' NOT NULL, created_at DATETIME NOT NULL, updated_at DATETIME DEFAULT NULL, settings JSON DEFAULT NULL, UNIQUE INDEX UNIQ_C198B7895FA1E697 (setting_key), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE comment (id BINARY(16) NOT NULL, content LONGTEXT NOT NULL, status VARCHAR(20) DEFAULT \'pending\' NOT NULL, flags INT DEFAULT 0 NOT NULL, created_at DATETIME NOT NULL, updated_at DATETIME DEFAULT NULL, settings JSON DEFAULT NULL, owner_id BINARY(16) NOT NULL, post_id BINARY(16) NOT NULL, parent_id BINARY(16) DEFAULT NULL, INDEX idx_comment_status (status), INDEX idx_comment_flags (flags), INDEX IDX_9474526C7E3C61F9 (owner_id), INDEX IDX_9474526C4B89032C (post_id), INDEX IDX_9474526C727ACA70 (parent_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE post (id BINARY(16) NOT NULL, title VARCHAR(180) NOT NULL, slug VARCHAR(200) NOT NULL, thumbnail VARCHAR(255) DEFAULT NULL, excerpt LONGTEXT DEFAULT NULL, status VARCHAR(20) DEFAULT \'draft\' NOT NULL, published_at DATETIME DEFAULT NULL, trashed_at DATETIME DEFAULT NULL, created_at DATETIME NOT NULL, updated_at DATETIME DEFAULT NULL, views_count INT DEFAULT 0 NOT NULL, settings JSON DEFAULT NULL, likes_count INT DEFAULT 0 NOT NULL, flags INT DEFAULT 0 NOT NULL, author_id BINARY(16) DEFAULT NULL, category_id BINARY(16) DEFAULT NULL, UNIQUE INDEX UNIQ_5A8A6C8D989D9B62 (slug), INDEX idx_post_status (status), INDEX idx_post_trashed_at (trashed_at), INDEX idx_post_flags (flags), INDEX idx_post_likes (likes_count), FULLTEXT INDEX idx_post_fulltext (title, excerpt), INDEX IDX_5A8A6C8DF675F31B (author_id), INDEX IDX_5A8A6C8D12469DE2 (category_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE post_tag (post_id BINARY(16) NOT NULL, tag_id BINARY(16) NOT NULL, INDEX IDX_5ACE3AF04B89032C (post_id), INDEX IDX_5ACE3AF0BAD26311 (tag_id), PRIMARY KEY (post_id, tag_id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE post_media (id BINARY(16) NOT NULL, original_name VARCHAR(255) NOT NULL, nice_name VARCHAR(255) DEFAULT NULL, file_path VARCHAR(255) NOT NULL, mime_type VARCHAR(100) NOT NULL, type VARCHAR(30) DEFAULT NULL, extension VARCHAR(10) NOT NULL, size INT NOT NULL, created_at DATETIME NOT NULL, updated_at DATETIME DEFAULT NULL, is_pinned TINYINT DEFAULT 0 NOT NULL, settings JSON DEFAULT NULL, alt VARCHAR(255) DEFAULT NULL, post_id BINARY(16) DEFAULT NULL, owner_id BINARY(16) DEFAULT NULL, INDEX IDX_FD372DE34B89032C (post_id), INDEX IDX_FD372DE37E3C61F9 (owner_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE tag (id BINARY(16) NOT NULL, name VARCHAR(50) NOT NULL, slug VARCHAR(80) NOT NULL, color VARCHAR(20) DEFAULT NULL, description LONGTEXT DEFAULT NULL, created_at DATETIME NOT NULL, updated_at DATETIME DEFAULT NULL, settings JSON DEFAULT NULL, owner_id BINARY(16) DEFAULT NULL, UNIQUE INDEX UNIQ_389B783989D9B62 (slug), FULLTEXT INDEX idx_tag_fulltext (name, description), UNIQUE INDEX uniq_user_tag_color (owner_id, color), INDEX IDX_389B7837E3C61F9 (owner_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE user (id BINARY(16) NOT NULL, email VARCHAR(180) NOT NULL, role VARCHAR(50) NOT NULL, password VARCHAR(255) NOT NULL, username VARCHAR(90) NOT NULL, firstname VARCHAR(80) DEFAULT NULL, lastname VARCHAR(80) DEFAULT NULL, avatar VARCHAR(255) DEFAULT NULL, is_verified TINYINT DEFAULT NULL, email_verified_at DATETIME DEFAULT NULL, created_at DATETIME NOT NULL, updated_at DATETIME DEFAULT NULL, settings JSON DEFAULT NULL, FULLTEXT INDEX idx_user_fulltext (username, firstname, lastname), UNIQUE INDEX UNIQ_IDENTIFIER_EMAIL (email), UNIQUE INDEX UNIQ_IDENTIFIER_USERNAME (username), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE user_request (id BINARY(16) NOT NULL, code VARCHAR(20) DEFAULT NULL, token VARCHAR(128) DEFAULT NULL, type VARCHAR(40) NOT NULL, payload JSON DEFAULT NULL, is_used TINYINT DEFAULT 0 NOT NULL, expires_at DATETIME NOT NULL, created_at DATETIME NOT NULL, updated_at DATETIME DEFAULT NULL, user_id BINARY(16) NOT NULL, INDEX idx_user_request_token (token), INDEX idx_user_request_code (code), INDEX IDX_639A9195A76ED395 (user_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('ALTER TABLE bloc_content ADD CONSTRAINT FK_4FDFDC264B89032C FOREIGN KEY (post_id) REFERENCES post (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE cms_post_view ADD CONSTRAINT FK_F4CEACE84B89032C FOREIGN KEY (post_id) REFERENCES post (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE comment ADD CONSTRAINT FK_9474526C7E3C61F9 FOREIGN KEY (owner_id) REFERENCES user (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE comment ADD CONSTRAINT FK_9474526C4B89032C FOREIGN KEY (post_id) REFERENCES post (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE comment ADD CONSTRAINT FK_9474526C727ACA70 FOREIGN KEY (parent_id) REFERENCES comment (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE post ADD CONSTRAINT FK_5A8A6C8DF675F31B FOREIGN KEY (author_id) REFERENCES user (id) ON DELETE SET NULL');
        $this->addSql('ALTER TABLE post ADD CONSTRAINT FK_5A8A6C8D12469DE2 FOREIGN KEY (category_id) REFERENCES category (id) ON DELETE SET NULL');
        $this->addSql('ALTER TABLE post_tag ADD CONSTRAINT FK_5ACE3AF04B89032C FOREIGN KEY (post_id) REFERENCES post (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE post_tag ADD CONSTRAINT FK_5ACE3AF0BAD26311 FOREIGN KEY (tag_id) REFERENCES tag (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE post_media ADD CONSTRAINT FK_FD372DE34B89032C FOREIGN KEY (post_id) REFERENCES post (id) ON DELETE SET NULL');
        $this->addSql('ALTER TABLE post_media ADD CONSTRAINT FK_FD372DE37E3C61F9 FOREIGN KEY (owner_id) REFERENCES user (id) ON DELETE SET NULL');
        $this->addSql('ALTER TABLE tag ADD CONSTRAINT FK_389B7837E3C61F9 FOREIGN KEY (owner_id) REFERENCES user (id) ON DELETE SET NULL');
        $this->addSql('ALTER TABLE user_request ADD CONSTRAINT FK_639A9195A76ED395 FOREIGN KEY (user_id) REFERENCES user (id) ON DELETE CASCADE');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE bloc_content DROP FOREIGN KEY FK_4FDFDC264B89032C');
        $this->addSql('ALTER TABLE cms_post_view DROP FOREIGN KEY FK_F4CEACE84B89032C');
        $this->addSql('ALTER TABLE comment DROP FOREIGN KEY FK_9474526C7E3C61F9');
        $this->addSql('ALTER TABLE comment DROP FOREIGN KEY FK_9474526C4B89032C');
        $this->addSql('ALTER TABLE comment DROP FOREIGN KEY FK_9474526C727ACA70');
        $this->addSql('ALTER TABLE post DROP FOREIGN KEY FK_5A8A6C8DF675F31B');
        $this->addSql('ALTER TABLE post DROP FOREIGN KEY FK_5A8A6C8D12469DE2');
        $this->addSql('ALTER TABLE post_tag DROP FOREIGN KEY FK_5ACE3AF04B89032C');
        $this->addSql('ALTER TABLE post_tag DROP FOREIGN KEY FK_5ACE3AF0BAD26311');
        $this->addSql('ALTER TABLE post_media DROP FOREIGN KEY FK_FD372DE34B89032C');
        $this->addSql('ALTER TABLE post_media DROP FOREIGN KEY FK_FD372DE37E3C61F9');
        $this->addSql('ALTER TABLE tag DROP FOREIGN KEY FK_389B7837E3C61F9');
        $this->addSql('ALTER TABLE user_request DROP FOREIGN KEY FK_639A9195A76ED395');
        $this->addSql('DROP TABLE bloc_content');
        $this->addSql('DROP TABLE category');
        $this->addSql('DROP TABLE cms_post_view');
        $this->addSql('DROP TABLE cms_seo_metadata');
        $this->addSql('DROP TABLE cms_setting');
        $this->addSql('DROP TABLE comment');
        $this->addSql('DROP TABLE post');
        $this->addSql('DROP TABLE post_tag');
        $this->addSql('DROP TABLE post_media');
        $this->addSql('DROP TABLE tag');
        $this->addSql('DROP TABLE user');
        $this->addSql('DROP TABLE user_request');
    }
}
