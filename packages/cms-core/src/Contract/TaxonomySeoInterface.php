<?php

declare(strict_types=1);

namespace Fagathe\CmsCore\Contract;

interface TaxonomySeoInterface
{
    public function getName(): ?string;
    public function getSlug(): ?string;
    public function getDescription(): ?string;
}
