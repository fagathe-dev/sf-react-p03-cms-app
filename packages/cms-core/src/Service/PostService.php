<?php

declare(strict_types=1);

namespace Fagathe\CmsCore\Service;

use Fagathe\CmsCore\Dto\Post\SaveBlocContentDto;
use Fagathe\CmsCore\Dto\Post\SavePostDto;
use Fagathe\CmsCore\Dto\Post\UploadPostMediaDto;
use Fagathe\CmsCore\Dto\Post\UploadPostThumbnailDto;
use Fagathe\CmsCore\Dto\Post\ReviewPostDto;
use Fagathe\CmsCore\Entity\BlocContent;
use Fagathe\CmsCore\Entity\Category;
use Fagathe\CmsCore\Entity\Post;
use Fagathe\CmsCore\Entity\PostMedia;
use Fagathe\CmsCore\Entity\Tag;
use Fagathe\CmsCore\Entity\User;
use Fagathe\CmsCore\Enum\Post\PostStatus;
use Fagathe\CmsCore\Repository\BlocContentRepository;
use Fagathe\CmsCore\Repository\CategoryRepository;
use Fagathe\CmsCore\Repository\PostMediaRepository;
use Fagathe\CmsCore\Repository\PostRepository;
use Fagathe\CmsCore\Repository\TagRepository;
use Fagathe\CorePhp\Enum\LoggerLevelEnum;
use Fagathe\CorePhp\Http\RequestTrait;
use Fagathe\CorePhp\Http\ResponseTrait;
use Fagathe\CorePhp\Trait\DatetimeTrait;
use Fagathe\CorePhp\Trait\LoggerTrait;
use Fagathe\CorePhp\Uploader\FileUploadException;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Serializer\SerializerInterface;
use Symfony\Component\String\Slugger\SluggerInterface;
use Symfony\Component\Uid\Uuid;
use Symfony\Component\Validator\Validator\ValidatorInterface;
use Throwable;

final class PostService
{
    use ResponseTrait, DatetimeTrait, LoggerTrait, RequestTrait;

    public function __construct(
        private readonly PostRepository $postRepository,
        private readonly BlocContentRepository $blocRepository,
        private readonly PostMediaRepository $mediaRepository,
        private readonly CategoryRepository $categoryRepository,
        private readonly TagRepository $tagRepository,
        private readonly SerializerInterface $serializer,
        private readonly ValidatorInterface $validator,
        private readonly SluggerInterface $slugger,
        private readonly AttachmentFileService $attachmentService,
        private readonly FilePathResolver $fileResolver,
        private readonly PostViewTracker $viewTracker,
        private readonly Security $security,
    ) {}

    public function list(Request $request, bool $onlyPublished = false): object
    {
        $query = trim((string) $request->query->get('q', ''));
        $limit = max(1, min(100, (int) $request->query->get('limit', 20)));
        $page = max(1, (int) $request->query->get('page', 1));
        $statusParam = $request->query->get('status');

        if ($query !== '') {
            $posts = $this->postRepository->searchFullText($query, $limit, $onlyPublished);

            return $this->sendJson($posts, Response::HTTP_OK, context: ['groups' => ['post.list']]);
        }

        $criteria = [];
        if ($onlyPublished) {
            $criteria['status'] = PostStatus::PUBLISHED;
        } elseif (is_string($statusParam) && PostStatus::tryFrom($statusParam) !== null) {
            $criteria['status'] = PostStatus::from($statusParam);
        }

        $offset = ($page - 1) * $limit;
        $posts = $this->postRepository->findBy($criteria, ['createdAt' => 'DESC'], $limit, $offset);
        $total = $this->postRepository->count($criteria);

        return $this->sendJson(
            [
                'items' => $posts,
                'meta'  => [
                    'page'  => $page,
                    'limit' => $limit,
                    'total' => $total,
                    'pages' => (int) ceil($total / $limit),
                ],
            ],
            Response::HTTP_OK,
            context: ['groups' => ['post.list']]
        );
    }

    public function show(string $identifier, Request $request, bool $trackView = false): object
    {
        $post = Uuid::isValid($identifier)
            ? $this->postRepository->find(Uuid::fromString($identifier))
            : $this->postRepository->findOneBy(['slug' => $identifier]);

        if (!$post instanceof Post) {
            return $this->notFoundResponse('Article introuvable.');
        }

        if (!$this->security->isGranted(\Fagathe\CmsCore\Security\Voter\PostVoter::VIEW, $post)) {
            return $this->sendForbidden('Vous n\'avez pas accès à cet article.');
        }

        if ($trackView) {
            $this->viewTracker->track($post, $request);
        }

        return $this->sendJson(
            $post,
            Response::HTTP_OK,
            context: ['groups' => ['post.read', 'file.read', 'bloc.read']]
        );
    }

    public function create(Request $request): object
    {
        if (!$this->security->isGranted(\Fagathe\CmsCore\Security\Voter\PostVoter::CREATE)) {
            return $this->sendForbidden('Vous n\'avez pas les droits nécessaires pour rédiger un article.');
        }

        try {
            /** @var SavePostDto $dto */
            $dto = $this->serializer->deserialize($request->getContent(), SavePostDto::class, 'json');
        } catch (Throwable) {
            return $this->sendJson(['message' => 'Format de données JSON invalide.'], Response::HTTP_BAD_REQUEST);
        }

        $violations = $this->validator->validate($dto);
        if (count($violations) > 0) {
            return $this->sendViolations($violations);
        }

        $post = new Post();
        $user = $this->security->getUser();
        if ($user instanceof User) {
            $post->setAuthor($user);
        }

        $this->hydratePostFromDto($post, $dto, isNew: true);

        $entityViolations = $this->validator->validate($post);
        if (count($entityViolations) > 0) {
            return $this->sendViolations($entityViolations);
        }

        if (!$this->postRepository->save($post, flush: true, isCreation: true)) {
            return $this->sendJson(
                ['message' => 'Erreur interne lors de la création de l\'article.'],
                Response::HTTP_INTERNAL_SERVER_ERROR
            );
        }

        $this->generateLog(
            LoggerLevelEnum::Info,
            [
                'message' => 'Article créé avec succès',
                'data'    => ['post_id' => (string) $post->getId(), 'slug' => $post->getSlug()],
            ],
            ['action' => 'post.create.success']
        );

        return $this->sendJson(
            $post,
            Response::HTTP_CREATED,
            context: ['groups' => ['post.read', 'file.read', 'bloc.read']]
        );
    }

    public function update(string $id, Request $request): object
    {
        $post = $this->findPostById($id);
        if (!$post instanceof Post) {
            return $this->notFoundResponse('Article introuvable.');
        }

        if (!$this->security->isGranted(\Fagathe\CmsCore\Security\Voter\PostVoter::EDIT, $post)) {
            return $this->sendForbidden('Vous ne pouvez modifier que vos propres articles.');
        }

        try {
            /** @var SavePostDto $dto */
            $dto = $this->serializer->deserialize($request->getContent(), SavePostDto::class, 'json');
        } catch (Throwable) {
            return $this->sendJson(['message' => 'Format de données JSON invalide.'], Response::HTTP_BAD_REQUEST);
        }

        $violations = $this->validator->validate($dto);
        if (count($violations) > 0) {
            return $this->sendViolations($violations);
        }

        $this->hydratePostFromDto($post, $dto, isNew: false);

        $entityViolations = $this->validator->validate($post);
        if (count($entityViolations) > 0) {
            return $this->sendViolations($entityViolations);
        }

        if (!$this->postRepository->save($post, flush: true, isCreation: false)) {
            return $this->sendJson(
                ['message' => 'Erreur interne lors de la mise à jour de l\'article.'],
                Response::HTTP_INTERNAL_SERVER_ERROR
            );
        }

        $this->generateLog(
            LoggerLevelEnum::Info,
            [
                'message' => 'Article mis à jour',
                'data'    => ['post_id' => (string) $post->getId()],
            ],
            ['action' => 'post.update.success']
        );

        return $this->sendJson(
            $post,
            Response::HTTP_OK,
            context: ['groups' => ['post.read', 'file.read', 'bloc.read']]
        );
    }

    public function saveBlock(string $postId, Request $request, ?string $blockId = null): object
    {
        $post = $this->findPostById($postId);
        if (!$post instanceof Post) {
            return $this->notFoundResponse('Article introuvable.');
        }

        if (!$this->security->isGranted(\Fagathe\CmsCore\Security\Voter\PostVoter::EDIT, $post)) {
            return $this->sendForbidden('Vous ne pouvez modifier que vos propres articles.');
        }

        try {
            /** @var SaveBlocContentDto $dto */
            $dto = $this->serializer->deserialize($request->getContent(), SaveBlocContentDto::class, 'json');
        } catch (Throwable) {
            return $this->sendJson(['message' => 'Format de données JSON invalide.'], Response::HTTP_BAD_REQUEST);
        }

        $violations = $this->validator->validate($dto);
        if (count($violations) > 0) {
            return $this->sendViolations($violations);
        }

        $isCreation = true;
        if ($blockId !== null) {
            $block = Uuid::isValid($blockId) ? $this->blocRepository->find(Uuid::fromString($blockId)) : null;
            if (!$block instanceof BlocContent || (string) $block->getPost()?->getId() !== (string) $post->getId()) {
                return $this->notFoundResponse('Bloc de contenu introuvable.');
            }
            $isCreation = false;
        } else {
            $block = new BlocContent();
            $post->addBlock($block);
        }

        $block
            ->setType($dto->type)
            ->setData($dto->data)
            ->setPosition($dto->position);

        if ($dto->settings !== null) {
            $block->setSettings($dto->settings);
        }

        $this->blocRepository->save($block, flush: true, isCreation: $isCreation);
        $this->postRepository->save($post, flush: true, isCreation: false);

        return $this->sendJson(
            $block,
            $isCreation ? Response::HTTP_CREATED : Response::HTTP_OK,
            context: ['groups' => ['bloc.read']]
        );
    }

    public function removeBlock(string $postId, string $blockId): object
    {
        $post = $this->findPostById($postId);
        if (!$post instanceof Post) {
            return $this->notFoundResponse('Article introuvable.');
        }

        if (!$this->security->isGranted(\Fagathe\CmsCore\Security\Voter\PostVoter::EDIT, $post)) {
            return $this->sendForbidden('Vous ne pouvez modifier que vos propres articles.');
        }

        $block = Uuid::isValid($blockId) ? $this->blocRepository->find(Uuid::fromString($blockId)) : null;
        if (!$block instanceof BlocContent || (string) $block->getPost()?->getId() !== (string) $post->getId()) {
            return $this->notFoundResponse('Bloc de contenu introuvable.');
        }

        $post->removeBlock($block);
        $this->blocRepository->remove($block, flush: false);
        $this->postRepository->save($post, flush: true, isCreation: false);

        return $this->sendNoContent();
    }

    public function uploadThumbnail(string $postId, Request $request): object
    {
        $post = $this->findPostById($postId);
        if (!$post instanceof Post) {
            return $this->notFoundResponse('Article introuvable.');
        }

        if (!$this->security->isGranted(\Fagathe\CmsCore\Security\Voter\PostVoter::EDIT, $post)) {
            return $this->sendForbidden('Vous ne pouvez modifier que vos propres articles.');
        }

        $uploadedFile = $request->files->get('thumbnail') ?? $request->files->get('file');
        $dto = new UploadPostThumbnailDto($uploadedFile);

        $violations = $this->validator->validate($dto);
        if (count($violations) > 0) {
            return $this->sendViolations($violations);
        }

        try {
            $thumbnailUrl = $this->attachmentService->uploadPostThumbnail($dto->file, $post);
            $this->postRepository->save($post, flush: true, isCreation: false);

            return $this->sendJson(['thumbnail' => $thumbnailUrl], Response::HTTP_OK);
        } catch (FileUploadException $e) {
            return $this->sendJson(['message' => $e->getMessage()], Response::HTTP_UNPROCESSABLE_ENTITY);
        }
    }

    public function uploadMedia(string $postId, Request $request): object
    {
        $post = $this->findPostById($postId);
        if (!$post instanceof Post) {
            return $this->notFoundResponse('Article introuvable.');
        }

        if (!$this->security->isGranted(\Fagathe\CmsCore\Security\Voter\PostVoter::EDIT, $post)) {
            return $this->sendForbidden('Vous ne pouvez modifier que vos propres articles.');
        }

        $user = $this->security->getUser();
        if (!$user instanceof User) {
            return $this->sendJson(['message' => 'Authentification requise.'], Response::HTTP_UNAUTHORIZED);
        }

        $dto = new UploadPostMediaDto(
            file: $request->files->get('file') ?? $request->files->get('media'),
            alt: $request->request->get('alt'),
            niceName: $request->request->get('niceName'),
            isPinned: filter_var($request->request->get('isPinned', false), FILTER_VALIDATE_BOOLEAN),
        );

        $violations = $this->validator->validate($dto);
        if (count($violations) > 0) {
            return $this->sendViolations($violations);
        }

        try {
            $media = $this->attachmentService->upload($dto->file, $post, $user, $dto->alt);
            if ($dto->niceName !== null || $dto->isPinned) {
                $media->setNiceName($dto->niceName)->setIsPinned($dto->isPinned);
                $this->mediaRepository->save($media, flush: true, isCreation: false);
            }

            return $this->sendJson($media, Response::HTTP_CREATED, context: ['groups' => ['file.read', 'post.read']]);
        } catch (FileUploadException $e) {
            return $this->sendJson(['message' => $e->getMessage()], Response::HTTP_UNPROCESSABLE_ENTITY);
        }
    }

    public function deleteMedia(string $postId, string$mediaId): object
    {
        $post = $this->findPostById($postId);
        if (!$post instanceof Post) {
            return $this->notFoundResponse('Article introuvable.');
        }

        if (!$this->security->isGranted(\Fagathe\CmsCore\Security\Voter\PostVoter::EDIT,$post)) {
            return $this->sendForbidden('Vous ne pouvez modifier que vos propres articles.');
        }

        $media = Uuid::isValid($mediaId) ? $this->mediaRepository->find(Uuid::fromString($mediaId)) : null;
        if (!$media instanceof PostMedia || (string) $media->getPost()?->getId() !== (string)$post->getId()) {
            return $this->notFoundResponse('Média introuvable pour cet article.');
        }

        if (!$this->attachmentService->delete($media)) {
            return $this->sendJson(
                ['message' => 'Erreur interne lors de la suppression du média.'],
                Response::HTTP_INTERNAL_SERVER_ERROR
            );
        }

        return $this->sendNoContent();
    }

    public function trash(string $id): object
    {
        $post = $this->findPostById($id);
        if (!$post instanceof Post) {
            return $this->notFoundResponse('Article introuvable.');
        }

        if (!$this->security->isGranted(\Fagathe\CmsCore\Security\Voter\PostVoter::DELETE,$post)) {
            return $this->sendForbidden('Vous n\'avez pas les droits pour supprimer cet article.');
        }

        $post->moveToTrash();
        $this->postRepository->save($post, flush: true, isCreation: false);

        return $this->sendJson(
            ['message' => 'Article déplacé dans la corbeille.', 'post' => $post],
            Response::HTTP_OK,
            context: ['groups' => ['post.list']]
        );
    }

    public function restore(string $id): object
    {
        $post = $this->findPostById($id);
        if (!$post instanceof Post) {
            return $this->notFoundResponse('Article introuvable.');
        }

        if (!$this->security->isGranted(\Fagathe\CmsCore\Security\Voter\PostVoter::DELETE,$post)) {
            return $this->sendForbidden('Vous n\'avez pas les droits pour supprimer cet article.');
        }

        $post->restoreFromTrash();
        $this->postRepository->save($post, flush: true, isCreation: false);

        return $this->sendJson(
            ['message' => 'Article restauré en brouillon.', 'post' => $post],
            Response::HTTP_OK,
            context: ['groups' => ['post.list']]
        );
    }

    public function deletePermanently(string $id): object
    {
        $post = $this->findPostById($id);
        if (!$post instanceof Post) {
            return $this->notFoundResponse('Article introuvable.');
        }

        if (!$this->security->isGranted(\Fagathe\CmsCore\Security\Voter\PostVoter::DELETE,$post)) {
            return $this->sendForbidden('Vous n\'avez pas les droits pour supprimer cet article.');
        }

        $this->attachmentService->deleteByPost($post);
        $this->postRepository->remove($post, flush: true);

        $this->generateLog(
            LoggerLevelEnum::Info,
            [
                'message' => 'Article supprimé définitivement',
                'data'    => ['post_id' => $id, 'title' =>$post->getTitle()],
            ],
            ['action' => 'post.delete.permanent']
        );

        return $this->sendNoContent();
    }

    public function toggleLike(string $postId): object
    {
        $user =$this->security->getUser();
        if (!$user instanceof User) {
            return $this->sendUnauthorized('Vous devez être connecté pour aimer un article.');
        }

        $post = $this->findPostById($postId);
        if (!$post instanceof Post ||$post->getStatus() !== PostStatus::PUBLISHED) {
            return $this->notFoundResponse('Article introuvable.');
        }

        if (!$post->areLikesAllowed()) {
            return $this->sendForbidden('Les réactions sont désactivées sur cet article.');
        }

        $liked = $post->toggleLike($user);
        $this->postRepository->save($post, flush: true, isCreation: false);

        return $this->sendJson([
            'liked'      => $liked,
            'likesCount' => $post->getLikesCount(),
            'message'    => $liked ? 'Vous aimez cet article.' : 'Mention "J\'aime" retirée.',
        ]);
    }

    public function flag(string $postId, Request$request): object
    {
        $user =$this->security->getUser();
        if (!$user instanceof User) {
            return $this->sendUnauthorized('Vous devez être connecté pour signaler un article.');
        }

        $post = $this->findPostById($postId);
        if (!$post instanceof Post ||$post->getStatus() !== PostStatus::PUBLISHED) {
            return $this->notFoundResponse('Article introuvable.');
        }

        if ((string) $post->getAuthor()?->getId() === (string)$user->getId()) {
            return $this->sendJson(
                ['message' => 'Vous ne pouvez pas signaler votre propre article.'],
                Response::HTTP_UNPROCESSABLE_ENTITY
            );
        }

        try {
            /** @var \Fagathe\CmsCore\Dto\Common\FlagContentDto $dto */$dto = $this->serializer->deserialize($request->getContent(),
                \Fagathe\CmsCore\Dto\Common\FlagContentDto::class,
                'json'
            );
        } catch (Throwable) {
            return $this->sendJson(['message' => 'Format de données JSON invalide.'], Response::HTTP_BAD_REQUEST);
        }

        $violations = $this->validator->validate($dto);
        if (count($violations) > 0) {
            return $this->sendViolations($violations);
        }

        if (!$post->flagByUser($user, $dto->reason,$dto->comment)) {
            return $this->sendJson(
                ['message' => 'Vous avez déjà signalé cet article.'],
                Response::HTTP_CONFLICT
            );
        }

        $this->postRepository->save($post, flush: true, isCreation: false);

        $this->generateLog(
            LoggerLevelEnum::Notice,
            [
                'message' => 'Article signalé par un utilisateur',
                'data'    => [
                    'post_id' => (string) $post->getId(),
                    'flags'   => $post->getFlags(),
                    'reason'  => $dto->reason,
                    'comment' => $dto->comment,
                ],
            ],
            ['action' => 'post.flag', 'uid' => (string) $user->getId()]
        );

        return $this->sendJson([
            'message' => 'L\'article a bien été signalé à la modération.',
            'flags'   => $post->getFlags(),
        ]);
    }

    public function review(string $id, Request$request): object
    {
        $post = $this->findPostById($id);
        if (!$post instanceof Post) {
            return $this->notFoundResponse('Article introuvable.');
        }

        if (!$this->security->isGranted(\Fagathe\CmsCore\Security\Voter\PostVoter::REVIEW,$post)) {
            return $this->sendForbidden('Vous n\'êtes pas autorisé à modérer cet article.');
        }

        try {
            /** @var ReviewPostDto $dto */$dto = $this->serializer->deserialize($request->getContent(),
                ReviewPostDto::class,
                'json'
            );
        } catch (Throwable) {
            return $this->sendJson(['message' => 'Format de données JSON invalide.'], Response::HTTP_BAD_REQUEST);
        }

        $violations = $this->validator->validate($dto);
        if (count($violations) > 0) {
            return $this->sendViolations($violations);
        }

        /** @var User|null $moderator */
        $moderator =$this->security->getUser();

        $post
            ->setStatus($dto->status)
            ->setSetting('reviewed_by', $moderator instanceof User ? (string) $moderator->getId() : null)
            ->setSetting('reviewed_at', $this->now()->format(\DateTimeInterface::ATOM))
            ->setSetting('moderation_note', $dto->moderationNote !== null ? trim($dto->moderationNote) : null);

        if ($dto->resetFlags || PostStatus::from($dto->status) === PostStatus::PUBLISHED) {$post->clearFlags();
        }

        $this->postRepository->save($post, flush: true, isCreation: false);

        $this->generateLog(
            LoggerLevelEnum::Info,
            [
                'message' => 'Statut de l\'article modifié par la modération',
                'data'    => [
                    'post_id' => (string) $post->getId(),
                    'status'  => $post->getStatus()->value,
                    'note'    => $dto->moderationNote,
                ],
            ],
            [
                'action' => 'post.review',
                'uid'    => $moderator instanceof User ? (string) $moderator->getId() : null,
            ]
        );

        return $this->sendJson($post,
            Response::HTTP_OK,
            context: ['groups' => ['post.read', 'file.read', 'bloc.read']]
        );
    }

    public function listForModeration(Request $request): object
    {
        if (!$this->security->isGranted('ROLE_MODERATOR')) {
            return $this->sendForbidden('Accès réservé à la modération.');
        }

        $onlyFlagged = filter_var($request->query->get('flagged', false), FILTER_VALIDATE_BOOLEAN);
        $limit = max(1, min(100, (int)$request->query->get('limit', 50)));

        $qb =$this->postRepository->createQueryBuilder('p')
            ->leftJoin('p.author', 'a')->addSelect('a')
            ->leftJoin('p.category', 'c')->addSelect('c')
            ->setMaxResults($limit);

        if ($onlyFlagged) {$qb->andWhere('p.flags >= 1')
                ->orderBy('p.flags', 'DESC')
                ->addOrderBy('p.updatedAt', 'DESC');
        } else {
            $qb->andWhere('p.status IN (:statuses) OR p.flags >= 1')
                ->setParameter('statuses', [PostStatus::REVIEW, PostStatus::REWRITING])
                ->orderBy('p.flags', 'DESC')
                ->addOrderBy('p.createdAt', 'DESC');
        }

        return $this->sendJson($qb->getQuery()->getResult(), Response::HTTP_OK, context: ['groups' => ['post.list', 'post.read']]);
    }

    private function findPostById(string $id): ?Post
    {
        if (!Uuid::isValid($id)) {
            return null;
        }

        return $this->postRepository->find(Uuid::fromString($id));
    }

    private function hydratePostFromDto(Post $post, SavePostDto $dto, bool$isNew): void
    {
        $post->setTitle(trim($dto->title));

        $rawSlug = ($dto->slug !== null && trim($dto->slug) !== '')
            ? trim($dto->slug)
            : ($isNew || !$post->getSlug() ? $post->getTitle() :$post->getSlug());

        $post->setSlug(strtolower($this->slugger->slug((string)$rawSlug)->toString()));
        $post->setExcerpt($dto->excerpt !== null && trim($dto->excerpt) !== '' ? trim($dto->excerpt) : null);

        if ($dto->thumbnail !== null) {
            // Le front renvoie l'URL absolue reçue de l'API : on stocke le chemin relatif
            $post->setThumbnail($this->fileResolver->toStoredPath($dto->thumbnail));
        }

        $post->setStatus($dto->status);

        if ($dto->settings !== null) {
            $post->setSettings($dto->settings);
        }

        $category = ($dto->categoryId !== null && Uuid::isValid($dto->categoryId))
            ? $this->categoryRepository->find(Uuid::fromString($dto->categoryId))
            : null;
        $post->setCategory($category);

        if ($dto->tagIds !== null) {$post->clearTags();
            foreach ($dto->tagIds as$tagId) {
                if (Uuid::isValid($tagId)) {
                    /** @var Tag|null $tagRef */$tagRef = $this->tagRepository->find(Uuid::fromString($tagId));
                    if ($tagRef instanceof Tag) {
                        $post->addTag($tagRef);
                    }
                }
            }
        }

        if ($dto->blocks !== null) {$this->syncBlocksFromDto($post,$dto->blocks);
        }
    }

    /**
     * @param SaveBlocContentDto[] $blocksDtos
     */
    private function syncBlocksFromDto(Post $post, array $blocksDtos): void
    {
        $existingBlocks = [];
        foreach ($post->getBlocks() as $b) {
            if ($b->getId() !== null) {
                $existingBlocks[(string) $b->getId()] = $b;
            }
        }

        $keptIds = [];
        $position = 1;

        foreach ($blocksDtos as $blockDto) {
            if ($blockDto->id !== null && isset($existingBlocks[$blockDto->id])) {
                $block = $existingBlocks[$blockDto->id];
                $keptIds[$blockDto->id] = true;
            } else {
                $block = new BlocContent();
                $post->addBlock($block);
            }

            $block
                ->setType($blockDto->type)
                ->setData($blockDto->data)
                ->setPosition($blockDto->position > 0 ? $blockDto->position : $position);

            if ($blockDto->settings !== null) {
                $block->setSettings($blockDto->settings);
            }

            ++$position;
        }

        foreach ($existingBlocks as $id => $existingBlock) {
            if (!isset($keptIds[$id])) {
                $post->removeBlock($existingBlock);
                $this->blocRepository->remove($existingBlock, flush: false);
            }
        }

        $post->reorderBlocks();
    }
}