<?php

namespace App\Entity;

use Fagathe\CmsCore\Enum\PostStatus;
use App\Repository\PostRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Bridge\Doctrine\Validator\Constraints\UniqueEntity;
use Symfony\Component\Serializer\Attribute\Groups;
use Symfony\Component\Uid\Uuid;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: PostRepository::class)]
#[ORM\Index(name: 'idx_post_status', columns: ['status'])]
#[ORM\Index(name: 'idx_post_trashed_at', columns: ['trashed_at'])]
#[UniqueEntity(fields: ['slug'], message: 'Ce slug est déjà utilisé par un autre article.')]
class Post
{
    public const TRASH_RETENTION_DAYS = 30;

    public const DEFAULT_SETTINGS = [
        'allow_comments' => true,
        'show_toc' => true,
        'is_featured' => false,
        'seo_title' => null,
        'seo_description' => null,
    ];

    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME, unique: true)]
    #[Groups(['post.list', 'post.read'])]
    private ?Uuid $id = null;

    #[ORM\Column(length: 180)]
    #[Assert\NotBlank(message: 'Le titre est obligatoire !')]
    #[Groups(['post.list', 'post.read'])]
    private ?string $title = null;

    #[ORM\Column(length: 200, unique: true)]
    #[Assert\NotBlank(message: 'Le slug est obligatoire !')]
    #[Groups(['post.list', 'post.read'])]
    private ?string $slug = null;

    #[ORM\Column(length: 255, nullable: true)]
    #[Groups(['post.list', 'post.read'])]
    private ?string $thumbnail = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Groups(['post.list', 'post.read'])]
    private ?string $excerpt = null;

    #[ORM\Column(length: 20, enumType: PostStatus::class, options: ['default' => PostStatus::DRAFT->value])]
    #[Groups(['post.list', 'post.read'])]
    private PostStatus $status = PostStatus::DRAFT;

    /**
     * @var array<string, mixed>|null
     */
    #[ORM\Column(type: Types::JSON, nullable: true)]
    #[Groups(['post.read'])]
    private ?array $settings = self::DEFAULT_SETTINGS;

    #[ORM\ManyToOne(targetEntity: User::class, inversedBy: 'posts')]
    #[ORM\JoinColumn(nullable: true, onDelete: 'SET NULL')]
    #[Groups(['post.list', 'post.read'])]
    private ?User $author = null;

    #[ORM\ManyToOne(targetEntity: Category::class, inversedBy: 'posts')]
    #[ORM\JoinColumn(nullable: true, onDelete: 'SET NULL')]
    #[Groups(['post.list', 'post.read'])]
    private ?Category $category = null;

    /**
     * @var Collection<int, Tag>
     */
    #[ORM\ManyToMany(targetEntity: Tag::class, inversedBy: 'posts')]
    #[ORM\JoinTable(name: 'post_tag')]
    #[Groups(['post.list', 'post.read'])]
    private Collection $tags;

    /**
     * @var Collection<int, BlocContent>
     */
    #[ORM\OneToMany(
        targetEntity: BlocContent::class,
        mappedBy: 'post',
        cascade: ['persist', 'remove'],
        orphanRemoval: true
    )]
    #[ORM\OrderBy(['position' => 'ASC'])]
    #[Groups(['post.read'])]
    private Collection $blocks;

    /**
     * @var Collection<int, PostMedia>
     */
    #[ORM\OneToMany(
        targetEntity: PostMedia::class,
        mappedBy: 'post',
        cascade: ['persist', 'remove'],
        orphanRemoval: true
    )]
    #[Groups(['post.read'])]
    private Collection $medias;

    /**
     * @var Collection<int, Comment>
     */
    #[ORM\OneToMany(
        targetEntity: Comment::class,
        mappedBy: 'post',
        cascade: ['remove'],
        orphanRemoval: true
    )]
    #[ORM\OrderBy(['createdAt' => 'DESC'])]
    private Collection $comments;

    #[ORM\Column(nullable: true)]
    #[Groups(['post.list', 'post.read'])]
    private ?\DateTimeImmutable $publishedAt = null;

    /**
     * Date de mise à la corbeille (pour suppression définitive au bout de 30 jours).
     */
    #[ORM\Column(nullable: true)]
    #[Groups(['post.list', 'post.read'])]
    private ?\DateTimeImmutable $trashedAt = null;

    #[ORM\Column]
    #[Groups(['post.list', 'post.read'])]
    private ?\DateTimeImmutable $createdAt = null;

    #[ORM\Column(nullable: true)]
    #[Groups(['post.read'])]
    private ?\DateTimeImmutable $updatedAt = null;

    #[ORM\Column(type: Types::INTEGER, options: ['default' => 0])]
    #[Groups(['post.list', 'post.read'])]
    private int $viewsCount = 0;

    public function __construct()
    {
        $this->id = Uuid::v7();
        $this->createdAt = new \DateTimeImmutable();
        $this->tags = new ArrayCollection();
        $this->blocks = new ArrayCollection();
        $this->medias = new ArrayCollection();
        $this->comments = new ArrayCollection();
    }

    public function getId(): ?Uuid
    {
        return $this->id;
    }

    public function getTitle(): ?string
    {
        return $this->title;
    }

    public function setTitle(string $title): static
    {
        $this->title = $title;

        return $this;
    }

    public function getSlug(): ?string
    {
        return $this->slug;
    }

    public function setSlug(string $slug): static
    {
        $this->slug = $slug;

        return $this;
    }

    public function getThumbnail(): ?string
    {
        return $this->thumbnail;
    }

    public function setThumbnail(?string $thumbnail): static
    {
        $this->thumbnail = $thumbnail;

        return $this;
    }

    public function getExcerpt(): ?string
    {
        return $this->excerpt;
    }

    public function setExcerpt(?string $excerpt): static
    {
        $this->excerpt = $excerpt;

        return $this;
    }

    public function getStatus(): PostStatus
    {
        return $this->status;
    }

    public function setStatus(PostStatus|string $status): static
    {
        if (is_string($status)) {
            $status = PostStatus::from($status);
        }

        $this->status = $status;

        if ($status === PostStatus::PUBLISHED && $this->publishedAt === null) {
            $this->publishedAt = new \DateTimeImmutable();
        }

        if ($status === PostStatus::TRASH && $this->trashedAt === null) {
            $this->trashedAt = new \DateTimeImmutable();
        } elseif ($status !== PostStatus::TRASH) {
            $this->trashedAt = null;
        }

        return $this;
    }

    public function moveToTrash(): static
    {
        return $this->setStatus(PostStatus::TRASH);
    }

    public function restoreFromTrash(): static
    {
        return $this->setStatus(PostStatus::DRAFT);
    }

    public function isTrashed(): bool
    {
        return $this->status === PostStatus::TRASH;
    }

    /**
     * Vérifie si l'article est dans la corbeille depuis plus de 30 jours.
     */
    public function isPurgeable(): bool
    {
        if ($this->status !== PostStatus::TRASH || $this->trashedAt === null) {
            return false;
        }

        $expirationDate = $this->trashedAt->modify(sprintf('+%d days', self::TRASH_RETENTION_DAYS));

        return new \DateTimeImmutable() >= $expirationDate;
    }

    // -------------------------------------------------------------------------
    // Settings / Options (JSON)
    // -------------------------------------------------------------------------

    /**
     * @return array<string, mixed>
     */
    public function getSettings(): array
    {
        return array_replace(self::DEFAULT_SETTINGS, $this->settings ?? []);
    }

    /**
     * @param array<string, mixed>|null $settings
     */
    public function setSettings(?array $settings): static
    {
        $this->settings = array_replace(self::DEFAULT_SETTINGS, $settings ?? []);

        return $this;
    }

    public function getSetting(string $key, mixed $default = null): mixed
    {
        $merged = $this->getSettings();

        return $merged[$key] ?? $default;
    }

    public function getOption(string $key, mixed $default = null): mixed
    {
        return $this->getSetting($key, $default);
    }

    public function setSetting(string $key, mixed $value): static
    {
        $current = $this->getSettings();
        $current[$key] = $value;
        $this->settings = $current;

        return $this;
    }

    // -------------------------------------------------------------------------
    // Blocs de contenu (Position à 1 par défaut si premier bloc)
    // -------------------------------------------------------------------------

    /**
     * @return Collection<int, BlocContent>
     */
    public function getBlocks(): Collection
    {
        return $this->blocks;
    }

    public function addBlock(BlocContent $block): static
    {
        if (!$this->blocks->contains($block)) {
            if ($this->blocks->isEmpty()) {
                $block->setPosition(1);
            } elseif ($block->getPosition() <= 1 && $this->blocks->count() > 0) {
                $block->setPosition($this->blocks->count() + 1);
            }

            $this->blocks->add($block);
            $block->setPost($this);
        }

        return $this;
    }

    public function removeBlock(BlocContent $block): static
    {
        if ($this->blocks->removeElement($block)) {
            if ($block->getPost() === $this) {
                $block->setPost(null);
            }
            $this->reorderBlocks();
        }

        return $this;
    }

    public function reorderBlocks(): void
    {
        $pos = 1;
        foreach ($this->blocks as $block) {
            $block->setPosition($pos++);
        }
    }

    // -------------------------------------------------------------------------
    // Relations & Dates
    // -------------------------------------------------------------------------

    public function getAuthor(): ?User
    {
        return $this->author;
    }

    public function setAuthor(?User $author): static
    {
        $this->author = $author;

        return $this;
    }

    public function getCategory(): ?Category
    {
        return $this->category;
    }

    public function setCategory(?Category $category): static
    {
        $this->category = $category;

        return $this;
    }

    /**
     * @return Collection<int, Tag>
     */
    public function getTags(): Collection
    {
        return $this->tags;
    }

    public function addTag(Tag $tag): static
    {
        if (!$this->tags->contains($tag)) {
            $this->tags->add($tag);
        }

        return $this;
    }

    public function removeTag(Tag $tag): static
    {
        $this->tags->removeElement($tag);

        return $this;
    }

    /**
     * @return Collection<int, PostMedia>
     */
    public function getMedias(): Collection
    {
        return $this->medias;
    }

    public function addMedia(PostMedia $media): static
    {
        if (!$this->medias->contains($media)) {
            $this->medias->add($media);
            $media->setPost($this);
        }

        return $this;
    }

    public function removeMedia(PostMedia $media): static
    {
        if ($this->medias->removeElement($media) && $media->getPost() === $this) {
            $media->setPost(null);
        }

        return $this;
    }

    /**
     * @return Collection<int, Comment>
     */
    public function getComments(): Collection
    {
        return $this->comments;
    }

    public function getPublishedAt(): ?\DateTimeImmutable
    {
        return $this->publishedAt;
    }

    public function setPublishedAt(?\DateTimeImmutable $publishedAt): static
    {
        $this->publishedAt = $publishedAt;

        return $this;
    }

    public function getTrashedAt(): ?\DateTimeImmutable
    {
        return $this->trashedAt;
    }

    public function setTrashedAt(?\DateTimeImmutable $trashedAt): static
    {
        $this->trashedAt = $trashedAt;

        return $this;
    }

    public function getCreatedAt(): ?\DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function setCreatedAt(\DateTimeImmutable $createdAt): static
    {
        $this->createdAt = $createdAt;

        return $this;
    }

    public function getUpdatedAt(): ?\DateTimeImmutable
    {
        return $this->updatedAt;
    }

    public function setUpdatedAt(?\DateTimeImmutable $updatedAt): static
    {
        $this->updatedAt = $updatedAt;

        return $this;
    }

    public function getViewsCount(): int
    {
        return $this->viewsCount;
    }

    public function setViewsCount(int $viewsCount): static
    {
        $this->viewsCount = max(0, $viewsCount);

        return $this;
    }
}
