<?php

declare(strict_types=1);

namespace App\DataFixtures;

use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Persistence\ObjectManager;
use Fagathe\CmsCore\Entity\BlocContent;
use Fagathe\CmsCore\Entity\Category;
use Fagathe\CmsCore\Entity\CmsSetting;
use Fagathe\CmsCore\Entity\Comment;
use Fagathe\CmsCore\Entity\Post;
use Fagathe\CmsCore\Entity\PostMedia;
use Fagathe\CmsCore\Entity\SeoMetadata;
use Fagathe\CmsCore\Entity\Tag;
use Fagathe\CmsCore\Entity\User;
use Fagathe\CmsCore\Enum\Auth\UserRole;
use Fagathe\CmsCore\Enum\ColorEnum;
use Fagathe\CmsCore\Enum\CommentStatus;
use Fagathe\CmsCore\Enum\Post\BlockType;
use Fagathe\CmsCore\Enum\Post\FlagReason;
use Fagathe\CmsCore\Enum\Post\PostStatus;
use Fagathe\CmsCore\Enum\Seo\OgType;
use Fagathe\CmsCore\Enum\Seo\RobotsDirective;
use Fagathe\CmsCore\Enum\Seo\SchemaType;
use Fagathe\CmsCore\Enum\Seo\SeoTargetType;
use Fagathe\CorePhp\File\FileTypeEnum;
use Faker\Factory;
use Faker\Generator;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\String\Slugger\SluggerInterface;

final class AppFixtures extends Fixture
{
    private const DEFAULT_PASSWORD = 'Password123!';

    public function __construct(
        private readonly UserPasswordHasherInterface $hasher,
        private readonly SluggerInterface $slugger,
    ) {}

    public function load(ObjectManager $manager): void
    {
        $faker = Factory::create('fr_FR');

        // 1. Paramètres globaux du CMS (CmsSetting)
        $this->loadCmsSettings($manager);

        // 2. Utilisateurs (Comptes fixes par rôle + utilisateurs aléatoires)
        [$usersByRole, $allUsers, $authors] = $this->loadUsers($manager, $faker);

        // 3. Catégories (Category)
        $categories = $this->loadCategories($manager, $faker);

        // 4. Tags (Tag) — respecte l'unicité (owner + color) et l'unicité globale du slug
        $allTags = $this->loadTags($manager, $faker, $authors);

        // 5. Articles (Post), Blocs (BlocContent) et Médias (PostMedia)
        $posts = $this->loadPosts(
            $manager,
            $faker,
            $authors,
            $allUsers,
            $usersByRole[UserRole::ROLE_MODERATOR->value],
            $categories,
            $allTags
        );

        // 6. Commentaires (Comment : racines, réponses, modérés et signalés)
        $this->loadComments(
            $manager,
            $faker,
            $posts,
            $allUsers,
            $usersByRole[UserRole::ROLE_MODERATOR->value]
        );

        // 7. Métadonnées SEO (SeoMetadata : Pages statiques, Catégories, Tags, Articles)
        $this->loadSeoMetadata($manager, $faker, $posts, $categories, $allTags);

        $manager->flush();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 1. CmsSetting
    // ─────────────────────────────────────────────────────────────────────────

    private function loadCmsSettings(ObjectManager $manager): void
    {
        $settingsData = [
            ['key' => 'site_name', 'value' => 'Tech & Craft CMS', 'type' => 'string'],
            ['key' => 'site_tagline', 'value' => 'Architecture logicielle, PHP, Symfony & React', 'type' => 'string'],
            ['key' => 'posts_per_page', 'value' => '12', 'type' => 'integer'],
            ['key' => 'default_post_status', 'value' => PostStatus::DRAFT->value, 'type' => 'string'],
            ['key' => 'comments_enabled_globally', 'value' => 'true', 'type' => 'boolean'],
            ['key' => 'auto_approve_comments', 'value' => 'false', 'type' => 'boolean'],
            ['key' => 'likes_enabled_globally', 'value' => 'true', 'type' => 'boolean'],
            ['key' => 'maintenance_mode', 'value' => 'false', 'type' => 'boolean'],
            [
                'key'   => 'social_links',
                'value' => json_encode([
                    'github'   => 'https://github.com/fagathe',
                    'linkedin' => 'https://linkedin.com',
                ], JSON_THROW_ON_ERROR),
                'type'  => 'json',
            ],
        ];

        foreach ($settingsData as $item) {
            $setting = (new CmsSetting())
                ->setSettingKey($item['key'])
                ->setSettingValue($item['value'])
                ->setType($item['type'])
                ->setCreatedAt(new \DateTimeImmutable('-6 months'));

            $manager->persist($setting);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 2. Users
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @return array{0: array<string, User>, 1: User[], 2: User[]}
     */
    private function loadUsers(ObjectManager $manager, Generator $faker): array
    {
        $fixedAccounts = [
            [
                'email'     => 'superadmin@cms.local',
                'username'  => 'superadmin',
                'firstname' => 'Frédérick',
                'lastname'  => 'Agathe',
                'role'      => UserRole::ROLE_SUPER_ADMIN,
                'bio'       => 'Architecte & Administrateur technique du CMS.',
            ],
            [
                'email'     => 'admin@cms.local',
                'username'  => 'admin_cms',
                'firstname' => 'Claire',
                'lastname'  => 'Dubois',
                'role'      => UserRole::ROLE_ADMIN,
                'bio'       => 'Administratrice générale de la plateforme éditoriale.',
            ],
            [
                'email'     => 'manager@cms.local',
                'username'  => 'manager_cms',
                'firstname' => 'Thomas',
                'lastname'  => 'Moreau',
                'role'      => UserRole::ROLE_MANAGER,
                'bio'       => 'Responsable éditorial et gestionnaire des taxonomies.',
            ],
            [
                'email'     => 'moderator@cms.local',
                'username'  => 'modo_cms',
                'firstname' => 'Sarah',
                'lastname'  => 'Lefevre',
                'role'      => UserRole::ROLE_MODERATOR,
                'bio'       => 'Modératrice de la communauté et garante de la charte.',
            ],
            [
                'email'     => 'editor@cms.local',
                'username'  => 'editor_cms',
                'firstname' => 'Julien',
                'lastname'  => 'Bernard',
                'role'      => UserRole::ROLE_EDITOR,
                'bio'       => 'Rédacteur technique interne spécialisé Backend & DevOps.',
            ],
            [
                'email'     => 'contributor@cms.local',
                'username'  => 'contributor_cms',
                'firstname' => 'Nina',
                'lastname'  => 'Martin',
                'role'      => UserRole::ROLE_CONTRIBUTOR,
                'bio'       => 'Contributrice externe passionnée par l\'écosystème Frontend.',
            ],
            [
                'email'     => 'test@example.com',
                'username'  => 'testuser',
                'firstname' => 'Test',
                'lastname'  => 'User',
                'role'      => UserRole::ROLE_USER,
                'bio'       => 'Lecteur assidu du blog.',
            ],
        ];

        $usersByRole = [];
        $allUsers = [];
        $authors = [];

        // On calcule le hash une seule fois pour accélérer l'exécution des fixtures
        $dummyUser = new User();
        $hashedPassword = $this->hasher->hashPassword($dummyUser, self::DEFAULT_PASSWORD);

        foreach ($fixedAccounts as $acc) {
            $createdAt = \DateTimeImmutable::createFromMutable($faker->dateTimeBetween('-6 months', '-3 months'));
            $user = (new User())
                ->setEmail($acc['email'])
                ->setUsername($acc['username'])
                ->setFirstname($acc['firstname'])
                ->setLastname($acc['lastname'])
                ->setRole($acc['role'])
                ->setPassword($hashedPassword)
                ->setAvatar(sprintf('https://i.pravatar.cc/150?u=%s', $acc['username']))
                ->setIsVerified(true)
                ->setEmailVerifiedAt($createdAt)
                ->setCreatedAt($createdAt)
                ->setSettings([
                    'bio'                 => $acc['bio'],
                    'website'             => $faker->optional(0.5)->url(),
                    'email_notifications' => true,
                ]);

            $user->setDisplayName();
            $manager->persist($user);

            $usersByRole[$acc['role']->value] = $user;
            $allUsers[] = $user;

            if ($acc['role']->isAtLeast(UserRole::ROLE_CONTRIBUTOR)) {
                $authors[] = $user;
            }
        }

        // Ajout d'utilisateurs supplémentaires (contributeurs, éditeurs et lecteurs)
        $extraRoles = [
            UserRole::ROLE_CONTRIBUTOR,
            UserRole::ROLE_CONTRIBUTOR,
            UserRole::ROLE_EDITOR,
            UserRole::ROLE_USER,
            UserRole::ROLE_USER,
            UserRole::ROLE_USER,
            UserRole::ROLE_USER,
            UserRole::ROLE_USER,
            UserRole::ROLE_USER,
            UserRole::ROLE_USER,
        ];

        foreach ($extraRoles as $index => $role) {
            $createdAt = \DateTimeImmutable::createFromMutable($faker->dateTimeBetween('-4 months', '-5 days'));
            $username = strtolower($this->slugify($faker->userName())) . '_' . ($index + 1);

            $user = (new User())
                ->setEmail(sprintf('user%d_%s', $index + 1, $faker->unique()->safeEmail()))
                ->setUsername(substr($username, 0, 50))
                ->setFirstname($faker->firstName())
                ->setLastname($faker->lastName())
                ->setRole($role)
                ->setPassword($hashedPassword)
                ->setAvatar(sprintf('https://i.pravatar.cc/150?u=%s', $username))
                ->setIsVerified(true)
                ->setEmailVerifiedAt($createdAt)
                ->setCreatedAt($createdAt)
                ->setSettings([
                    'bio'                 => $faker->optional(0.7)->sentence(10),
                    'website'             => $faker->optional(0.3)->url(),
                    'email_notifications' => $faker->boolean(80),
                ]);

            $user->setDisplayName();
            $manager->persist($user);

            $allUsers[] = $user;
            if ($role->isAtLeast(UserRole::ROLE_CONTRIBUTOR)) {
                $authors[] = $user;
            }
        }

        return [$usersByRole, $allUsers, $authors];
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 3. Categories
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @return Category[]
     */
    private function loadCategories(ObjectManager $manager, Generator $faker): array
    {
        $categoriesPreset = [
            [
                'name'        => 'Architecture Logicielle',
                'description' => 'Clean Architecture, Domain-Driven Design, principes SOLID et design patterns.',
                'icon'        => 'sitemap-outline',
                'color'       => ColorEnum::Slate->value ?? ColorEnum::Blue->value,
                'featured'    => true,
            ],
            [
                'name'        => 'PHP & Symfony',
                'description' => 'Nouveautés PHP 8.3+, écosystème Symfony, Doctrine ORM et performances backend.',
                'icon'        => 'language-php',
                'color'       => ColorEnum::Violet->value,
                'featured'    => true,
            ],
            [
                'name'        => 'React & TypeScript',
                'description' => 'Développement Frontend moderne, hooks personnalisés, Design Systems et état applicatif.',
                'icon'        => 'react',
                'color'       => ColorEnum::Cyan->value,
                'featured'    => true,
            ],
            [
                'name'        => 'DevOps & Docker',
                'description' => 'Conteneurisation, pipelines CI/CD GitHub Actions, déploiement continu et sécurité.',
                'icon'        => 'docker',
                'color'       => ColorEnum::Green->value,
                'featured'    => false,
            ],
            [
                'name'        => 'SEO & Web Performance',
                'description' => 'Core Web Vitals, données structurées Schema.org / JSON-LD et indexation.',
                'icon'        => 'chart-line',
                'color'       => ColorEnum::Orange->value,
                'featured'    => false,
            ],
            [
                'name'        => 'Sécurité & Authentification',
                'description' => 'JWT, Voters Symfony, protection WAF, OWASP et gestion des permissions.',
                'icon'        => 'shield-lock-outline',
                'color'       => ColorEnum::Red->value,
                'featured'    => false,
            ],
        ];

        $categories = [];

        foreach ($categoriesPreset as $preset) {
            $createdAt = \DateTimeImmutable::createFromMutable($faker->dateTimeBetween('-5 months', '-2 months'));
            $category = (new Category())
                ->setName($preset['name'])
                ->setSlug($this->slugify($preset['name']))
                ->setDescription($preset['description'])
                ->setCreatedAt($createdAt)
                ->setSettings([
                    'icon'        => $preset['icon'],
                    'color'       => $preset['color'],
                    'is_featured' => $preset['featured'],
                ]);

            $manager->persist($category);
            $categories[] = $category;
        }

        return $categories;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 4. Tags (Unicité : slug global + couple [owner, color])
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @param User[] $authors
     * @return Tag[]
     */
    private function loadTags(ObjectManager $manager, Generator $faker, array $authors): array
    {
        $tagNamesPool = [
            'PHP 8.3',
            'Symfony 7',
            'TypeScript',
            'React 19',
            'Clean Architecture',
            'SOLID',
            'Doctrine ORM',
            'JWT Auth',
            'Docker',
            'CI/CD',
            'JSON-LD',
            'Design System',
            'REST API',
            'Tests Unitaires',
            'Sécurité Web',
            'Performance',
            'ViteJS',
            'Zustand',
        ];

        $allTags = [];
        $tagIndex = 0;

        foreach ($authors as $authorIndex => $author) {
            $availableColors = ColorEnum::cases();
            shuffle($availableColors);

            // 3 à 4 tags par auteur, chacun avec une couleur unique pour cet owner
            $tagsForThisAuthor = min(count($availableColors), 3);

            for ($i = 0; $i < $tagsForThisAuthor; $i++) {
                $baseName = $tagNamesPool[$tagIndex % count($tagNamesPool)];
                // On garantit l'unicité du nom et du slug si la piscine de noms boucle
                $name = $tagIndex < count($tagNamesPool)
                    ? $baseName
                    : sprintf('%s #%d', $baseName, $authorIndex + 1);

                $slug = $this->slugify($name);
                $color = array_pop($availableColors);

                $tag = (new Tag())
                    ->setName($name)
                    ->setSlug($slug)
                    ->setColor($color)
                    ->setDescription($faker->sentence(8))
                    ->setOwner($author)
                    ->setCreatedAt(\DateTimeImmutable::createFromMutable($faker->dateTimeBetween('-4 months', '-1 month')));

                $author->addTag($tag);
                $manager->persist($tag);

                $allTags[] = $tag;
                ++$tagIndex;
            }
        }

        return $allTags;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 5. Posts + BlocContent + PostMedia
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @param User[]     $authors
     * @param User[]     $allUsers
     * @param Category[] $categories
     * @param Tag[]      $allTags
     * @return Post[]
     */
    private function loadPosts(
        ObjectManager $manager,
        Generator $faker,
        array $authors,
        array $allUsers,
        User $moderator,
        array $categories,
        array $allTags,
    ): array {
        $postsCatalog = [
            // Articles PUBLIÉS (Front & Back-Office)
            ['title' => 'Mettre en place une Clean Architecture pragmatique avec Symfony', 'status' => PostStatus::PUBLISHED, 'featured' => true],
            ['title' => 'Gérer finement les permissions avec les Voters Symfony et React', 'status' => PostStatus::PUBLISHED, 'featured' => true],
            ['title' => 'Optimiser le référencement avec Schema.org et JSON-LD automatisés', 'status' => PostStatus::PUBLISHED, 'featured' => true],
            ['title' => 'Construire un Design System modulaire en TypeScript sans bibliothèque lourde', 'status' => PostStatus::PUBLISHED, 'featured' => false],
            ['title' => 'Recherche Full-Text performante avec MySQL et Doctrine ORM', 'status' => PostStatus::PUBLISHED, 'featured' => false],
            ['title' => 'Sécuriser une API REST stateless avec LexikJWT et OTP', 'status' => PostStatus::PUBLISHED, 'featured' => false],
            ['title' => 'Pourquoi déléguer la persistance aux Repositories plutôt qu\'aux Services', 'status' => PostStatus::PUBLISHED, 'featured' => false],
            ['title' => 'Industrialiser ses déploiements Docker avec GitHub Actions', 'status' => PostStatus::PUBLISHED, 'featured' => false],
            ['title' => 'Éditeur de contenu par blocs : structurer le JSON pour le rendu React', 'status' => PostStatus::PUBLISHED, 'featured' => false],
            ['title' => 'Protection anti-spam et modération communautaire sur un blog moderne', 'status' => PostStatus::PUBLISHED, 'featured' => false],

            // Articles en BROUILLON (DRAFT)
            ['title' => 'Migration vers Symfony 8 : guide de préparation technique', 'status' => PostStatus::DRAFT, 'featured' => false],
            ['title' => 'State Management en React : comparatif Zustand vs Context API', 'status' => PostStatus::DRAFT, 'featured' => false],
            ['title' => 'Automatiser les audits Lighthouse dans la CI', 'status' => PostStatus::DRAFT, 'featured' => false],

            // Articles en RELECTURE (REVIEW) — pour tester PostModerationController
            ['title' => 'Introduction aux Design Patterns Factory et Strategy en PHP 8.3', 'status' => PostStatus::REVIEW, 'featured' => false],
            ['title' => 'Gestion du cache HTTP et ETag sur une API Symfony', 'status' => PostStatus::REVIEW, 'featured' => false],

            // Articles À RÉÉCRIRE (REWRITING) — avec note de modération
            ['title' => 'Comparatif des frameworks CSS en 2026', 'status' => PostStatus::REWRITING, 'featured' => false],
            ['title' => 'Configurer un serveur Linux de production de A à Z', 'status' => PostStatus::REWRITING, 'featured' => false],

            // Article ARCHIVÉ (ARCHIVED)
            ['title' => 'Rétrospective des évolutions de PHP 7.4 à PHP 8.3', 'status' => PostStatus::ARCHIVED, 'featured' => false],

            // Articles dans la CORBEILLE (TRASH)
            ['title' => 'Ancien brouillon de test à purger', 'status' => PostStatus::TRASH, 'featured' => false],
            ['title' => 'Article obsolète déplacé dans la corbeille', 'status' => PostStatus::TRASH, 'featured' => false],
        ];

        $posts = [];

        foreach ($postsCatalog as $idx => $item) {
            $author = $authors[$idx % count($authors)];
            $category = $categories[$idx % count($categories)];
            $createdAt = \DateTimeImmutable::createFromMutable($faker->dateTimeBetween('-3 months', '-2 days'));
            $slug = $this->slugify($item['title']) . '-' . ($idx + 1);

            $post = (new Post())
                ->setTitle($item['title'])
                ->setSlug($slug)
                ->setExcerpt($faker->paragraph(2))
                ->setThumbnail(sprintf('https://picsum.photos/seed/%s/1200/630', $slug))
                ->setAuthor($author)
                ->setCategory($category)
                ->setCreatedAt($createdAt)
                ->setStatus($item['status'])
                ->setViewsCount($item['status'] === PostStatus::PUBLISHED ? $faker->numberBetween(25, 1450) : 0);

            if ($item['status'] === PostStatus::PUBLISHED) {
                $post->setPublishedAt($createdAt->modify('+1 day'));
            }

            if ($item['status'] === PostStatus::TRASH) {
                // Le premier article en corbeille est récent, le second dépasse les 30 jours (purgeable)
                $trashedAt = $idx === 18
                    ? new \DateTimeImmutable('-5 days')
                    : new \DateTimeImmutable('-35 days');
                $post->setTrashedAt($trashedAt);
            }

            // Paramètres de l'article
            $post->setSetting('is_featured', $item['featured']);
            $post->setSetting('reading_time', $faker->numberBetween(4, 12));
            $post->setSetting('allow_comments', true);
            $post->setSetting('allow_likes', true);
            $post->setSetting('show_toc', true);

            // Si l'article est en REWRITING, on renseigne les métadonnées de revue du modérateur
            if ($item['status'] === PostStatus::REWRITING) {
                $post->setSetting('reviewed_by', (string) $moderator->getId());
                $post->setSetting('reviewed_at', (new \DateTimeImmutable('-1 day'))->format(\DateTimeInterface::ATOM));
                $post->setSetting(
                    'moderation_note',
                    'Merci d\'approfondir les exemples de code et de sourcer les benchmarks avant publication.'
                );
            }

            // Attribution de 2 à 4 tags aléatoires
            $shuffledTags = $allTags;
            shuffle($shuffledTags);
            foreach (array_slice($shuffledTags, 0, $faker->numberBetween(2, 4)) as $tag) {
                $post->addTag($tag);
            }

            // Ajout des blocs de contenu (BlocContent)
            $this->attachBlocksToPost($post, $faker, $createdAt);

            // Ajout d'un ou deux médias attachés (PostMedia)
            $this->attachMediasToPost($post, $author, $slug, $createdAt);

            // Simulation de Likes et de Signalements sur les articles publiés
            if ($item['status'] === PostStatus::PUBLISHED) {
                $likers = $faker->randomElements($allUsers, $faker->numberBetween(1, min(6, count($allUsers))));
                foreach ($likers as $liker) {
                    $post->toggleLike($liker);
                }

                // On signale 2 articles publiés pour qu'ils remontent dans PostModerationController (?flagged=true)
                if ($idx === 8 || $idx === 9) {
                    $flaggers = $faker->randomElements($allUsers, 2);
                    foreach ($flaggers as $flagger) {
                        if ((string) $flagger->getId() !== (string) $author->getId()) {
                            $post->flagByUser(
                                $flagger,
                                FlagReason::MISINFORMATION->value,
                                'Certaines commandes indiquées dans l\'article semblent dépréciées.'
                            );
                        }
                    }
                }
            }

            $manager->persist($post);
            $posts[] = $post;
        }

        return $posts;
    }

    /**
     * Blocs d'un article : nombre (1 à 12) et enchaînement des types variables, comme un auteur qui compose
     * son article à la volée. Les données suivent le format des éditeurs du back-office (cms_bo, blockDefaults.ts).
     */
    private function attachBlocksToPost(Post $post, Generator $faker, \DateTimeImmutable $createdAt): void
    {
        $factories = $this->blockDataFactories($post, $faker);

        // Le texte reste majoritaire ; l'article s'ouvre toujours sur un paragraphe d'introduction
        $weightedTypes = [
            ...array_fill(0, 5, BlockType::TEXT),
            BlockType::CODE, BlockType::CODE,
            BlockType::IMAGE, BlockType::IMAGE,
            BlockType::QUOTE,
            BlockType::TABLE,
            BlockType::FAQ,
            BlockType::CTA,
        ];
        $types = [BlockType::TEXT];
        for ($i = 1, $count = $faker->numberBetween(1, 12); $i < $count; ++$i) {
            $types[] = $faker->randomElement($weightedTypes);
        }

        foreach ($types as $index => $type) {
            $post->addBlock(
                (new BlocContent())
                    ->setType($type)
                    ->setPosition($index + 1)
                    ->setCreatedAt($createdAt)
                    ->setData($factories[$type->value]())
            );
        }
    }

    /**
     * @return array<string, callable(): array<string, mixed>>
     */
    private function blockDataFactories(Post $post, Generator $faker): array
    {
        return [
            BlockType::TEXT->value => static fn(): array => [
                'content' => sprintf(
                    "## %s\n\n%s\n\n%s",
                    rtrim($faker->sentence(4), '.'),
                    $faker->paragraph(4),
                    $faker->paragraph(3)
                ),
            ],
            BlockType::CODE->value => static fn(): array => $faker->randomElement([
                [
                    'language' => 'php',
                    'filename' => 'PostVoter.php',
                    'code'     => "protected function voteOnAttribute(string \$attribute, mixed \$subject, TokenInterface \$token): bool\n{\n    return \$this->security->isGranted('ROLE_MANAGER');\n}",
                ],
                [
                    'language' => 'typescript',
                    'filename' => 'usePermissions.ts',
                    'code'     => "export const usePermissions = () => {\n  const { user } = useAuth();\n  return { canEditPost: (post: Post) => post.author?.id === user?.id };\n};",
                ],
                [
                    'language' => 'bash',
                    'filename' => '',
                    'code'     => "php bin/console doctrine:migrations:migrate\nphp bin/console cache:clear",
                ],
            ]),
            BlockType::QUOTE->value => static fn(): array => [
                'text'   => $faker->randomElement([
                    'La simplicité est la sophistication suprême dans une architecture logicielle durable.',
                    'Un code lisible vaut mieux qu\'un code astucieux.',
                    'Mesurer avant d\'optimiser.',
                ]),
                'author' => $faker->name(),
                'source' => '',
            ],
            BlockType::IMAGE->value => static fn(): array => [
                'url'         => sprintf('https://picsum.photos/seed/%s-%s/960/540', $post->getSlug(), $faker->unique()->numberBetween(1, 99999)),
                'alt'         => 'Illustration de ' . $post->getTitle(),
                'caption'     => $faker->sentence(8),
                'aspectRatio' => '16/9',
            ],
            BlockType::TABLE->value => static fn(): array => [
                'rows'      => [
                    ['Critère', 'Option A', 'Option B'],
                    ['Performance', 'Élevée', 'Moyenne'],
                    ['Complexité', 'Faible', 'Élevée'],
                ],
                'hasHeader' => true,
                'caption'   => 'Comparatif des approches',
            ],
            BlockType::FAQ->value => static fn(): array => [
                'items' => [
                    [
                        'id'       => $faker->uuid(),
                        'question' => 'Pourquoi séparer la logique de sécurité dans des Voters ?',
                        'answer'   => 'Pour centraliser les règles métier et respecter le principe Single Responsibility.',
                    ],
                    [
                        'id'       => $faker->uuid(),
                        'question' => 'Comment synchroniser ces droits côté React ?',
                        'answer'   => 'Via un hook dédié usePermissions() qui réplique la hiérarchie des rôles.',
                    ],
                ],
            ],
            BlockType::CTA->value => static fn(): array => [
                'title'       => 'Envie d\'aller plus loin ?',
                'description' => 'Retrouvez le code source complet de cet article sur notre dépôt.',
                'buttonLabel' => 'Voir le dépôt',
                'buttonUrl'   => 'https://github.com/',
                'variant'     => 'primary',
            ],
        ];
    }

    private function attachMediasToPost(
        Post $post,
        User $author,
        string $slug,
        \DateTimeImmutable $createdAt,
    ): void {
        $media = (new PostMedia())
            ->setOwner($author)
            ->setOriginalName($slug . '-cover.webp')
            ->setNiceName('Illustration principale - ' . $post->getTitle())
            ->setAlt('Illustration de l\'article ' . $post->getTitle())
            ->setFilePath(sprintf('uploads/posts/%s/cover.webp', (string) $post->getId()))
            ->setMimeType('image/webp')
            ->setExtension('webp')
            ->setSize(245760)
            ->setType(FileTypeEnum::tryFrom('image'))
            ->setIsPinned(true)
            ->setCreatedAt($createdAt);

        $post->addMedia($media);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 6. Comments (Racines, réponses imbriquées et signalements)
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @param Post[] $posts
     * @param User[] $allUsers
     */
    private function loadComments(
        ObjectManager $manager,
        Generator $faker,
        array $posts,
        array $allUsers,
        User $moderator,
    ): void {
        $publishedPosts = array_values(array_filter(
            $posts,
            static fn(Post $p): bool => $p->getStatus() === PostStatus::PUBLISHED
        ));

        foreach ($publishedPosts as $postIndex => $post) {
            $rootCommentsCount = $faker->numberBetween(2, 5);

            for ($c = 0; $c < $rootCommentsCount; $c++) {
                $commentAuthor = $allUsers[array_rand($allUsers)];
                $createdAt = \DateTimeImmutable::createFromMutable($faker->dateTimeBetween('-1 month', '-1 day'));

                // Répartition des statuts pour tester la modération
                $status = match (true) {
                    $c === 0 => CommentStatus::APPROVED,
                    $c === 1 && $postIndex % 2 === 0 => CommentStatus::PENDING,
                    $c === 2 && $postIndex % 3 === 0 => CommentStatus::SPAM,
                    default => CommentStatus::APPROVED,
                };

                $rootComment = (new Comment())
                    ->setPost($post)
                    ->setOwner($commentAuthor)
                    ->setContent($faker->realText($faker->numberBetween(80, 240)))
                    ->setStatus($status)
                    ->setCreatedAt($createdAt);

                if ($status === CommentStatus::APPROVED) {
                    $rootComment->setSetting('moderated_by', (string) $moderator->getId());
                    $rootComment->setSetting('moderated_at', $createdAt->modify('+2 hours')->format(\DateTimeInterface::ATOM));
                }

                // Signalement de certains commentaires pour alimenter la file de modération (?flagged=true)
                if ($postIndex < 4 && $c === 1) {
                    $reasons = FlagReason::cases();
                    $flaggers = $faker->randomElements($allUsers, 3);
                    foreach ($flaggers as $flagger) {
                        if ((string) $flagger->getId() !== (string) $commentAuthor->getId()) {
                            $chosenReason = $reasons[array_rand($reasons)];
                            $rootComment->flagByUser($flagger, $chosenReason->value);
                        }
                    }
                }

                $manager->persist($rootComment);

                // Ajout d'une réponse imbriquée (reply) sur le premier commentaire approuvé
                if ($c === 0 && $post->getAuthor() instanceof User) {
                    $reply = (new Comment())
                        ->setPost($post)
                        ->setParent($rootComment)
                        ->setOwner($post->getAuthor())
                        ->setContent('Merci pour ton retour pertinent ! N\'hésite pas si tu as des questions sur l\'implémentation.')
                        ->setStatus(CommentStatus::APPROVED)
                        ->setCreatedAt($createdAt->modify('+3 hours'));

                    $manager->persist($reply);
                }
            }
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 7. SeoMetadata (Static pages, Categories, Tags, Posts)
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @param Post[]     $posts
     * @param Category[] $categories
     * @param Tag[]      $allTags
     */
    private function loadSeoMetadata(
        ObjectManager $manager,
        Generator $faker,
        array $posts,
        array $categories,
        array $allTags,
    ): void {
        // A. Pages statiques (STATIC_PAGE)
        $staticPages = [
            [
                'identifier'  => 'home',
                'title'       => 'Tech & Craft Blog — Architecture PHP, Symfony & React',
                'description' => 'Articles techniques approfondis sur Symfony, PHP 8.3, React, TypeScript et l\'architecture logicielle.',
                'canonical'   => 'https://frederickagathe.fr/',
                'schemaType'  => SchemaType::WEB_PAGE,
            ],
            [
                'identifier'  => 'about',
                'title'       => 'À propos de la rédaction — Tech & Craft',
                'description' => 'Découvrez l\'équipe de développeurs et architectes derrière le blog technique.',
                'canonical'   => 'https://frederickagathe.fr/about',
                'schemaType'  => SchemaType::ABOUT_PAGE,
            ],
            [
                'identifier'  => 'contact',
                'title'       => 'Contacter l\'équipe — Tech & Craft',
                'description' => 'Une question technique ou une proposition d\'article invité ? Contactez-nous.',
                'canonical'   => 'https://frederickagathe.fr/contact',
                'schemaType'  => SchemaType::CONTACT_PAGE,
            ],
        ];

        foreach ($staticPages as $page) {
            $seo = (new SeoMetadata())
                ->setTargetType(SeoTargetType::STATIC_PAGE)
                ->setTargetIdentifier($page['identifier'])
                ->setMetaTitle(mb_substr($page['title'], 0, 70))
                ->setMetaDescription(mb_substr($page['description'], 0, 160))
                ->setCanonicalUrl($page['canonical'])
                ->setRobots(RobotsDirective::INDEX_FOLLOW)
                ->setOgTitle($page['title'])
                ->setOgDescription($page['description'])
                ->setOgImage('https://picsum.photos/seed/cms-og-default/1200/630')
                ->setGeoRegion('FR-IDF')
                ->setGeoPlacename('Paris')
                ->setGeoPosition('48.8566;2.3522')
                ->setJsonLdSchema([
                    '@context'    => 'https://schema.org',
                    '@type'       => $page['schemaType']->value,
                    'name'        => $page['title'],
                    'description' => $page['description'],
                    'url'         => $page['canonical'],
                ])
                ->setSettings(['og_type' => OgType::WEBSITE->value]);

            $manager->persist($seo);
        }

        // B. Catégories (CATEGORY)
        foreach ($categories as $category) {
            $metaTitle = mb_substr(sprintf('%s — Articles & Guides', (string) $category->getName()), 0, 70);
            $metaDesc = mb_substr((string) ($category->getDescription() ?? $faker->sentence(12)), 0, 160);

            $seo = (new SeoMetadata())
                ->setTargetType(SeoTargetType::CATEGORY)
                ->setTargetIdentifier((string) $category->getId())
                ->setMetaTitle($metaTitle)
                ->setMetaDescription($metaDesc)
                ->setCanonicalUrl(sprintf('https://frederickagathe.fr/categories/%s', $category->getSlug()))
                ->setRobots(RobotsDirective::INDEX_FOLLOW)
                ->setOgTitle($metaTitle)
                ->setOgDescription($metaDesc)
                ->setJsonLdSchema([
                    '@context' => 'https://schema.org',
                    '@type'    => SchemaType::COLLECTION_PAGE->value,
                    'name'     => $category->getName(),
                ]);

            $manager->persist($seo);
        }

        // C. Premiers Tags (TAG)
        foreach (array_slice($allTags, 0, 6) as $tag) {
            $metaTitle = mb_substr(sprintf('Articles sur le sujet #%s', (string) $tag->getName()), 0, 70);
            $metaDesc = mb_substr((string) ($tag->getDescription() ?? ''), 0, 160);

            $seo = (new SeoMetadata())
                ->setTargetType(SeoTargetType::TAG)
                ->setTargetIdentifier((string) $tag->getId())
                ->setMetaTitle($metaTitle)
                ->setMetaDescription($metaDesc)
                ->setCanonicalUrl(sprintf('https://frederickagathe.fr/tags/%s', $tag->getSlug()))
                ->setRobots(RobotsDirective::INDEX_FOLLOW);

            $manager->persist($seo);
        }

        // D. Articles publiés (POST)
        foreach ($posts as $post) {
            if ($post->getStatus() !== PostStatus::PUBLISHED) {
                continue;
            }

            $metaTitle = mb_substr((string) $post->getTitle(), 0, 70);
            $metaDesc = mb_substr((string) ($post->getExcerpt() ?? ''), 0, 160);

            $seo = (new SeoMetadata())
                ->setTargetType(SeoTargetType::POST)
                ->setTargetIdentifier((string) $post->getId())
                ->setMetaTitle($metaTitle)
                ->setMetaDescription($metaDesc)
                ->setCanonicalUrl(sprintf('https://frederickagathe.fr/blog/%s', $post->getSlug()))
                ->setRobots(RobotsDirective::INDEX_FOLLOW)
                ->setOgTitle((string) $post->getTitle())
                ->setOgDescription($metaDesc)
                ->setOgImage($post->getThumbnail())
                ->setGeoRegion('FR-IDF')
                ->setGeoPlacename('Paris')
                ->setJsonLdSchema([
                    '@context'      => 'https://schema.org',
                    '@type'         => SchemaType::TECH_ARTICLE->value,
                    'headline'      => $post->getTitle(),
                    'datePublished' => $post->getPublishedAt()?->format(\DateTimeInterface::ATOM),
                    'author'        => [
                        '@type' => 'Person',
                        'name'  => $post->getAuthorName(),
                    ],
                ])
                ->setSettings(['og_type' => OgType::ARTICLE->value]);

            $manager->persist($seo);
        }
    }

    private function slugify(string $value): string
    {
        return strtolower($this->slugger->slug($value)->toString());
    }
}
