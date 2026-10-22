<?php

namespace Fagathe\CmsCore\Entity;

use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Fagathe\CmsCore\Repository\PostViewRepository;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: PostViewRepository::class)]
#[ORM\Table(name: 'cms_post_view')]
#[ORM\UniqueConstraint(name: 'uniq_post_visitor_daily', columns: ['post_id', 'visitor_hash', 'viewed_date'])]
#[ORM\Index(name: 'idx_post_view_date', columns: ['viewed_date'])]
class PostView
{
    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME, unique: true)]
    private ?Uuid $id = null;

    #[ORM\ManyToOne(targetEntity: Post::class)]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private ?Post $post = null;

    /**
     * Empreinte SHA-256 anonymisée du visiteur (IP + User-Agent + Secret).
     */
    #[ORM\Column(length: 64)]
    private string $visitorHash;

    /**
     * Date calendaire (Y-m-d) permettant d'autoriser 1 vue par visiteur et par jour.
     */
    #[ORM\Column(type: Types::DATE_IMMUTABLE)]
    private \DateTimeImmutable $viewedDate;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE)]
    private \DateTimeImmutable $viewedAt;

    public function __construct(Post $post, string $visitorHash)
    {
        $now = new \DateTimeImmutable();
        $this->id = Uuid::v7();
        $this->post = $post;
        $this->visitorHash = $visitorHash;
        $this->viewedDate = $now->setTime(0, 0, 0);
        $this->viewedAt = $now;
    }

    public function getId(): ?Uuid
    {
        return $this->id;
    }

    public function getPost(): ?Post
    {
        return $this->post;
    }

    public function getVisitorHash(): string
    {
        return $this->visitorHash;
    }

    public function getViewedDate(): \DateTimeImmutable
    {
        return $this->viewedDate;
    }

    public function getViewedAt(): \DateTimeImmutable
    {
        return $this->viewedAt;
    }
}
