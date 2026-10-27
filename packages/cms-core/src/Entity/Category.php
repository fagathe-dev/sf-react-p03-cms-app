<?php

declare(strict_types=1);

namespace Fagathe\CmsCore\Entity;

use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Fagathe\CmsCore\Contract\TaxonomySeoInterface;
use Fagathe\CmsCore\Repository\CategoryRepository;
use Fagathe\CmsCore\Trait\ConfigurableEntityTrait;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Bridge\Doctrine\Validator\Constraints\UniqueEntity;
use Symfony\Component\Serializer\Attribute\Groups;
use Symfony\Component\Uid\Uuid;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: CategoryRepository::class)]
#[ORM\Index(name: 'idx_category_fulltext', columns: ['name', 'description'], flags: ['fulltext'])]
#[UniqueEntity(fields: ['slug'], message: 'Ce slug de catégorie existe déjà.')]
class Category implements TaxonomySeoInterface
{
    use ConfigurableEntityTrait;

    public const DEFAULT_SETTINGS = [
        'icon' => null,
        'color' => null,
        'is_featured' => false,
    ];

    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME, unique: true)]
    #[Groups(['category.list', 'category.read', 'post.read', 'post.list'])]
    private ?Uuid $id = null;

    #[ORM\Column(length: 100)]
    #[Assert\NotBlank(message: 'Le nom de la catégorie est obligatoire.')]
    #[Groups(['category.list', 'category.read', 'post.read', 'post.list'])]
    private ?string $name = null;

    #[ORM\Column(length: 120, unique: true)]
    #[Groups(['category.list', 'category.read', 'post.read', 'post.list'])]
    private ?string $slug = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Groups(['category.list', 'category.read'])]
    private ?string $description = null;

    /**
     * Chemin relatif de l'image uploadée (ex: uploads/categories/{id}/image.webp), résolu en URL absolue par
     * FileUrlNormalizer. À défaut d'image, l'icône settings['icon'] est affichée.
     */
    #[ORM\Column(length: 255, nullable: true)]
    #[Groups(['category.list', 'category.read', 'post.read', 'post.list'])]
    private ?string $image = null;

    #[ORM\Column]
    #[Groups(['category.read'])]
    private ?\DateTimeImmutable $createdAt = null;

    #[ORM\Column(nullable: true)]
    #[Groups(['category.read'])]
    private ?\DateTimeImmutable $updatedAt = null;

    /**
     * @var Collection<int, Post>
     */
    #[ORM\OneToMany(targetEntity: Post::class, mappedBy: 'category')]
    private Collection $posts;

    public function __construct()
    {
        $this->id = Uuid::v7();
        $this->createdAt = new \DateTimeImmutable();
        $this->settings = static::getDefaultSettings();
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

    public function getName(): ?string
    {
        return $this->name;
    }

    public function setName(string $name): static
    {
        $this->name = $name;

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

    public function getDescription(): ?string
    {
        return $this->description;
    }

    public function setDescription(?string $description): static
    {
        $this->description = $description;

        return $this;
    }

    public function getImage(): ?string
    {
        return $this->image;
    }

    public function setImage(?string $image): static
    {
        $this->image = $image;

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

    /**
     * @return Collection<int, Post>
     */
    public function getPosts(): Collection
    {
        return $this->posts;
    }
}