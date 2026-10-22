<?php

declare(strict_types=1);

namespace Fagathe\CmsCore\Service;

use Fagathe\CmsCore\Dto\Tag\SaveTagDto;
use Fagathe\CmsCore\Entity\Tag;
use Fagathe\CmsCore\Entity\User;
use Fagathe\CmsCore\Repository\TagRepository;
use Fagathe\CmsCore\Security\Voter\TaxonomyVoter;
use Fagathe\CorePhp\Enum\LoggerLevelEnum;
use Fagathe\CorePhp\Http\RequestTrait;
use Fagathe\CorePhp\Http\ResponseTrait;
use Fagathe\CorePhp\Trait\DatetimeTrait;
use Fagathe\CorePhp\Trait\LoggerTrait;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Serializer\SerializerInterface;
use Symfony\Component\String\Slugger\SluggerInterface;
use Symfony\Component\Uid\Uuid;
use Symfony\Component\Validator\Validator\ValidatorInterface;
use Throwable;

final class TagService
{
    use ResponseTrait, DatetimeTrait, LoggerTrait, RequestTrait;

    public function __construct(
        private readonly TagRepository $tagRepository,
        private readonly SerializerInterface $serializer,
        private readonly ValidatorInterface $validator,
        private readonly SluggerInterface $slugger,
        private readonly Security $security,
    ) {}

    public function list(Request $request): object
    {
        $query = trim((string) $request->query->get('q', ''));
        $limit = max(1, min(100, (int) $request->query->get('limit', 50)));

        if ($query !== '') {
            $tags = $this->tagRepository->searchFullText($query, $limit);
        } else {
            $tags = $this->tagRepository->findBy([], ['name' => 'ASC'], $limit);
        }

        return $this->sendJson($tags, Response::HTTP_OK, context: ['groups' => ['tag.list']]);
    }

    public function show(string $identifier): object
    {
        $tag = Uuid::isValid($identifier)
            ? $this->tagRepository->find(Uuid::fromString($identifier))
            : $this->tagRepository->findOneBy(['slug' => $identifier]);

        if (!$tag instanceof Tag) {
            return $this->notFoundResponse('Tag introuvable.');
        }

        return $this->sendJson($tag, Response::HTTP_OK, context: ['groups' => ['tag.read']]);
    }

    public function create(Request $request): object
    {
        if (!$this->security->isGranted(TaxonomyVoter::MANAGE_TAG)) {
            return $this->sendForbidden('Vous n\'avez pas les droits pour créer un tag.');
        }

        try {
            /** @var SaveTagDto $dto */
            $dto = $this->serializer->deserialize($request->getContent(), SaveTagDto::class, 'json');
        } catch (Throwable) {
            return $this->sendJson(['message' => 'Format de données JSON invalide.'], Response::HTTP_BAD_REQUEST);
        }

        $violations = $this->validator->validate($dto);
        if (count($violations) > 0) {
            return $this->sendViolations($violations);
        }

        $user = $this->security->getUser();
        if ($user instanceof User && $dto->color !== null) {
            if ($this->tagRepository->colorExistsForUser($user, $dto->color)) {
                return $this->sendViolations(['color' => 'Vous avez déjà un tag avec cette couleur.']);
            }
        }

        $tag = new Tag();
        if ($user instanceof User) {
            $tag->setOwner($user);
        }

        $this->hydrateTag($tag, $dto, isNew: true);

        $entityViolations = $this->validator->validate($tag);
        if (count($entityViolations) > 0) {
            return $this->sendViolations($entityViolations);
        }

        if (!$this->tagRepository->save($tag, flush: true, isCreation: true)) {
            return $this->sendJson(
                ['message' => 'Erreur interne lors de la création du tag.'],
                Response::HTTP_INTERNAL_SERVER_ERROR
            );
        }

        $this->generateLog(
            LoggerLevelEnum::Info,
            [
                'message' => 'Tag créé avec succès',
                'data'    => ['tag_id' => (string) $tag->getId(), 'slug' => $tag->getSlug()],
            ],
            ['action' => 'tag.create.success']
        );

        return $this->sendJson($tag, Response::HTTP_CREATED, context: ['groups' => ['tag.read']]);
    }

    public function update(string $id, Request $request): object
    {
        $tag = Uuid::isValid($id) ? $this->tagRepository->find(Uuid::fromString($id)) : null;
        if (!$tag instanceof Tag) {
            return $this->notFoundResponse('Tag introuvable.');
        }

        if (!$this->security->isGranted(TaxonomyVoter::MANAGE_TAG, $tag)) {
            return $this->sendForbidden('Vous n\'avez pas les droits pour modifier ce tag.');
        }

        try {
            /** @var SaveTagDto $dto */
            $dto = $this->serializer->deserialize($request->getContent(), SaveTagDto::class, 'json');
        } catch (Throwable) {
            return $this->sendJson(['message' => 'Format de données JSON invalide.'], Response::HTTP_BAD_REQUEST);
        }

        $violations = $this->validator->validate($dto);
        if (count($violations) > 0) {
            return $this->sendViolations($violations);
        }

        $owner = $tag->getOwner();
        if ($owner instanceof User && $dto->color !== null) {
            if ($this->tagRepository->colorExistsForUser($owner, $dto->color, $tag->getId())) {
                return $this->sendViolations(['color' => 'Vous avez déjà un tag avec cette couleur.']);
            }
        }

        $this->hydrateTag($tag, $dto, isNew: false);

        $entityViolations = $this->validator->validate($tag);
        if (count($entityViolations) > 0) {
            return $this->sendViolations($entityViolations);
        }

        if (!$this->tagRepository->save($tag, flush: true, isCreation: false)) {
            return $this->sendJson(
                ['message' => 'Erreur interne lors de la mise à jour du tag.'],
                Response::HTTP_INTERNAL_SERVER_ERROR
            );
        }

        return $this->sendJson($tag, Response::HTTP_OK, context: ['groups' => ['tag.read']]);
    }

    public function delete(string $id): object
    {
        $tag = Uuid::isValid($id) ? $this->tagRepository->find(Uuid::fromString($id)) : null;
        if (!$tag instanceof Tag) {
            return $this->notFoundResponse('Tag introuvable.');
        }

        if (!$this->security->isGranted(TaxonomyVoter::MANAGE_TAG, $tag)) {
            return $this->sendForbidden('Vous n\'avez pas les droits pour supprimer ce tag.');
        }

        if (!$this->tagRepository->remove($tag, flush: true)) {
            return $this->sendJson(
                ['message' => 'Erreur interne lors de la suppression du tag.'],
                Response::HTTP_INTERNAL_SERVER_ERROR
            );
        }

        $this->generateLog(
            LoggerLevelEnum::Info,
            [
                'message' => 'Tag supprimé',
                'data'    => ['tag_id' => $id, 'name' => $tag->getName()],
            ],
            ['action' => 'tag.delete.success']
        );

        return $this->sendNoContent();
    }

    private function hydrateTag(Tag $tag, SaveTagDto $dto, bool $isNew): void
    {
        $tag->setName(trim($dto->name));

        $rawSlug = ($dto->slug !== null && trim($dto->slug) !== '')
            ? trim($dto->slug)
            : ($isNew || !$tag->getSlug() ? $tag->getName() : $tag->getSlug());

        $tag->setSlug(strtolower($this->slugger->slug((string) $rawSlug)->toString()));
        $tag->setColor($dto->color);
        $tag->setDescription($dto->description !== null && trim($dto->description) !== '' ? trim($dto->description) : null);

        if ($dto->settings !== null) {
            $tag->setSettings($dto->settings);
        }
    }
}