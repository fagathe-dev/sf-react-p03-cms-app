<?php

namespace App\DataFixtures;

use Fagathe\CmsCore\Entity\Entry;
use Fagathe\CmsCore\Entity\Note;
use Fagathe\CmsCore\Entity\Tag;
use Fagathe\CmsCore\Entity\Todo;
use Fagathe\CmsCore\Entity\User;
use Fagathe\CmsCore\Enum\Auth\UserRole;
use Fagathe\CmsCore\Enum\ColorEnum;
use Fagathe\CmsCore\Enum\MoodEnum;
use Fagathe\CmsCore\Enum\StateEnum;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Persistence\ObjectManager;
use Fagathe\CorePhp\Generator\TokenGenerator;
use Faker\Factory;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\String\Slugger\AsciiSlugger;

class AppFixtures extends Fixture
{
    public function __construct(
        private readonly UserPasswordHasherInterface $hasher,
        private readonly TokenGenerator $tokenGenerator
    ) {}

    public function load(ObjectManager $manager): void
    {
        $faker = Factory::create('fr_FR');
        $slugger = new AsciiSlugger();
        $defaultPassword = 'Password123!';
        $parisTz = new \DateTimeZone('Europe/Paris');


        for ($i = 0; $i < random_int(15, 30); $i++) {
            $user = new User();

            // Utilisateur fixe de test pour le premier compte
            if ($i === 0) {
                $user
                    ->setEmail('test@example.com')
                    ->setUsername('testuser')
                    ->setFirstname('Test')
                    ->setLastname('User')
                    ->setCreatedAt(new \DateTimeImmutable());
            } else {
                $user
                    ->setEmail($faker->unique()->safeEmail())
                    ->setUsername(substr($faker->unique()->userName() . $i, 0, 30))
                    ->setFirstname($faker->firstName())
                    ->setLastname($faker->lastName())
                    ->setCreatedAt(\DateTimeImmutable::createFromMutable($faker->dateTimeBetween('-3 months', 'now')));
            }

            $user
                ->setRoles([UserRole::RoleUser->value])
                ->setPassword($this->hasher->hashPassword($user, $defaultPassword))
                ->setIsVerified(true)
                ->setEmailVerifiedAt(new \DateTimeImmutable());

            // 1. Tags propres à l'utilisateur (respect de la contrainte unique owner + color)
            $availableColors = ColorEnum::cases();
            shuffle($availableColors);

            $tagCount = min(count($availableColors), $faker->numberBetween(3, 8));
            $userTags = [];

            for ($t = 0; $t < $tagCount; $t++) {
                $tag = new Tag();
                $tag
                    ->setName(ucfirst($faker->words($faker->numberBetween(1, 2), true)))
                    ->setDescription($faker->optional(0.7)->sentence())
                    ->setColor(array_pop($availableColors))
                    ->setCreatedAt(\DateTimeImmutable::createFromMutable($faker->dateTimeBetween('-2 months', 'now')));

                $user->addTag($tag);
                $manager->persist($tag);
                $userTags[] = $tag;
            }

            $manager->persist($user);
        }

        $manager->flush();
    }
}
