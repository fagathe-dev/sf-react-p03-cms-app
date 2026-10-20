<?php

declare(strict_types=1);

namespace Fagathe\CmsCore;

use Fagathe\CorePhp\Generator\TokenGenerator;
use Fagathe\CorePhp\Uploader\UploaderService;
use Symfony\Component\DependencyInjection\ContainerBuilder;
use Symfony\Component\DependencyInjection\Loader\Configurator\ContainerConfigurator;
use Symfony\Component\HttpKernel\Bundle\AbstractBundle;

class CmsCoreBundle extends AbstractBundle
{
    public function loadExtension(
        array $config,
        ContainerConfigurator $container,
        ContainerBuilder $builder
    ): void {
        $services = $container->services()
            ->defaults()
            ->autowire()
            ->autoconfigure();

        // Services utilitaires de fagathe-dev/core-php requis par tes services
        if (!$builder->hasDefinition(TokenGenerator::class)) {
            $services->set(TokenGenerator::class);
        }

        if (!$builder->hasDefinition(UploaderService::class)) {
            $services->set(UploaderService::class);
        }

        // Chargement automatique des Services et Generators de cms-core
        $services->load('Fagathe\\CmsCore\\', __DIR__ . '/')
            ->exclude([
                __DIR__ . '/Contract',
                __DIR__ . '/Dto',
                __DIR__ . '/Entity',
                __DIR__ . '/Enum',
                __DIR__ . '/CmsCoreBundle.php',
            ]);
    }
}
