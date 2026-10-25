<?php

declare(strict_types=1);

namespace Fagathe\CmsCore;

use DoctrineExtensions\Query\Mysql\MatchAgainst;
use Fagathe\CorePhp\Generator\TokenGenerator;
use Symfony\Component\Config\Definition\Configurator\DefinitionConfigurator;
use Symfony\Component\DependencyInjection\ContainerBuilder;
use Symfony\Component\DependencyInjection\Loader\Configurator\ContainerConfigurator;
use Symfony\Component\HttpKernel\Bundle\AbstractBundle;

class CmsCoreBundle extends AbstractBundle
{
    /**
     * Configuration `cms_core` de l'application hôte (ex. config/packages/cms_core.yaml) :
     *
     *     cms_core:
     *         default_uri: '%env(DEFAULT_URI)%'
     */
    public function configure(DefinitionConfigurator $definition): void
    {
        $definition->rootNode()
            ->children()
                ->scalarNode('default_uri')
                    ->info('URL de base des fichiers uploadés (ex. https://api.example.com). Null : origine de la requête courante.')
                    ->defaultNull()
                ->end()
            ->end();
    }

    public function prependExtension(
        ContainerConfigurator $container,
        ContainerBuilder $builder
    ): void {
        // Enregistre automatiquement la fonction DQL MATCH() dans Doctrine
        $builder->prependExtensionConfig('doctrine', [
            'orm' => [
                'dql' => [
                    'numeric_functions' => [
                        'MATCH' => MatchAgainst::class,
                    ],
                ],
            ],
        ]);
    }

    public function loadExtension(
        array $config,
        ContainerConfigurator $container,
        ContainerBuilder $builder
    ): void {
        $services = $container->services()
            ->defaults()
            ->autowire()
            ->autoconfigure()
            // Injecté dans FilePathResolver pour construire les URL absolues des fichiers
            ->bind('$defaultUri', $config['default_uri'] ?? null)
            // Paramètre déclaré par CorePhpBundle (config/my_uploader.yaml), qui fournit aussi UploaderService
            ->bind('string $uploadDir', '%core_php.uploader.upload_dir%');

        // Services utilitaires de fagathe-dev/core-php requis par tes services
        if (!$builder->hasDefinition(TokenGenerator::class)) {
            $services->set(TokenGenerator::class);
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
