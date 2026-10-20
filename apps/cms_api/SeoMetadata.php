<?php

namespace App\Entity;

use App\Enum\SeoTargetType;
use App\Repository\SeoMetadataRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Serializer\Attribute\Groups;
use Symfony\Component\Uid\Uuid;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: SeoMetadataRepository::class)]
#[ORM\Table(name: 'cms_seo_metadata')]
#[ORM\Index(name: 'idx_seo_target', columns: ['target_type', 'target_identifier'])]
class SeoMetadata
{
    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME, unique: true)]
    #[Groups(['seo.read', 'post.read'])]
    private ?Uuid $id = null;

    #[ORM\Column(length: 50, enumType: SeoTargetType::class)]
    #[Groups(['seo.read', 'post.read'])]
    private SeoTargetType $targetType;

    /**
     * Identifiant de la cible :
     * - Soit l'UUID d'un Post, Category, Tag, User
     * - Soit une chaîne textuelle pour les pages statiques (ex: 'home', 'contact')
     */
    #[ORM\Column(length: 180)]
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

    #[ORM\Column(length: 50, options: ['default' => 'index, follow'])]
    #[Groups(['seo.read', 'post.read'])]
    private string $robots = 'index, follow';

    // --- OpenGraph (Facebook, LinkedIn, Discord...) ---

    #[ORM\Column(length: 180, nullable: true)]
    #[Groups(['seo.read'])]
    private ?string $ogTitle = null;

    #[ORM\Column(length: 255, nullable: true)]
    #[Groups(['seo.read'])]
    private ?string $ogDescription = null;

    #[ORM\Column(length: 255, nullable: true)]
    #[Groups(['seo.read'])]
    private ?string $ogImage = null;

    // --- Données Géographiques / Local SEO (pour l'éditeur ou l'entreprise) ---

    #[ORM\Column(length: 100, nullable: true)]
    #[Groups(['seo.read'])]
    private ?string $geoRegion = null; // ex: 'FR-75' ou 'FR'

    #[ORM\Column(length: 100, nullable: true)]
    #[Groups(['seo.read'])]
    private ?string $geoPlacename = null; // ex: 'Paris'

    #[ORM\Column(length: 50, nullable: true)]
    #[Groups(['seo.read'])]
    private ?string $geoPosition = null; // ex: '48.8566;2.3522' (Latitude;Longitude)

    /**
     * Schéma JSON-LD brut spécifique ou sur-mesure pour cette page.
     * @var array<string, mixed>|null
     */
    #[ORM\Column(type: Types::JSON, nullable: true)]
    #[Groups(['seo.read'])]
    private ?array $jsonLdSchema = null;

    #[ORM\Column]
    private ?\DateTimeImmutable $createdAt = null;

    #[ORM\Column(nullable: true)]
    private ?\DateTimeImmutable $updatedAt = null;

    public function __construct()
    {
        $this->id = Uuid::v7();
        $this->createdAt = new \DateTimeImmutable();
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

    public function setRobots(string $robots): static
    {
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
        return $this->position;
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
