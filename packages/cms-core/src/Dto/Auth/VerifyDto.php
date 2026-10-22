<?php

declare(strict_types=1);

namespace Fagathe\CmsCore\Dto\Auth;

use Symfony\Component\Validator\Constraints as Assert;

final class VerifyOtpDto
{
    #[Assert\NotBlank(message: 'Le code OTP est obligatoire.')]
    #[Assert\Length(min: 4, max: 20)]
    public string $code = '';
}
