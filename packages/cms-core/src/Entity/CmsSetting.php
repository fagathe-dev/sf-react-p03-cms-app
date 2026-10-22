<?php

declare(strict_types=1);

namespace Fagathe\CmsCore\Entity;

use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Fagathe\CmsCore\Repository\CmsSettingRepository;
use Fagathe\CmsCore\Trait\ConfigurableEntityTrait;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Serializer\Attribute\Groups;
use Symfony\Component\Uid\Uuid;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: CmsSettingRepository::class)]
#[ORM\Table(name: 'cms_setting')]
class CmsSetting
{
    use ConfigurableEntityTrait;

    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME, unique: true)]
    #[Groups(['setting.read'])]
    private ?Uuid $id = null;

    #[ORM\Column(length: 100, unique: true)]
    #[Assert\NotBlank(message: 'La clé de configuration est obligatoire.')]
    #[Groups(['setting.read', 'setting.write'])]
    private string $settingKey;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Groups(['setting.read', 'setting.write'])]
    private ?string $settingValue = null;

    #[ORM\Column(length: 50, options: ['default' => 'string'])]
    #[Groups(['setting.read', 'setting.write'])]
    private string $type = 'string'; // string, boolean, integer, json

    #[ORM\Column]
    private ?\DateTimeImmutable $createdAt = null;

    #[ORM\Column(nullable: true)]
    private ?\DateTimeImmutable $updatedAt = null;

    public function __construct()
    {
        $this->id = Uuid::v7();
        $this->createdAt = new \DateTimeImmutable();
    }

    // Getters / Setters classiques...
}