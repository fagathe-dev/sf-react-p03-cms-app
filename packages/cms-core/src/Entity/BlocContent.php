<?php

declare(strict_types=1);

namespace Fagathe\CmsCore\Entity;

use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Fagathe\CmsCore\Enum\Post\BlockType;
use Fagathe\CmsCore\Repository\BlocContentRepository;
use Fagathe\CmsCore\Trait\ConfigurableEntityTrait;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Serializer\Attribute\Groups;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: BlocContentRepository::class)]
#[ORM\Index(name: 'idx_bloc_position', columns: ['position'])]
#[ORM\Index(name: 'idx_bloc_type', columns: ['type'])]
#[ORM\Index(name: 'idx_bloc_fulltext', columns: ['search_text'], flags: ['fulltext'])]
class BlocContent
{
    use ConfigurableEntityTrait;

    /**
     * Types de blocs dont le contenu JSON doit être extrait pour la recherche Full-Text.
     * Ouvert aux évolutions : il suffit d'ajouter un futur BlockType ici.
     */
    public const SEARCHABLE_TYPES = [
        BlockType::TEXT,
    ];

    /**
     * Clés JSON purement techniques à ignorer lors de l'extraction Full-Text.
     */
    private const IGNORED_SEARCH_KEYS = ['id', 'url', 'src', 'icon', 'language', 'className', 'align'];

    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME, unique: true)]
    #[Groups(['post.read', 'bloc.read'])]
    private ?Uuid $id = null;

    #[ORM\ManyToOne(targetEntity: Post::class, inversedBy: 'blocks')]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private ?Post $post = null;

    #[ORM\Column(length: 30, enumType: BlockType::class)]
    #[Groups(['post.read', 'bloc.read'])]
    private BlockType $type = BlockType::TEXT;

    #[ORM\Column(type: Types::INTEGER, options: ['default' => 1])]
    #[Groups(['post.read', 'bloc.read'])]
    private int $position = 1;

    /**
     * @var array<string, mixed>
     */
    #[ORM\Column(type: Types::JSON)]
    #[Groups(['post.read', 'bloc.read'])]
    private array $data = [];

    #[ORM\Column(name: 'search_text', type: Types::TEXT, nullable: true)]
    private ?string $searchText = null;

    #[ORM\Column]
    #[Groups(['post.read', 'bloc.read'])]
    private ?\DateTimeImmutable $createdAt = null;

    #[ORM\Column(nullable: true)]
    #[Groups(['post.read', 'bloc.read'])]
    private ?\DateTimeImmutable $updatedAt = null;

    public function __construct()
    {
        $this->id = Uuid::v7();
        $this->position = 1;
        $this->createdAt = new \DateTimeImmutable();
        $this->settings = static::getDefaultSettings();
    }

    public function getId(): ?Uuid
    {
        return $this->id;
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

    public function getType(): BlockType
    {
        return $this->type;
    }

    public function setType(BlockType|string $type): static
    {
        if (is_string($type)) {
            $type = BlockType::from($type);
        }

        $this->type = $type;
        $this->syncSearchText();

        return $this;
    }

    public function getPosition(): int
    {
        return $this->position;
    }

    public function setPosition(int $position): static
    {
        $this->position = max(1, $position);

        return $this;
    }

    /**
     * @return array<string, mixed>
     */
    public function getData(): array
    {
        return $this->data;
    }

    /**
     * @param array<string, mixed> $data
     */
    public function setData(array $data): static
    {
        $this->data = $data;
        $this->syncSearchText();

        return $this;
    }

    public function getSearchText(): ?string
    {
        return $this->searchText;
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

    public function isSearchable(): bool
    {
        return in_array($this->type, self::SEARCHABLE_TYPES, true);
    }

    private function syncSearchText(): void
    {
        if (!$this->isSearchable() || empty($this->data)) {
            $this->searchText = null;

            return;
        }

        $extractedStrings = [];
        array_walk_recursive($this->data, static function (mixed $value, int|string $key) use (&$extractedStrings): void {
            if (is_string($key) && in_array($key, self::IGNORED_SEARCH_KEYS, true)) {
                return;
            }
            if (is_string($value) && trim($value) !== '') {
                $clean = html_entity_decode(strip_tags($value), ENT_QUOTES | ENT_HTML5, 'UTF-8');
                $extractedStrings[] = trim(preg_replace('/\s+/', ' ', $clean) ?? '');
            }
        });

        $fullText = trim(implode(' ', array_filter($extractedStrings)));
        $this->searchText = $fullText !== '' ? $fullText : null;
    }
}
