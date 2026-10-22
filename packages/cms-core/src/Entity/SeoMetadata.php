<?php

declare(strict_types=1);

namespace Fagathe\CmsCore\Entity;

use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Fagathe\CmsCore\Contract\SeoMetadataInterface;
use Fagathe\CmsCore\Enum\Seo\RobotsDirective;
use Fagathe\CmsCore\Enum\Seo\SeoTargetType;
use Fagathe\CmsCore\Repository\SeoMetadataRepository;
use Fagathe\CmsCore\Trait\ConfigurableEntityTrait;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Bridge\Doctrine\Validator\Constraints\UniqueEntity;
use Symfony\Component\Serializer\Attribute\Groups;
use Symfony\Component\Uid\Uuid;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: SeoMetadataRepository::class)]
#[ORM\Table(name: 'cms_seo_metadata')]
#[ORM\Index(name: 'idx_seo_target', columns: ['target_type', 'target_identifier'])]
#[ORM\UniqueConstraint(name: 'uniq_seo_target', columns: ['target_type', 'target_identifier'])]
#[UniqueEntity(
    fields: ['targetType', 'targetIdentifier'],
    message: 'Des métadonnées SEO existent déjà pour cette cible.'
)]
class SeoMetadata implements SeoMetadataInterface
{
    use ConfigurableEntityTrait;

    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME, unique: true)]
    #[Groups(['seo.read', 'post.read'])]
    private ?Uuid $id = null;

    #[ORM\Column(length: 50, enumType: SeoTargetType::class)]
    #[Groups(['seo.read', 'post.read'])]
    private SeoTargetType $targetType;

    #[ORM\Column(length: 180)]
    #[Assert\NotBlank(message: 'L\'identifiant de la cible SEO est obligatoire.')]
    #[Groups(['seo.read', 'post.read'])]
    private string $targetIdentifier;

    #[ORM\Column(length: 70, nullable: true)]
    #[Assert\Length(max: 70, maxMessage: 'Le meta title ne doit pas dépasser 70 caractères pour l\'affichage Google.')]
    #[Groups(['seo.read', 'post.read'])]
    private ?string $metaTitle = null;

    #[ORM\Column(length: 160, nullable: true)]
    #[Assert\Length(max: 160, maxMessage: 'La meta description ne doit pas dépasser 160 caractères.')]
    #[Groups(['seo.read', 'post.read'])]
    private ?string $metaDescription = null;

    #[ORM\Column(length: 255, nullable: true)]
    #[Groups(['seo.read', 'post.read'])]
    private ?string $canonicalUrl = null;

    #[ORM\Column(length: 50, options: ['default' => RobotsDirective::INDEX_FOLLOW->value])]
    #[Groups(['seo.read', 'post.read'])]
    private string $robots = RobotsDirective::INDEX_FOLLOW->value;

    #[ORM\Column(length: 180, nullable: true)]
    #[Groups(['seo.read'])]
    private ?string $ogTitle = null;

    #[ORM\Column(length: 255, nullable: true)]
    #[Groups(['seo.read'])]
    private ?string $ogDescription = null;

    #[ORM\Column(length: 255, nullable: true)]
    #[Groups(['seo.read'])]
    private ?string $ogImage = null;

    #[ORM\Column(length: 100, nullable: true)]
    #[Groups(['seo.read'])]
    private ?string $geoRegion = null;

    #[ORM\Column(length: 100, nullable: true)]
    #[Groups(['seo.read'])]
    private ?string $geoPlacename = null;

    #[ORM\Column(length: 50, nullable: true)]
    #[Groups(['seo.read'])]
    private ?string $geoPosition = null;

    /**
     * @var array<string, mixed>|null
     */
    #[ORM\Column(type: Types::JSON, nullable: true)]
    #[Groups(['seo.read'])]
    private ?array $jsonLdSchema = null;

    #[ORM\Column]
    #[Groups(['seo.read'])]
    private ?\DateTimeImmutable $createdAt = null;

    #[ORM\Column(nullable: true)]
    #[Groups(['seo.read'])]
    private ?\DateTimeImmutable $updatedAt = null;

    public function __construct()
    {
        $this->id = Uuid::v7();
        $this->createdAt = new \DateTimeImmutable();
        $this->settings = static::getDefaultSettings();
    }

    public function getId(): ?Uuid
    {
        return $this->id;
    }

    public function getTargetType(): SeoTargetType
    {
        return $this->targetType;
    }

    public function setTargetType(SeoTargetType|string $targetType): static
    {
        if (is_string($targetType)) {
            $targetType = SeoTargetType::from($targetType);
        }
        $this->targetType = $targetType;

        return $this;
    }

    public function getTargetIdentifier(): string
    {
        return $this->targetIdentifier;
    }

    public function setTargetIdentifier(string $targetIdentifier): static
    {
        $this->targetIdentifier = $targetIdentifier;

        return $this;
    }

    public function getMetaTitle(): ?string
    {
        return $this->metaTitle;
    }

    public function setMetaTitle(?string $metaTitle): static
    {
        $this->metaTitle = $metaTitle;

        return $this;
    }

    public function getMetaDescription(): ?string
    {
        return $this->metaDescription;
    }

    public function setMetaDescription(?string $metaDescription): static
    {
        $this->metaDescription = $metaDescription;

        return $this;
    }

    public function getCanonicalUrl(): ?string
    {
        return $this->canonicalUrl;
    }

    public function setCanonicalUrl(?string $canonicalUrl): static
    {
        $this->canonicalUrl = $canonicalUrl;

        return $this;
    }

    public function getRobots(): string
    {
        return $this->robots;
    }

    public function setRobots(RobotsDirective|string $robots): static
    {
        if ($robots instanceof RobotsDirective) {
            $robots = $robots->value;
        }
        $this->robots = $robots;

        return $this;
    }

    public function getOgTitle(): ?string
    {
        return $this->ogTitle;
    }

    public function setOgTitle(?string $ogTitle): static
    {
        $this->ogTitle = $ogTitle;

        return $this;
    }

    public function getOgDescription(): ?string
    {
        return $this->ogDescription;
    }

    public function setOgDescription(?string $ogDescription): static
    {
        $this->ogDescription = $ogDescription;

        return $this;
    }

    public function getOgImage(): ?string
    {
        return $this->ogImage;
    }

    public function setOgImage(?string $ogImage): static
    {
        $this->ogImage = $ogImage;

        return $this;
    }

    public function getGeoRegion(): ?string
    {
        return $this->geoRegion;
    }

    public function setGeoRegion(?string $geoRegion): static
    {
        $this->geoRegion = $geoRegion;

        return $this;
    }

    public function getGeoPlacename(): ?string
    {
        return $this->geoPlacename;
    }

    public function setGeoPlacename(?string $geoPlacename): static
    {
        $this->geoPlacename = $geoPlacename;

        return $this;
    }

    public function getGeoPosition(): ?string
    {
        return $this->geoPosition;
    }

    public function setGeoPosition(?string $geoPosition): static
    {
        $this->geoPosition = $geoPosition;

        return $this;
    }

    /**
     * @return array<string, mixed>|null
     */
    public function getJsonLdSchema(): ?array
    {
        return $this->jsonLdSchema;
    }

    /**
     * @param array<string, mixed>|null $jsonLdSchema
     */
    public function setJsonLdSchema(?array $jsonLdSchema): static
    {
        $this->jsonLdSchema = $jsonLdSchema;

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
}
