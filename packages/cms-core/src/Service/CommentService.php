<?php

declare(strict_types=1);

namespace Fagathe\CmsCore\Service;

use Fagathe\CmsCore\Dto\Comment\CreateCommentDto;
use Fagathe\CmsCore\Dto\Comment\ModerateCommentDto;
use Fagathe\CmsCore\Dto\Comment\UpdateCommentDto;
use Fagathe\CmsCore\Dto\Common\FlagContentDto;
use Fagathe\CmsCore\Entity\Comment;
use Fagathe\CmsCore\Entity\Post;
use Fagathe\CmsCore\Entity\User;
use Fagathe\CmsCore\Enum\CommentStatus;
use Fagathe\CmsCore\Repository\CommentRepository;
use Fagathe\CmsCore\Repository\PostRepository;
use Fagathe\CmsCore\Security\Voter\CommentVoter;
use Fagathe\CorePhp\Enum\LoggerLevelEnum;
use Fagathe\CorePhp\Http\RequestTrait;
use Fagathe\CorePhp\Http\ResponseTrait;
use Fagathe\CorePhp\Trait\DatetimeTrait;
use Fagathe\CorePhp\Trait\LoggerTrait;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Serializer\SerializerInterface;
use Symfony\Component\Uid\Uuid;
use Symfony\Component\Validator\Validator\ValidatorInterface;
use Throwable;

final class CommentService
{
    use ResponseTrait, DatetimeTrait, LoggerTrait, RequestTrait;

    public function __construct(
        private readonly CommentRepository $commentRepository,
        private readonly PostRepository $postRepository,
        private readonly SerializerInterface $serializer,
        private readonly ValidatorInterface $validator,
        private readonly Security $security,
    ) {}

    public function listByPost(string $postId, bool $onlyApproved = true): object
    {
        if (!Uuid::isValid($postId)) {
            return $this->notFoundResponse('Article introuvable.');
        }

        $post = $this->postRepository->find(Uuid::fromString($postId));
        if (!$post instanceof Post) {
            return $this->notFoundResponse('Article introuvable.');
        }

        if (!$onlyApproved && !$this->security->isGranted('ROLE_MODERATOR')) {
            $onlyApproved = true;
        }

        $comments = $this->commentRepository->findRootCommentsByPost($post, $onlyApproved);

        return $this->sendJson($comments, Response::HTTP_OK, context: ['groups' => ['comment.read']]);
    }

    public function listForModeration(Request $request): object
    {
        if (!$this->security->isGranted('ROLE_MODERATOR')) {
            return $this->sendForbidden('Accès réservé à la modération.');
        }

        $onlyFlagged = filter_var($request->query->get('flagged', false), FILTER_VALIDATE_BOOLEAN);
        $limit = max(1, min(100, (int) $request->query->get('limit', 50)));

        if ($onlyFlagged) {
            $comments = $this->commentRepository->findFlaggedComments(minFlags: 1, limit: $limit);

            return $this->sendJson($comments, Response::HTTP_OK, context: ['groups' => ['comment.list', 'comment.read']]);
        }

        $statusParam = $request->query->get('status');
        $criteria = [];
        if (is_string($statusParam) && CommentStatus::tryFrom($statusParam) !== null) {
            $criteria['status'] = CommentStatus::from($statusParam);
        }

        $comments = $this->commentRepository->findBy($criteria, ['createdAt' => 'DESC'], $limit);

        return $this->sendJson($comments, Response::HTTP_OK, context: ['groups' => ['comment.list', 'comment.read']]);
    }

    public function create(Request $request): object
    {
        $user = $this->getAuthenticatedUser();
        if (!$user instanceof User) {
            return $this->sendUnauthorized('Vous devez être connecté pour publier un commentaire.');
        }

        if (!$this->security->isGranted(CommentVoter::CREATE)) {
            return $this->sendForbidden('Vous n\'êtes pas autorisé à publier un commentaire.');
        }

        try {
            /** @var CreateCommentDto $dto */
            $dto = $this->serializer->deserialize($request->getContent(), CreateCommentDto::class, 'json');
        } catch (Throwable) {
            return $this->sendJson(['message' => 'Format de données JSON invalide.'], Response::HTTP_BAD_REQUEST);
        }

        $violations = $this->validator->validate($dto);
        if (count($violations) > 0) {
            return $this->sendViolations($violations);
        }

        $post = $this->postRepository->find(Uuid::fromString($dto->postId));
        if (!$post instanceof Post) {
            return $this->notFoundResponse('Article introuvable.');
        }

        if (!$post->areCommentsAllowed()) {
            return $this->sendForbidden('Les commentaires sont fermés sur cet article.');
        }

        $comment = (new Comment())
            ->setPost($post)
            ->setOwner($user)
            ->setContent(trim($dto->content))
            ->setStatus(CommentStatus::PENDING);

        if ($dto->parentId !== null) {
            $parent = $this->commentRepository->find(Uuid::fromString($dto->parentId));
            if (!$parent instanceof Comment || (string) $parent->getPost()?->getId() !== (string) $post->getId()) {
                return $this->notFoundResponse('Commentaire parent introuvable sur cet article.');
            }
            $comment->setParent($parent);
        }

        $entityViolations = $this->validator->validate($comment);
        if (count($entityViolations) > 0) {
            return $this->sendViolations($entityViolations);
        }

        if (!$this->commentRepository->save($comment, flush: true, isCreation: true)) {
            return $this->sendJson(
                ['message' => 'Erreur interne lors de l\'enregistrement du commentaire.'],
                Response::HTTP_INTERNAL_SERVER_ERROR
            );
        }

        $this->generateLog(
            LoggerLevelEnum::Info,
            [
                'message' => 'Nouveau commentaire créé',
                'data'    => [
                    'comment_id' => (string) $comment->getId(),
                    'post_id'    => (string) $post->getId(),
                    'user_id'    => (string) $user->getId(),
                ],
            ],
            ['action' => 'comment.create.success', 'uid' => (string) $user->getId()]
        );

        return $this->sendJson($comment, Response::HTTP_CREATED, context: ['groups' => ['comment.read']]);
    }

    public function update(string $id, Request $request): object
    {
        $user = $this->getAuthenticatedUser();
        if (!$user instanceof User) {
            return $this->sendUnauthorized('Authentification requise.');
        }

        $comment = $this->findCommentById($id);
        if (!$comment instanceof Comment) {
            return $this->notFoundResponse('Commentaire introuvable.');
        }

        if (!$this->security->isGranted(CommentVoter::EDIT, $comment)) {
            return $this->sendForbidden('Vous ne pouvez modifier que vos propres commentaires.');
        }

        try {
            /** @var UpdateCommentDto $dto */
            $dto = $this->serializer->deserialize($request->getContent(), UpdateCommentDto::class, 'json');
        } catch (Throwable) {
            return $this->sendJson(['message' => 'Format de données JSON invalide.'], Response::HTTP_BAD_REQUEST);
        }

        $violations = $this->validator->validate($dto);
        if (count($violations) > 0) {
            return $this->sendViolations($violations);
        }

        $comment
            ->setContent(trim($dto->content))
            ->setSetting('is_edited', true);

        $this->commentRepository->save($comment, flush: true, isCreation: false);

        return $this->sendJson($comment, Response::HTTP_OK, context: ['groups' => ['comment.read']]);
    }

    public function flag(string $id, Request $request): object
    {
        $user = $this->getAuthenticatedUser();
        if (!$user instanceof User) {
            return $this->sendUnauthorized('Vous devez être connecté pour signaler un commentaire.');
        }

        $comment = $this->findCommentById($id);
        if (!$comment instanceof Comment) {
            return $this->notFoundResponse('Commentaire introuvable.');
        }

        if ((string) $comment->getOwner()?->getId() === (string) $user->getId()) {
            return $this->sendJson(
                ['message' => 'Vous ne pouvez pas signaler votre propre commentaire.'],
                Response::HTTP_UNPROCESSABLE_ENTITY
            );
        }

        if (!$this->security->isGranted(CommentVoter::FLAG, $comment)) {
            return $this->sendForbidden('Action non autorisée.');
        }

        try {
            /** @var FlagContentDto $dto */
            $dto = $this->serializer->deserialize($request->getContent(), FlagContentDto::class, 'json');
        } catch (Throwable) {
            return $this->sendJson(['message' => 'Format de données JSON invalide.'], Response::HTTP_BAD_REQUEST);
        }

        $violations = $this->validator->validate($dto);
        if (count($violations) > 0) {
            return $this->sendViolations($violations);
        }

        if (!$comment->flagByUser($user, $dto->reason, $dto->comment)) {
            return $this->sendJson(
                ['message' => 'Vous avez déjà signalé ce commentaire.'],
                Response::HTTP_CONFLICT
            );
        }

        $this->commentRepository->save($comment, flush: true, isCreation: false);

        $this->generateLog(
            LoggerLevelEnum::Notice,
            [
                'message' => 'Commentaire signalé par un utilisateur',
                'data'    => [
                    'comment_id' => (string) $comment->getId(),
                    'flags'      => $comment->getFlags(),
                    'reason'     => $dto->reason,
                    'comment'    => $dto->comment,
                ],
            ],
            ['action' => 'comment.flag', 'uid' => (string) $user->getId()]
        );

        return $this->sendJson(
            [
                'message' => 'Le commentaire a bien été signalé à la modération.',
                'flags'   => $comment->getFlags(),
            ],
            Response::HTTP_OK
        );
    }

    public function moderate(string $id, Request $request): object
    {
        $moderator = $this->getAuthenticatedUser();
        if (!$moderator instanceof User) {
            return $this->sendUnauthorized('Authentification requise.');
        }

        $comment = $this->findCommentById($id);
        if (!$comment instanceof Comment) {
            return $this->notFoundResponse('Commentaire introuvable.');
        }

        if (!$this->security->isGranted(CommentVoter::MODERATE, $comment)) {
            return $this->sendForbidden('Vous n\'avez pas les droits de modération.');
        }

        try {
            /** @var ModerateCommentDto $dto */
            $dto = $this->serializer->deserialize($request->getContent(), ModerateCommentDto::class, 'json');
        } catch (Throwable) {
            return $this->sendJson(['message' => 'Format de données JSON invalide.'], Response::HTTP_BAD_REQUEST);
        }

        $violations = $this->validator->validate($dto);
        if (count($violations) > 0) {
            return $this->sendViolations($violations);
        }

        $comment
            ->setStatus($dto->status)
            ->setSetting('moderated_by', (string) $moderator->getId())
            ->setSetting('moderated_at', $this->now()->format(\DateTimeInterface::ATOM));

        if ($dto->moderationNote !== null) {
            $comment->setSetting('moderation_note', trim($dto->moderationNote));
        }

        if ($dto->resetFlags || CommentStatus::from($dto->status) === CommentStatus::APPROVED) {
            $comment->clearFlags();
        }

        $this->commentRepository->save($comment, flush: true, isCreation: false);

        $this->generateLog(
            LoggerLevelEnum::Info,
            [
                'message' => 'Commentaire modéré',
                'data'    => [
                    'comment_id' => (string) $comment->getId(),
                    'status'     => $comment->getStatus()->value,
                ],
            ],
            ['action' => 'comment.moderate', 'uid' => (string) $moderator->getId()]
        );

        return $this->sendJson($comment, Response::HTTP_OK, context: ['groups' => ['comment.read']]);
    }

    public function delete(string $id): object
    {
        $user = $this->getAuthenticatedUser();
        if (!$user instanceof User) {
            return $this->sendUnauthorized('Authentification requise.');
        }

        $comment = $this->findCommentById($id);
        if (!$comment instanceof Comment) {
            return $this->notFoundResponse('Commentaire introuvable.');
        }

        if (!$this->security->isGranted(CommentVoter::DELETE, $comment)) {
            return $this->sendForbidden('Vous n\'avez pas les droits pour supprimer ce commentaire.');
        }

        $this->commentRepository->remove($comment, flush: true);

        $this->generateLog(
            LoggerLevelEnum::Info,
            [
                'message' => 'Commentaire supprimé',
                'data'    => ['comment_id' => $id],
            ],
            ['action' => 'comment.delete.success', 'uid' => (string) $user->getId()]
        );

        return $this->sendNoContent();
    }

    private function findCommentById(string $id): ?Comment
    {
        if (!Uuid::isValid($id)) {
            return null;
        }

        return $this->commentRepository->find(Uuid::fromString($id));
    }

    private function getAuthenticatedUser(): ?User
    {
        $user = $this->security->getUser();

        return $user instanceof User ? $user : null;
    }
}
