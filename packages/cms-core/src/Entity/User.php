<?php

declare(strict_types=1);

namespace Fagathe\CmsCore\Entity;

use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Fagathe\CmsCore\Enum\Auth\UserRole;
use Fagathe\CmsCore\Repository\UserRepository;
use Fagathe\CmsCore\Trait\ConfigurableEntityTrait;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Bridge\Doctrine\Validator\Constraints\UniqueEntity;
use Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface;
use Symfony\Component\Security\Core\User\UserInterface;
use Symfony\Component\Serializer\Attribute\Groups;
use Symfony\Component\Uid\Uuid;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: UserRepository::class)]
#[ORM\UniqueConstraint(name: 'UNIQ_IDENTIFIER_EMAIL', fields: ['email'])]
#[ORM\UniqueConstraint(name: 'UNIQ_IDENTIFIER_USERNAME', fields: ['username'])]
#[ORM\Index(name: 'idx_user_fulltext', columns: ['username', 'firstname', 'lastname'], flags: ['fulltext'])]
#[UniqueEntity(fields: ['email'], message: 'Cette adresse email est déjà utilisée.')]
#[UniqueEntity(fields: ['username'], message: 'Ce nom d\'utilisateur est déjà pris.')]
class User implements UserInterface, PasswordAuthenticatedUserInterface
{
    use ConfigurableEntityTrait;

    public const DEFAULT_SETTINGS = [
        'bio' => null,
        'website' => null,
        'email_notifications' => true,
    ];

    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME, unique: true)]
    #[Groups(['user.read', 'post.read', 'post.list', 'comment.read'])]
    private ?Uuid $id = null;

    #[ORM\Column(length: 180)]
    #[Assert\Email(message: 'Cette adresse e-mail est invalide !')]
    #[Assert\NotBlank(message: 'L\'adresse e-mail est obligatoire')]
    #[Groups(['user.read'])]
    private ?string $email = null;

    #[ORM\Column(length: 50, enumType: UserRole::class)]
    #[Groups(['user.read'])]
    private UserRole $role = UserRole::ROLE_USER;

    #[ORM\Column]
    #[Assert\Regex(
        pattern: '#^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).{8,}$#',
        message: 'Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre avec au moins 8 caractères !'
    )]
    #[Assert\NotBlank(message: 'Ce champ est obligatoire !')]
    private ?string $password = null;

    #[ORM\Column(length: 90)]
    #[Assert\NotBlank(message: 'Le nom d\'utilisateur est obligatoire')]
    #[Assert\Length(min: 3, max: 90)]
    #[Groups(['user.read', 'post.read', 'post.list', 'comment.read'])]
    private ?string $username = null;

    #[ORM\Column(length: 80, nullable: true)]
    #[Groups(['user.read', 'post.read', 'post.list'])]
    private ?string $firstname = null;

    #[ORM\Column(length: 80, nullable: true)]
    #[Groups(['user.read', 'post.read', 'post.list'])]
    private ?string $lastname = null;

    #[ORM\Column(length: 255, nullable: true)]
    #[Groups(['user.read', 'post.read', 'post.list', 'comment.read'])]
    private ?string $avatar = null;

    #[ORM\Column(nullable: true)]
    #[Groups(['user.read'])]
    private ?bool $isVerified = false;

    #[ORM\Column(nullable: true)]
    #[Groups(['user.read'])]
    private ?\DateTimeImmutable $emailVerifiedAt = null;

    #[ORM\Column]
    #[Groups(['user.read'])]
    private ?\DateTimeImmutable $createdAt = null;

    #[ORM\Column(nullable: true)]
    #[Groups(['user.read'])]
    private ?\DateTimeImmutable $updatedAt = null;

    /**
     * @var Collection<int, Tag>
     */
    #[ORM\OneToMany(targetEntity: Tag::class, mappedBy: 'owner', cascade: ['remove', 'persist'], orphanRemoval: true)]
    private Collection $tags;

    /**
     * @var Collection<int, Post>
     */
    #[ORM\OneToMany(targetEntity: Post::class, mappedBy: 'author')]
    private Collection $posts;

    #[Groups(['user.read', 'post.read', 'post.list', 'comment.read'])]
    private ?string $displayName = null;

    public function __construct()
    {
        $this->id = Uuid::v7();
        $this->createdAt = new \DateTimeImmutable();
        $this->settings = static::getDefaultSettings();
        $this->tags = new ArrayCollection();
        $this->posts = new ArrayCollection();
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

    public function getEmail(): ?string
    {
        return $this->email;
    }

    public function setEmail(string $email): static
    {
        $this->email = $email;

        return $this;
    }

    public function getUserIdentifier(): string
    {
        return (string) $this->email;
    }

    public function getRole(): UserRole
    {
        return $this->role;
    }

    public function setRole(UserRole $role): static
    {
        $this->role = $role;

        return $this;
    }

    public function getRoles(): array
    {
        return array_unique([$this->role->value]);
    }

    public function getPassword(): ?string
    {
        return $this->password;
    }

    public function setPassword(string $password): static
    {
        $this->password = $password;

        return $this;
    }

    public function __serialize(): array
    {
        $data = (array) $this;
        $data["\0" . self::class . "\0password"] = hash('crc32c', (string) $this->password);

        return $data;
    }

    #[\Deprecated]
    public function eraseCredentials(): void {}

    public function getUsername(): ?string
    {
        return $this->username;
    }

    public function setUsername(string $username): static
    {
        $this->username = $username;

        return $this;
    }

    public function getFirstname(): ?string
    {
        return $this->firstname;
    }

    public function setFirstname(?string $firstname): static
    {
        $this->firstname = $firstname;

        return $this;
    }

    public function getLastname(): ?string
    {
        return $this->lastname;
    }

    public function setLastname(?string $lastname): static
    {
        $this->lastname = $lastname;

        return $this;
    }

    public function getAvatar(): ?string
    {
        return $this->avatar;
    }

    public function setAvatar(?string $avatar): static
    {
        $this->avatar = $avatar;

        return $this;
    }

    public function isVerified(): ?bool
    {
        return $this->isVerified;
    }

    public function setIsVerified(?bool $isVerified): static
    {
        $this->isVerified = $isVerified;

        return $this;
    }

    public function getEmailVerifiedAt(): ?\DateTimeImmutable
    {
        return $this->emailVerifiedAt;
    }

    public function setEmailVerifiedAt(?\DateTimeImmutable $emailVerifiedAt): static
    {
        $this->emailVerifiedAt = $emailVerifiedAt;

        return $this;
    }

    public function isEmailVerified(): bool
    {
        return $this->emailVerifiedAt !== null;
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
            $tag->setOwner($this);
        }

        return $this;
    }

    public function removeTag(Tag $tag): static
    {
        if ($this->tags->removeElement($tag) && $tag->getOwner() === $this) {
            $tag->setOwner(null);
        }

        return $this;
    }

    /**
     * @return Collection<int, Post>
     */
    public function getPosts(): Collection
    {
        return $this->posts;
    }

    public function addPost(Post $post): static
    {
        if (!$this->posts->contains($post)) {
            $this->posts->add($post);
            $post->setAuthor($this);
        }

        return $this;
    }

    public function removePost(Post $post): static
    {
        if ($this->posts->removeElement($post) && $post->getAuthor() === $this) {
            $post->setAuthor(null);
        }

        return $this;
    }

    public function getDisplayName(): ?string
    {
        if (!empty($this->firstname) && !empty($this->lastname)) {
            return ucfirst($this->firstname) . ' ' . strtoupper($this->lastname);
        }

        if (!empty($this->username)) {
            return '@' . ($this->username ?? 'utilisateur');
        }

        return null;
    }

    public function setDisplayName(): static
    {
        $this->displayName = $this->getDisplayName();

        return $this;
    }
}
