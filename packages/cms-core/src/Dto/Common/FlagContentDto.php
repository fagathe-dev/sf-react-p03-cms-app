<?php

declare(strict_types=1);

namespace Fagathe\CmsCore\Dto\Common;

use Fagathe\CmsCore\Enum\Post\FlagReason;
use Symfony\Component\Validator\Constraints as Assert;
use Symfony\Component\Validator\Context\ExecutionContextInterface;

final class FlagContentDto
{
    #[Assert\NotBlank(message: 'Veuillez sélectionner un motif de signalement.')]
    #[Assert\Choice(
        callback: [FlagReason::class, 'values'],
        message: 'Le motif de signalement sélectionné est invalide.'
    )]
    public string $reason = FlagReason::OTHER->value;

    #[Assert\Length(
        max: 1000,
        maxMessage: 'Votre précision ne peut pas dépasser {{ limit }} caractères.'
    )]
    public ?string $comment = null;

    #[Assert\Callback]
    public function validateCommentWhenOther(ExecutionContextInterface $context): void
    {
        if ($this->reason === FlagReason::OTHER->value && ($this->comment === null || trim($this->comment) === '')) {
            $context->buildViolation('Veuillez préciser la raison de votre signalement en commentaire.')
                ->atPath('comment')
                ->addViolation();
        }
    }
}
