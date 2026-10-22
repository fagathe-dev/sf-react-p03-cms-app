<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20261022021952 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE bloc_content ADD settings JSON DEFAULT NULL');
        $this->addSql('ALTER TABLE category ADD settings JSON DEFAULT NULL');
        $this->addSql('ALTER TABLE cms_seo_metadata DROP INDEX idx_seo_target, ADD UNIQUE INDEX uniq_seo_target (target_type, target_identifier)');
        $this->addSql('ALTER TABLE cms_seo_metadata ADD settings JSON DEFAULT NULL');
        $this->addSql('ALTER TABLE comment DROP FOREIGN KEY `FK_9474526C7E3C61F9`');
        $this->addSql('ALTER TABLE comment ADD flags INT DEFAULT 0 NOT NULL, ADD settings JSON DEFAULT NULL, DROP guest_name, CHANGE owner_id owner_id BINARY(16) NOT NULL');
        $this->addSql('ALTER TABLE comment ADD CONSTRAINT FK_9474526C7E3C61F9 FOREIGN KEY (owner_id) REFERENCES user (id) ON DELETE CASCADE');
        $this->addSql('CREATE INDEX idx_comment_status ON comment (status)');
        $this->addSql('CREATE INDEX idx_comment_flags ON comment (flags)');
        $this->addSql('ALTER TABLE post_media ADD settings JSON DEFAULT NULL');
        $this->addSql('ALTER TABLE tag ADD settings JSON DEFAULT NULL');
        $this->addSql('ALTER TABLE user ADD settings JSON DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE bloc_content DROP settings');
        $this->addSql('ALTER TABLE category DROP settings');
        $this->addSql('ALTER TABLE cms_seo_metadata DROP INDEX uniq_seo_target, ADD INDEX idx_seo_target (target_type, target_identifier)');
        $this->addSql('ALTER TABLE cms_seo_metadata DROP settings');
        $this->addSql('ALTER TABLE comment DROP FOREIGN KEY FK_9474526C7E3C61F9');
        $this->addSql('DROP INDEX idx_comment_status ON comment');
        $this->addSql('DROP INDEX idx_comment_flags ON comment');
        $this->addSql('ALTER TABLE comment ADD guest_name VARCHAR(100) DEFAULT NULL, DROP flags, DROP settings, CHANGE owner_id owner_id BINARY(16) DEFAULT NULL');
        $this->addSql('ALTER TABLE comment ADD CONSTRAINT `FK_9474526C7E3C61F9` FOREIGN KEY (owner_id) REFERENCES user (id) ON UPDATE NO ACTION ON DELETE SET NULL');
        $this->addSql('ALTER TABLE post_media DROP settings');
        $this->addSql('ALTER TABLE tag DROP settings');
        $this->addSql('ALTER TABLE user DROP settings');
    }
}
