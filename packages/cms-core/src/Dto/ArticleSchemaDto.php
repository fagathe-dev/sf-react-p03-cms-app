<?php

declare(strict_types=1);

namespace Fagathe\CmsCore\Dto;

use Symfony\Component\Validator\Constraints as Assert;

class ArticleSchemaDto
{
    #[Assert\NotBlank]
    public string $headline;

    #[Assert\NotBlank]
    public string $description;

    #[Assert\Url]
    public ?string $image = null;

    #[Assert\DateTime]
    public ?string $datePublished = null;

    #[Assert\DateTime]
    public ?string $dateModified = null;

    #[Assert\NotBlank]
    public string $authorName;
}
