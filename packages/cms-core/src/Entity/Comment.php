<?php

declare(strict_types=1);

namespace Fagathe\CmsCore\Entity;

use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Fagathe\CmsCore\Enum\CommentStatus;
use Fagathe\CmsCore\Repository\CommentRepository;
use Fagathe\CmsCore\Trait\ConfigurableEntityTrait;
use Fagathe\CmsCore\Trait\FlaggableTrait;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Serializer\Attribute\Groups;
use Symfony\Component\Uid\Uuid;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: CommentRepository::class)]
#[ORM\Index(name: 'idx_comment_status', columns: ['status'])]
#[ORM\Index(name: 'idx_comment_flags', columns: ['flags'])]
class Comment
{
    use ConfigurableEntityTrait, FlaggableTrait;

    /**
     * Seuil de signalements à partir duquel le commentaire repasse automatiquement en attente de modération.
     */
    public const AUTO_MODERATION_FLAG_THRESHOLD = 5;

    public const DEFAULT_SETTINGS = [
        'flagged_by'      => [], // map: [user_uuid => ['reason' => string, 'comment' => ?string, 'flagged_at' => string]]
        'moderation_note' => null,
        'moderated_by'    => null,
        'moderated_at'    => null,
        'is_edited'       => false,
    ];

    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME, unique: true)]
    #[Groups(['comment.read', 'comment.list', 'post.read'])]
    private ?Uuid $id = null;

    #[ORM\Column(type: Types::TEXT)]
    #[Assert\NotBlank(message: 'Le contenu du commentaire ne peut pas être vide.')]
    #[Assert\Length(
        min: 2,
        max: 5000,
        minMessage: 'Le commentaire doit contenir au moins {{ limit }} caractères.',
        maxMessage: 'Le commentaire ne peut pas dépasser {{ limit }} caractères.'
    )]
    #[Groups(['comment.read', 'comment.list', 'post.read'])]
    private ?string $content = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    #[Assert\NotNull(message: 'Un commentaire doit obligatoirement être rattaché à un utilisateur connecté.')]
    #[Groups(['comment.read', 'comment.list', 'post.read'])]
    private ?User $owner = null;

    #[ORM\ManyToOne(targetEntity: Post::class, inversedBy: 'comments')]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    #[Assert\NotNull(message: 'L\'article cible est obligatoire.')]
    private ?Post $post = null;

    #[ORM\ManyToOne(targetEntity: self::class, inversedBy: 'replies')]
    #[ORM\JoinColumn(nullable: true, onDelete: 'CASCADE')]
    private ?self $parent = null;

    /**
     * @var Collection<int, self>
     */
    #[ORM\OneToMany(targetEntity: self::class, mappedBy: 'parent', cascade: ['remove'], orphanRemoval: true)]
    #[ORM\OrderBy(['createdAt' => 'ASC'])]
    #[Groups(['comment.read', 'post.read'])]
    private Collection $replies;

    #[ORM\Column(length: 20, enumType: CommentStatus::class, options: ['default' => CommentStatus::PENDING->value])]
    #[Groups(['comment.read', 'comment.list', 'post.read'])]
    private CommentStatus $status = CommentStatus::PENDING;

    /**
     * Nombre de signalements reçus par ce commentaire.
     */
    #[ORM\Column(type: Types::INTEGER, options: ['default' => 0])]
    #[Groups(['comment.read', 'comment.list', 'post.read'])]
    private int $flags = 0;

    #[ORM\Column]
    #[Groups(['comment.read', 'comment.list', 'post.read'])]
    private ?\DateTimeImmutable $createdAt = null;

    #[ORM\Column(nullable: true)]
    #[Groups(['comment.read', 'post.read'])]
    private ?\DateTimeImmutable $updatedAt = null;

    public function __construct()
    {
        $this->id = Uuid::v7();
        $this->createdAt = new \DateTimeImmutable();
        $this->settings = static::getDefaultSettings();
        $this->replies = new ArrayCollection();
    }

    /**
     * @return array<string, mixed>
     */
    protected static function getDefaultSettings(): array
    {
        return self::DEFAULT_SETTINGS;
    }

    public function getId(): ?Uuid
    {
        return $this->id;
    }

    public function getContent(): ?string
    {
        return $this->content;
    }

    public function setContent(string $content): static
    {
        $this->content = $content;

        return $this;
    }

    public function getOwner(): ?User
    {
        return $this->owner;
    }

    public function setOwner(User $owner): static
    {
        $this->owner = $owner;

        return $this;
    }

    public function getPost(): ?Post
    {
        return $this->post;
    }

    public function setPost(?Post $post): static
    {
        $this->post = $post;

        return $this;
    }

    /**
     * Article commenté, réduit à son identité (la relation complète n'est pas sérialisée).
     *
     * @return array{id: string, title: string|null, slug: string|null}|null
     */
    #[Groups(['comment.read'])]
    public function getPostSummary(): ?array
    {
        if ($this->post === null) {
            return null;
        }

        return [
            'id'    => (string) $this->post->getId(),
            'title' => $this->post->getTitle(),
            'slug'  => $this->post->getSlug(),
        ];
    }

    public function getParent(): ?self
    {
        return $this->parent;
    }

    public function setParent(?self $parent): static
    {
        $this->parent = $parent;

        return $this;
    }

    /**
     * @return Collection<int, self>
     */
    public function getReplies(): Collection
    {
        return $this->replies;
    }

    public function getStatus(): CommentStatus
    {
        return $this->status;
    }

    public function setStatus(CommentStatus|string $status): static
    {
        if (is_string($status)) {
            $status = CommentStatus::from($status);
        }

        $this->status = $status;

        return $this;
    }

    public function getFlags(): int
    {
        return $this->flags;
    }

    public function setFlags(int $flags): static
    {
        $this->flags = max(0, $flags);

        return $this;
    }

    public function hasBeenFlaggedBy(User $user): bool
    {
        $userId = (string) $user->getId();
        $flaggedBy = (array) $this->getSetting('flagged_by', []);

        return isset($flaggedBy[$userId]);
    }

    /**
     * Ajoute un signalement d'un utilisateur connecté (1 seul signalement par utilisateur).
     * Retourne false si l'utilisateur a déjà signalé ce commentaire.
     */
    public function flagByUser(User $user, ?string $reason = null): bool
    {
        if ($this->hasBeenFlaggedBy($user)) {
            return false;
        }

        $userId = (string) $user->getId();
        $flaggedBy = (array) $this->getSetting('flagged_by', []);
        $flaggedBy[$userId] = [
            'reason'     => $reason !== null && trim($reason) !== '' ? trim($reason) : null,
            'flagged_at' => (new \DateTimeImmutable())->format(\DateTimeInterface::ATOM),
        ];

        $this->setSetting('flagged_by', $flaggedBy);
        $this->flags = count($flaggedBy);

        if ($this->flags >= self::AUTO_MODERATION_FLAG_THRESHOLD) {
            $this->status = CommentStatus::PENDING;
        }

        return true;
    }

    /**
     * Réinitialise les signalements (ex: après validation par un modérateur).
     */
    public function clearFlags(): static
    {
        $this->flags = 0;
        $this->setSetting('flagged_by', []);

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

    // ... [propriétés id, content, owner, post, parent, replies, status, createdAt, updatedAt] ...
    // (Tu peux retirer la propriété $flags et les méthodes getFlags/setFlags/hasBeenFlaggedBy/flagByUser/clearFlags
    // puisqu'elles viennent désormais de FlaggableTrait)

    protected function onFlagThresholdReached(): void
    {
        if ($this->flags >= self::AUTO_MODERATION_FLAG_THRESHOLD) {
            $this->status = CommentStatus::PENDING;
        }
    }
}
