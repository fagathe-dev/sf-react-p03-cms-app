<?php

declare(strict_types=1);

namespace Fagathe\CmsCore\Dto\Post;

use Fagathe\CmsCore\Enum\Post\BlockType;
use Symfony\Component\Validator\Constraints as Assert;

final class SaveBlocContentDto
{
    #[Assert\Uuid(message: 'L\'identifiant du bloc est invalide.')]
    public ?string $id = null;

    #[Assert\NotBlank(message: 'Le type de bloc est obligatoire.')]
    #[Assert\Choice(
        callback: [self::class, 'getAllowedBlockTypes'],
        message: 'Le type de bloc "{{ value }}" n\'est pas supporté.'
    )]
    public string $type = BlockType::TEXT->value;

    #[Assert\Positive(message: 'La position du bloc doit être supérieure ou égale à 1.')]
    public int $position = 1;

    /**
     * @var array<string, mixed>
     */
    #[Assert\Type('array')]
    public array $data = [];

    /**
     * @var array<string, mixed>|null
     */
    #[Assert\Type('array')]
    public ?array $settings = null;

    /**
     * @return string[]
     */
    public static function getAllowedBlockTypes(): array
    {
        return array_map(static fn(BlockType $case): string => $case->value, BlockType::cases());
    }
}
