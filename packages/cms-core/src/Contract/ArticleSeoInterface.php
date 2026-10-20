<?php

declare(strict_types=1);

namespace Fagathe\CmsCore\Contract;

interface ArticleSeoInterface
{
    public function getTitle(): ?string;
    public function getSlug(): ?string;
    public function getExcerpt(): ?string;
    public function getThumbnail(): ?string;
    public function getAuthorName(): string;
    public function getPublishedAt(): ?\DateTimeImmutable;
    public function getUpdatedAt(): ?\DateTimeImmutable;
}
