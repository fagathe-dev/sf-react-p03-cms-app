<?php

declare(strict_types=1);

namespace Fagathe\CmsCore\Entity;

use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Fagathe\CmsCore\Contract\TaxonomySeoInterface;
use Fagathe\CmsCore\Enum\ColorEnum;
use Fagathe\CmsCore\Repository\TagRepository;
use Fagathe\CmsCore\Trait\ConfigurableEntityTrait;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Bridge\Doctrine\Validator\Constraints\UniqueEntity;
use Symfony\Component\Serializer\Attribute\Groups;
use Symfony\Component\Uid\Uuid;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: TagRepository::class)]
#[ORM\UniqueConstraint(name: 'uniq_user_tag_color', fields: ['owner', 'color'])]
#[ORM\Index(name: 'idx_tag_fulltext', columns: ['name', 'description'], flags: ['fulltext'])]
#[UniqueEntity(fields: ['slug'], message: 'Ce slug de tag est déjà utilisé.')]
#[UniqueEntity(fields: ['color', 'owner'], message: 'Vous avez déjà un tag avec cette couleur: {{ value }}.')]
class Tag implements TaxonomySeoInterface
{
    use ConfigurableEntityTrait;

    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME, unique: true)]
    #[Groups(['tag.list', 'tag.read', 'post.read', 'post.list'])]
    private ?Uuid $id = null;

    #[ORM\Column(length: 50)]
    #[Assert\NotBlank(message: 'Le nom est obligatoire !')]
    #[Groups(['tag.list', 'tag.read', 'post.read', 'post.list'])]
    private ?string $name = null;

    #[ORM\Column(length: 80, unique: true)]
    #[Groups(['tag.list', 'tag.read', 'post.read', 'post.list'])]
    private ?string $slug = null;

    #[ORM\Column(length: 20, nullable: true, enumType: ColorEnum::class)]
    #[Groups(['tag.list', 'tag.read', 'post.read', 'post.list'])]
    private ?ColorEnum $color = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Groups(['tag.list', 'tag.read'])]
    private ?string $description = null;

    #[ORM\Column]
    #[Groups(['tag.read'])]
    private ?\DateTimeImmutable $createdAt = null;

    #[ORM\Column(nullable: true)]
    #[Groups(['tag.read'])]
    private ?\DateTimeImmutable $updatedAt = null;

    #[ORM\ManyToOne(inversedBy: 'tags')]
    #[ORM\JoinColumn(nullable: true, onDelete: 'SET NULL')]
    private ?User $owner = null;

    /**
     * @var Collection<int, Post>
     */
    #[ORM\ManyToMany(targetEntity: Post::class, mappedBy: 'tags')]
    private Collection $posts;

    public function __construct()
    {
        $this->id = Uuid::v7();
        $this->createdAt = new \DateTimeImmutable();
        $this->settings = static::getDefaultSettings();
        $this->posts = new ArrayCollection();
    }

    public function getId(): ?Uuid
    {
        return $this->id;
    }

    public function getName(): ?string
    {
        return $this->name;
    }

    public function setName(?string $name): static
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

    public function getColor(): ?ColorEnum
    {
        return $this->color;
    }

    public function setColor(ColorEnum|string|null $color): static
    {
        if (is_string($color)) {
            $color = ColorEnum::tryFrom($color);
        }

        $this->color = $color;

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

    public function getOwner(): ?User
    {
        return $this->owner;
    }

    public function setOwner(?User $owner): static
    {
        $this->owner = $owner;

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
