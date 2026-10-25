---
name: sf-react-p03-cms-app
description: Architecture complète et conventions de développement du Monorepo Blog CMS : package métier PHP `cms-core` (Fagathe\CmsCore), API REST Symfony du back-office (`apps/cms_api`, JWT), back-office React / TypeScript (`apps/cms_bo`) et front blog Symfony en rendu serveur (`apps/cms_front`). À utiliser systématiquement pour toute intervention sur le monorepo.
---
 
# Architecture & Conventions du Monorepo Blog CMS
 
Ce dépôt est organisé en **Monorepo** découpé en briques indépendantes à responsabilité unique :
 
```text
.
├── packages/
│   └── cms-core/      # Package PHP métier partagé (Fagathe\CmsCore)
└── apps/
    ├── cms_api/       # API REST Symfony du back-office (JWT)
    ├── cms_bo/        # Back-office React + TypeScript + Vite
    └── cms_front/     # Front blog Symfony (rendu serveur, SEO-GEO)
```
 
1. **`packages/cms-core` (`Fagathe\CmsCore\`)** — Package PHP cœur du CMS, partagé entre `apps/cms_api` et `apps/cms_front` (Entités, Repositories, Services métiers, DTOs, Enums, Voters, Traits, Générateurs SEO/JSON-LD, Contrats). Il s'appuie sur la librairie utilitaire `Fagathe\CorePhp\`.
2. **`apps/cms_api` (`App\`)** — API REST Symfony dédiée au back-office : endpoints (`App\Controller\*`), authentification JWT (`security.yaml`) et fixtures (`App\DataFixtures\AppFixtures`).
3. **`apps/cms_bo` (React + TypeScript + Vite)** — Back-office d'administration du CMS, consommant `cms_api` et s'appuyant sur le Design System interne (`@/ui/components`) et la librairie utilitaire `core-ts`.
4. **`apps/cms_front` (Symfony)** — Front public du blog en rendu serveur : affichage des contenus, gestion de profil et optimisation SEO-GEO grâce au rendu PHP côté serveur.
---
 
## 0. Principes de conception — SOLID
 
Tout développement dans le monorepo (PHP comme TypeScript) respecte les principes **SOLID** :
 
| Principe | Application attendue |
|---|---|
| **S** — Single Responsibility | Une classe = une raison de changer. Les contrôleurs délèguent, les services portent le métier, les repositories la persistance, les DTOs le transport de données. |
| **O** — Open/Closed | Ouvert à l'extension, fermé à la modification. **Principe prioritaire du projet**, voir ci-dessous. |
| **L** — Liskov Substitution | Toute implémentation d'une interface ou classe abstraite (`AbstractFile`, contrats SEO…) doit être substituable sans changer le comportement attendu par l'appelant. |
| **I** — Interface Segregation | Préférer plusieurs petites interfaces ciblées (`ArticleSeoInterface`, `TaxonomySeoInterface`) à une interface fourre-tout. |
| **D** — Dependency Inversion | Dépendre d'abstractions (interfaces, contrats de `cms-core`) injectées par le conteneur, jamais d'implémentations concrètes instanciées à la main. |
 
### 0.1. Attachement particulier à l'Open/Closed Principle
 
Ajouter un comportement doit se faire **en ajoutant du code, pas en modifiant du code existant et stable**. Concrètement :
 
- **Pas de `switch` / `match` / chaînes de `if` qui grossissent à chaque nouveau cas.** Quand un traitement varie selon un type (`BlockType`, `SeoTargetType`, `SchemaType`, `FileTypeEnum`, `UserRequestTypeEnum`…), on définit une interface et une implémentation par cas.
- **Pattern stratégie + services taggés Symfony** : chaque implémentation déclare ce qu'elle supporte (`supports()`), et est enregistrée automatiquement via `#[AutoconfigureTag]` / `#[AutowireIterator]`. Le service appelant itère sur les implémentations sans les connaître.
  ```php
  #[AutoconfigureTag('cms.block_handler')]
  interface BlockHandlerInterface
  {
      public function supports(BlockType $type): bool;
      public function handle(BlocContent $bloc): void;
  }
 
  final class BlockProcessor
  {
      /** @param iterable<BlockHandlerInterface> $handlers */
      public function __construct(
          #[AutowireIterator('cms.block_handler')]
          private readonly iterable $handlers,
      ) {}
 
      public function process(BlocContent $bloc): void
      {
          foreach ($this->handlers as $handler) {
              if ($handler->supports($bloc->getType())) {
                  $handler->handle($bloc);
                  return;
              }
          }
      }
  }
  ```
 
  Ajouter un nouveau type de bloc = ajouter un case à l'enum + une nouvelle classe handler. `BlockProcessor` n'est pas modifié.
- **Extension de `cms-core` depuis les apps** : `cms_api` et `cms_front` étendent le comportement du package en implémentant ses interfaces ou en s'abonnant à ses événements, **jamais en modifiant le package** pour un besoin propre à une app.
- **Points d'extension explicites** : interfaces, événements Symfony (`EventDispatcher`), décoration de services (`#[AsDecorator]`). Les classes concrètes restent `final` ; on étend par composition, pas par héritage.
- **Côté React (`cms_bo`)** : même logique avec des registres (ex. map `BlockType → composant d'édition`) plutôt que des conditions dans les composants.
---
 
## 1. Package `packages/cms-core` (`Fagathe\CmsCore`)
 
Le package `Fagathe\CmsCore` contient **toute l'intelligence métier du CMS**. Il est consommé par `apps/cms_api` et le sera aussi par `apps/cms_front`. Il ne doit donc **jamais** dépendre du namespace `App\` ni d'une application en particulier : tout code propre à une seule app reste dans cette app.
 
### 1.1. Standards PHP & Entités (`Fagathe\CmsCore\Entity`)
 
- Toujours déclarer `declare(strict_types=1);` en tête de fichier.
- Toutes les entités utilisent un identifiant `Uuid` (`Symfony\Component\Uid\Uuid`) généré avec **`Uuid::v7()`** dans le constructeur `__construct()`, ainsi que `$this->createdAt = new \DateTimeImmutable()`.
- Tous les setters d'entités sont fluents et typés `: static`.
#### Traits transverses aux entités
 
| Trait | Utilisé sur | Rôle |
|---|---|---|
| `ConfigurableEntityTrait` | Entités configurables | Propriété JSON `$settings` initialisée avec `static::getDefaultSettings()` (via la constante `DEFAULT_SETTINGS` de l'entité). Méthodes `getSetting()`, `setSetting()`, `setSettings()`. |
| `FlaggableTrait` | `Post`, `Comment` | Compteur `$flags`, map `settings['flagged_by']`, méthodes `flagByUser(User $user, ?string $reason, ?string $comment)`, `hasBeenFlaggedBy(User $user)`, `clearFlags()`. Bascule automatique en modération au-delà de `AUTO_MODERATION_FLAG_THRESHOLD` (`5` pour `Comment`, `10` pour `Post`). |
| `LikableTrait` | `Post` | `$likesCount`, map `settings['liked_by']`, `toggleLike(User $user): bool`. |
 
#### Hiérarchie des fichiers
 
- `AbstractFile` (`#[ORM\MappedSuperclass]`) porte les métadonnées de fichier : `originalName`, `niceName`, `filePath`, `mimeType`, `type` (via `FileTypeEnum`), `extension`, `size`, `isPinned`.
- `PostMedia` étend `AbstractFile` et ajoute les relations `post`, `owner` (`User`) et `alt`.
#### Indexation Full-Text
 
- `BlocContent` extrait automatiquement le texte brut (sans HTML ni clés techniques `IGNORED_SEARCH_KEYS`) des blocs de type `SEARCHABLE_TYPES` (`BlockType::TEXT`) vers la colonne indexée `search_text` via `syncSearchText()`.
- `Post`, `Category`, `Tag` et `User` possèdent des index `fulltext` dédiés à la recherche globale.
### 1.2. Enums du domaine (`Fagathe\CmsCore\Enum`)
 
| Enum | Valeurs |
|---|---|
| `Auth\UserRole` | `ROLE_USER` (1), `ROLE_CONTRIBUTOR` (150), `ROLE_EDITOR` (200), `ROLE_MODERATOR` (250), `ROLE_MANAGER` (500), `ROLE_ADMIN` (750), `ROLE_SUPER_ADMIN` (1000). Expose `rank()`, `isAtLeast()`, `isStrictlyHigherThan()`, `mapRole()`, `choices()`, `values()`. |
| `Auth\UserRequestTypeEnum` | `otp_register`, `otp_login`, `email_verification`, `password_reset`, `email_change` |
| `Post\PostStatus` | `draft`, `review`, `rewriting`, `published`, `archived`, `trash` (rétention corbeille : `Post::TRASH_RETENTION_DAYS = 30`) |
| `Post\BlockType` | `text`, `code`, `image`, `video`, `carousel`, `gallery`, `quote`, `table`, `faq`, `cta` |
| `Post\FlagReason` | `spam`, `inappropriate`, `harassment`, `misinformation`, `copyright`, `other` |
| `CommentStatus` | `pending`, `approved`, `spam`, `rejected` |
| `ColorEnum` | `red`, `orange`, `yellow`, `green`, `blue`, `cyan`, `purple`, `violet`, `fuchsia`, `pink`, `slate`, `gray`, `stone` (utilisé sur `Tag` avec contrainte unique `[owner, color]`) |
| `Seo\SeoTargetType` | `post`, `category`, `tag`, `user_profile`, `static_page` |
| `Seo\SchemaType` | `TechArticle`, `BlogPosting`, `CollectionPage`, `WebPage`, `ContactPage`, `AboutPage`, `FAQPage`, `ProfilePage` |
| `Seo\RobotsDirective` | `index, follow`, `noindex, follow`, `index, nofollow`, `noindex, nofollow` |
| `Seo\OgType` | `website`, `article`, `profile` |
 
### 1.3. Repositories & règle stricte de persistance (`Fagathe\CmsCore\Repository`)
 
> ⚠\u{fe0f} **INTERDICTION D'`EntityManagerInterface` DANS LES SERVICES**
> Les classes de `Fagathe\CmsCore\Service\*` ne doivent **jamais** injecter ni appeler `EntityManagerInterface`.
 
Toute écriture en base passe exclusivement par les méthodes standardisées des Repositories :
 
```php
// Création
$this->xxxRepository->save($entity, flush: true, isCreation: true): bool;
 
// Modification
$this->xxxRepository->save($entity, flush: true, isCreation: false): bool;
 
// Suppression
$this->xxxRepository->remove($entity, flush: true): bool;
```
 
Toute récupération d'entité liée (ex. `Category`, `Tag` dans `PostService`) utilise `$this->categoryRepository->find(...)` ou `$this->tagRepository->find(...)` — **jamais** `$em->getReference()`.
 
Méthodes métiers spécialisées exposées par les Repositories :
 
| Repository | Méthode |
|---|---|
| `PostRepository`, `CategoryRepository`, `TagRepository`, `UserRepository` | `searchFullText(string $query, int $limit, ...)` |
| `CommentRepository` | `findRootCommentsByPost(Post $post, bool $onlyApproved)`, `findFlaggedComments(int $minFlags, int $limit)` |
| `SeoMetadataRepository` | `findByTarget(SeoTargetType\|string $type, string $identifier)` |
| `PostViewRepository` | `registerOrganicView(Post $post, string $visitorHash)` |
 
### 1.4. Services métiers (`Fagathe\CmsCore\Service`)
 
Toutes les classes de service sont `final` (sauf `PostViewTracker` si destiné à être mocké/étendu) et utilisent les traits de `Fagathe\CorePhp` : `ResponseTrait`, `RequestTrait`, `DatetimeTrait`, `LoggerTrait` (et `FileTrait` pour les services manipulant des fichiers).
 
#### Pipeline de traitement d'une requête d'écriture
 
1. **Vérification des droits** via `$this->security->isGranted(...)` (Voters) → sinon `$this->sendForbidden(...)` ou `$this->sendUnauthorized(...)`.
2. **Désérialisation** du payload JSON vers un DTO (`Fagathe\CmsCore\Dto\...`) via `SerializerInterface`.
3. **Validation du DTO** via `ValidatorInterface::validate($dto)` → si erreurs, retour immédiat `$this->sendViolations($violations)`.
4. **Hydratation de l'entité** + seconde passe de validation `$this->validator->validate($entity)` (pour vérifier les contraintes `#[UniqueEntity]`).
5. **Persistance** via `$this->repository->save($entity, flush: true, isCreation: ...)` + log structuré via `$this->generateLog(LoggerLevelEnum::Info, ...)`.
6. **Retour** via `$this->sendJson($entity, Response::HTTP_..., context: ['groups' => [...]])`.
#### Services spécifiques du package
 
- **`PostService`** — CRUD articles, corbeille (`trash`, `restore`, `deletePermanently`), gestion des blocs (`saveBlock`, `removeBlock`, `syncBlocksFromDto`), upload (`uploadThumbnail`, `uploadMedia`, `deleteMedia`), réactions (`toggleLike`, `flag`) et modération (`listForModeration`, `review` sans altérer le contenu de l'auteur).
- **`PostViewTracker`** — Comptabilisation organique des lectures d'articles publiés avec :
  - filtrage anti-bots (`BOT_PATTERN`, headers `Purpose` / `Sec-Purpose` prefetch, `DetectDevice` CLI) ;
  - empreinte SHA-256 (`IPChecker` + User-Agent + User ID + `appSecret`) ;
  - cookie journalier (`viewed_<hash>`).
- **`AttachmentFileService`** — Validation MIME/taille via `UploaderValidationService` (50 Mo max média, 10 Mo max miniature) et stockage via `UploaderService`.
- **`SeoMetadataService`** — CRUD `SeoMetadata` et génération de paquets complets `{ meta, jsonLd }` via `SeoSchemaGenerator` et `JsonLdGenerator` (`buildForArticle`, `buildForTaxonomy`, `buildForStaticPage`) pour les entités implémentant `ArticleSeoInterface` ou `TaxonomySeoInterface`.
- **`SearchService`** — Recherche Full-Text agrégée (`globalSearch`) retournant `{ posts, categories, tags, users }` avec filtrage selon `$isFront` (`onlyPublished` / `onlyVerified`).
- **`AuthService` & `UserRequestService`** — Inscription, connexion avec décodage Base64 via `SecretDecoder`, gestion des OTP/tokens temporaires (`UserRequest`), réinitialisation de mot de passe.
- **`AccountService` & `UserService`** — Gestion du profil connecté (`/account`) et administration des membres du back-office (`/users`, filtré par `getManageableRoles()`).
### 1.5. Voters & groupes de sérialisation
 
#### Voters (`Fagathe\CmsCore\Security\Voter`)
 
| Voter | Attributs |
|---|---|
| `PostVoter` | `VIEW`, `CREATE`, `EDIT`, `DELETE`, `REVIEW` |
| `CommentVoter` | `CREATE`, `EDIT`, `DELETE`, `FLAG`, `MODERATE` |
| `TaxonomyVoter` | `MANAGE_CATEGORY`, `MANAGE_TAG` |
| `UserVoter` | `LIST`, `VIEW`, `CREATE`, `EDIT`, `DELETE` |
| `CmsSettingVoter` | `MANAGE_SEO`, `MANAGE_SETTINGS` |
 
#### Groupes de sérialisation standardisés
 
| Domaine | Groupes |
|---|---|
| Post | `post.list`, `post.read`, `bloc.read`, `file.read` |
| Taxonomie | `category.list`, `category.read`, `tag.list`, `tag.read` |
| Commentaires | `comment.list`, `comment.read` |
| SEO | `seo.read` |
| Utilisateurs | `user.read` |
| Paramètres | `setting.read`, `setting.write` |
 
---
 
## 2. API back-office — `apps/cms_api` (Symfony, `App\`)
 
### 2.1. Contrôleurs (`App\Controller`)
 
- Les contrôleurs sont `final`, regroupés par domaine (`App\Controller\Post\*`, `App\Controller\Taxonomy\*`, `App\Controller\Moderation\*`, `App\Controller\Auth\*`) et ne contiennent **aucune logique métier**.
- Ils appellent le service de `Fagathe\CmsCore\Service\*` et retournent le résultat :
```php
$res = $this->service->method($request);
 
return $this->json($res->data, $res->status, $res->headers, $res->context);
```
 
- **Exception unique** : `HealthCheckController` (`GET /health-check`) vérifie la latence DB (`SELECT 1`) et les droits d'écriture sur `/var`.
### 2.2. Sécurité & authentification (`config/packages/security.yaml`)
 
- **Pas de firewall `json_login`** : la route `/api/auth/login` est en `PUBLIC_ACCESS` dans `access_control` et passe directement par `AuthController::login` → `AuthService::login`.
- **Pourquoi** : le frontend encode les mots de passe en Base64 (`encodeSecret`). `AuthService` :
  1. décode le mot de passe via `SecretDecoder` ;
  2. autorise la connexion par **username ou email** ;
  3. vérifie le hash (`isPasswordValid`) ;
  4. vérifie `$user->isVerified()` ;
  5. génère le JWT via `JWTTokenManagerInterface::create($user)`.
- Le firewall `api` (`pattern: ^/api`) est `stateless: true` avec `jwt: ~`.
---
 
## 3. Back-office — `apps/cms_bo` (React + TypeScript + Vite)
 
### 3.1. Architecture des types (`src/types/`)
 
> ⚠\u{fe0f} `src/types/auth.types.ts` regroupe **tous** les types liés à l'utilisateur. Ne **jamais** créer de fichier `user.types.ts`.
 
| Fichier | Contenu |
|---|---|
| `auth.types.ts` | `User`, `UserSummary`, `UserRole`, authentification (`LoginPayload`, `RegisterPayload`, `AuthResponse`, OTP, `ResetPassword`), administration d'utilisateurs (`CreateUserPayload`, `UpdateUserPayload`) |
| `common.types.ts` | `Uuid`, `IsoDateString`, `FlagReason`, `FlagEntry`, `ConfigurableEntity`, `FlaggableEntity`, `LikableEntity`, `PaginatedResponse`, `PaginationMeta` |
| `post.types.ts` | `Post`, `PostListItem`, `BlocContent`, `PostSettings`, `PostStatus`, `BlockType`, `SavePostPayload`, `SaveBlocContentPayload`, `ReviewPostPayload` |
| `taxonomy.types.ts` | `Category`, `CategorySummary`, `Tag`, `TagSummary`, `ColorEnum`, `SaveCategoryPayload`, `SaveTagPayload` |
| `media.types.ts` | `AbstractFile`, `PostMedia`, `FileTypeEnum`, `UploadPostMediaPayload` |
| `comment.types.ts` | `Comment`, `CommentSettings`, `CommentStatus`, `CreateCommentPayload`, `UpdateCommentPayload`, `ModerateCommentPayload` |
| `seo.types.ts` | `SeoMetadata`, `GeneratedSeoPacket`, `SeoTargetType`, `SchemaType`, `RobotsDirective`, `OgType`, `SaveSeoMetadataPayload` |
| `setting.types.ts` | `CmsSetting`, `CmsSettingValueType`, `SaveCmsSettingPayload` |
| `index.ts` | Barrel export global + `GlobalSearchResponse` |
 
### 3.2. Organisation des pages par fonctionnalité (`src/pages/<feature>/`)
 
Le dossier **`src/pages/auth/` est le modèle de référence**. Chaque fonctionnalité (`moderation`, `post`, `search`, `seo`, `taxonomy`, `user`…) reproduit la même structure.
 
```text
src/pages/
├── auth/
│   ├── components/                  # Sous-composants propres à la fonctionnalité
│   │   ├── ChangeAvatarForm.tsx
│   │   ├── ChangeEmailForm.tsx
│   │   ├── ChangeInformationsForm.tsx
│   │   ├── ChangePasswordForm.tsx
│   │   ├── ProfileForms.styles.tsx  # Styles partagés par plusieurs composants du groupe
│   │   └── index.ts                 # Barrel des composants
│   ├── ForgotPasswordPage.tsx
│   ├── LoginPage.tsx
│   ├── LogoutPage.tsx
│   ├── ProfilePage.tsx
│   ├── RegisterPage.tsx
│   ├── ResendOtpPage.tsx
│   ├── ResetPasswordPage.tsx
│   ├── VerifyOtpPage.tsx
│   └── index.ts                     # Barrel des pages de la fonctionnalité
├── moderation/
├── post/
├── search/
├── seo/
├── taxonomy/
├── user/
└── index.ts                         # Barrel global de toutes les pages
```
 
#### Pages (`<Nom>Page.tsx`)
 
- **Un fichier par route**, suffixé `Page`, avec un export nommé : `export const LoginPage = () => { … }`.
- **La page orchestre, elle ne détaille pas** : elle lit le store, les paramètres d'URL (`useSearchParams`, `useLocation`), gère la navigation et les messages, puis compose ses sous-composants.
- Dès qu'un bloc a une responsabilité propre (un formulaire, une carte, une zone d'action), il est extrait dans `components/`. Exemple : `ProfilePage` ne contient que la bannière, les onglets et la composition des `Change*Form`.
#### Composants de fonctionnalité (`components/`)
 
- **Un composant par fichier**, nommé selon son rôle (`Change<Chose>Form`, `<Chose>List`, `<Chose>Card`…).
- **Composants autonomes** : chaque composant lit et met à jour lui-même le store (`useAuthStore((s) => s.user)`, `setUser`), appelle son service et gère son propre état `loading` / `feedback`. La page n'a pas à lui transmettre de callbacks ou de données qu'il peut obtenir seul.
- **Barrel `index.ts`** obligatoire : la page importe via `import { … } from './components'`.
- **Styles** :
  - utilisés par un seul composant → `styled-components` déclarés en haut du fichier du composant ;
  - partagés par plusieurs composants du même groupe → fichier `<Groupe>.styles.tsx`, importé avec `import * as S from './<Groupe>.styles'` et utilisé en `<S.FormCard>`, `<S.Label>`…
#### Couche données
 
- **Appels API** : uniquement dans `src/services/<feature>.api.ts`, avec des verbes explicites (`fetchLogin`, `fetchProfile`, `updateEmail`, `deleteAccount`…). Aucun `fetch` direct dans un composant.
- **État global** : `src/stores/<feature>.store.ts`, consommé par sélecteur (`useAuthStore((state) => state.logout)`) pour limiter les re-rendus.
- **Types** : `src/types/<feature>.types.ts` (voir 3.1).
#### Formulaires
 
- **`react-hook-form` + `zod` + `zodResolver`** :
  - schéma déclaré en haut du fichier (`const loginSchema = z.object({ … })`) ;
  - type dérivé `type LoginFormData = z.infer<typeof loginSchema>` ;
  - `defaultValues` toujours explicites ;
  - `<form noValidate>` (la validation est portée par zod) ;
  - messages de validation en français.
- **Champs** via le Design System : `<TextField label=… error={errors.x?.message} {...register('x')} />`.
- **Erreur API** : état `apiError` remis à `null` au début de chaque soumission, affiché dans `<Alert variant="danger">`, avec un message de repli si l'erreur n'est pas une instance d'`Error`.
- **Message de succès après redirection** : transmis via `navigate('/route', { state: { successMessage } })` et lu avec une interface typée `<Nom>LocationState`.
#### Découper quand ça grossit
 
- **Schéma zod réutilisé** par plusieurs pages (ex. règles de mot de passe communes à `RegisterPage` et `ResetPasswordPage`) → `src/pages/<feature>/schemas/<nom>.schema.ts`.
- **Logique avec état réutilisable** (soumission, chargement, feedback) → `src/pages/<feature>/hooks/use<Nom>.ts`.
- Ces sous-dossiers suivent la même règle de barrel `index.ts` que `components/`.
#### UI & divers
 
- Importer le Design System via le barrel `@/ui/components` (`import { Alert, Button, Card } from '@/ui/components'`).
- Utiliser les tokens du thème (`theme.colors.*`, `theme.radii.*`) et les variantes du Design System (`Alert variant="success"`, `Button variant=…`) plutôt que des couleurs en dur ou des composants de feedback recréés localement.
- **Fonctionnalités différées** : le code prévu pour un lot ultérieur est conservé en commentaire avec la mention `Lot N : <dépendance>` (ex. `// Lot 2 : mailer`), pas supprimé.
### 3.3. Séparation droits / permissions
 
<!-- TODO : section tronquée dans la version source — à compléter. -->
 
---
 
## 4. Front blog — `apps/cms_front` (Symfony, rendu serveur)
 
Application Symfony publique du blog, rendue côté serveur. Comme `cms_api`, elle s'appuie directement sur le package `packages/cms-core` (entités, repositories, services, générateurs SEO/JSON-LD) plutôt que de passer par l'API. Elle couvre :
 
- **Rendu des contenus** — articles, catégories, tags et pages statiques.
- **Gestion de profil** — espace personnel de l'utilisateur connecté.
- **SEO-GEO** — le rendu PHP côté serveur livre aux moteurs de recherche et aux moteurs génératifs un HTML complet, avec balises meta et JSON-LD dès la première réponse.
<!-- TODO : à compléter — authentification (session ?), structure des contrôleurs/templates Twig, conventions de rendu SEO. -->