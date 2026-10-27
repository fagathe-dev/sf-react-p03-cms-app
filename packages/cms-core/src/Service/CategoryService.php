<?php

declare(strict_types=1);

namespace Fagathe\CmsCore\Service;

use Fagathe\CmsCore\Dto\Category\SaveCategoryDto;
use Fagathe\CmsCore\Dto\Category\UploadCategoryImageDto;
use Fagathe\CmsCore\Entity\Category;
use Fagathe\CmsCore\Repository\CategoryRepository;
use Fagathe\CmsCore\Security\Voter\TaxonomyVoter;
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

final class CategoryService
{
    use ResponseTrait, DatetimeTrait, LoggerTrait, RequestTrait;

    public function __construct(
        private readonly CategoryRepository $categoryRepository,
        private readonly SerializerInterface $serializer,
        private readonly ValidatorInterface $validator,
        private readonly SluggerInterface $slugger,
        private readonly Security $security,
        private readonly AttachmentFileService $attachmentService,
    ) {}

    public function list(Request $request): object
    {
        $query = trim((string) $request->query->get('q', ''));
        $limit = max(1, min(100, (int) $request->query->get('limit', 50)));

        if ($query !== '') {
            $categories = $this->categoryRepository->searchFullText($query, $limit);
        } else {
            $categories = $this->categoryRepository->findBy([], ['name' => 'ASC'], $limit);
        }

        return $this->sendJson($categories, Response::HTTP_OK, context: ['groups' => ['category.list']]);
    }

    public function show(string $identifier): object
    {
        $category = Uuid::isValid($identifier)
            ? $this->categoryRepository->find(Uuid::fromString($identifier))
            : $this->categoryRepository->findOneBy(['slug' => $identifier]);

        if (!$category instanceof Category) {
            return $this->notFoundResponse('Catégorie introuvable.');
        }

        return $this->sendJson($category, Response::HTTP_OK, context: ['groups' => ['category.read']]);
    }

    public function create(Request $request): object
    {
        if (!$this->security->isGranted(TaxonomyVoter::MANAGE_CATEGORY)) {
            return $this->sendForbidden('Vous n\'avez pas les droits pour créer une catégorie.');
        }

        try {
            /** @var SaveCategoryDto $dto */
            $dto = $this->serializer->deserialize($request->getContent(), SaveCategoryDto::class, 'json');
        } catch (Throwable) {
            return $this->sendJson(['message' => 'Format de données JSON invalide.'], Response::HTTP_BAD_REQUEST);
        }

        $violations = $this->validator->validate($dto);
        if (count($violations) > 0) {
            return $this->sendViolations($violations);
        }

        $category = new Category();
        $this->hydrateCategory($category, $dto, isNew: true);

        $entityViolations = $this->validator->validate($category);
        if (count($entityViolations) > 0) {
            return $this->sendViolations($entityViolations);
        }

        if (!$this->categoryRepository->save($category, flush: true, isCreation: true)) {
            return $this->sendJson(
                ['message' => 'Erreur interne lors de la création de la catégorie.'],
                Response::HTTP_INTERNAL_SERVER_ERROR
            );
        }

        $this->generateLog(
            LoggerLevelEnum::Info,
            [
                'message' => 'Catégorie créée avec succès',
                'data'    => ['category_id' => (string) $category->getId(), 'slug' => $category->getSlug()],
            ],
            ['action' => 'category.create.success']
        );

        return $this->sendJson($category, Response::HTTP_CREATED, context: ['groups' => ['category.read']]);
    }

    public function update(string $id, Request $request): object
    {
        $category = Uuid::isValid($id) ? $this->categoryRepository->find(Uuid::fromString($id)) : null;
        if (!$category instanceof Category) {
            return $this->notFoundResponse('Catégorie introuvable.');
        }

        if (!$this->security->isGranted(TaxonomyVoter::MANAGE_CATEGORY, $category)) {
            return $this->sendForbidden('Vous n\'avez pas les droits pour modifier cette catégorie.');
        }

        try {
            /** @var SaveCategoryDto $dto */
            $dto = $this->serializer->deserialize($request->getContent(), SaveCategoryDto::class, 'json');
        } catch (Throwable) {
            return $this->sendJson(['message' => 'Format de données JSON invalide.'], Response::HTTP_BAD_REQUEST);
        }

        $violations = $this->validator->validate($dto);
        if (count($violations) > 0) {
            return $this->sendViolations($violations);
        }

        $this->hydrateCategory($category, $dto, isNew: false);

        $entityViolations = $this->validator->validate($category);
        if (count($entityViolations) > 0) {
            return $this->sendViolations($entityViolations);
        }

        if (!$this->categoryRepository->save($category, flush: true, isCreation: false)) {
            return $this->sendJson(
                ['message' => 'Erreur interne lors de la mise à jour de la catégorie.'],
                Response::HTTP_INTERNAL_SERVER_ERROR
            );
        }

        return $this->sendJson($category, Response::HTTP_OK, context: ['groups' => ['category.read']]);
    }

    public function delete(string $id): object
    {
        $category = Uuid::isValid($id) ? $this->categoryRepository->find(Uuid::fromString($id)) : null;
        if (!$category instanceof Category) {
            return $this->notFoundResponse('Catégorie introuvable.');
        }

        if (!$this->security->isGranted(TaxonomyVoter::MANAGE_CATEGORY, $category)) {
            return $this->sendForbidden('Vous n\'avez pas les droits pour supprimer cette catégorie.');
        }

        $image = $category->getImage();
        $imageDirectory = 'categories/' . (string) $category->getId();

        if (!$this->categoryRepository->remove($category, flush: true)) {
            return $this->sendJson(
                ['message' => 'Erreur interne lors de la suppression de la catégorie.'],
                Response::HTTP_INTERNAL_SERVER_ERROR
            );
        }

        // Fichier supprimé une fois la catégorie effacée en base (dossier propre à la catégorie)
        if ($image !== null) {
            $this->attachmentService->deleteRawPath($image, $imageDirectory);
        }

        $this->generateLog(
            LoggerLevelEnum::Info,
            [
                'message' => 'Catégorie supprimée',
                'data'    => ['category_id' => $id, 'name' => $category->getName()],
            ],
            ['action' => 'category.delete.success']
        );

        return $this->sendNoContent();
    }

    /**
     * Upload (ou remplacement) de l'image de la catégorie : champ multipart "image" (ou "file").
     */
    public function uploadImage(string $id, Request $request): object
    {
        $category = Uuid::isValid($id) ? $this->categoryRepository->find(Uuid::fromString($id)) : null;
        if (!$category instanceof Category) {
            return $this->notFoundResponse('Catégorie introuvable.');
        }

        if (!$this->security->isGranted(TaxonomyVoter::MANAGE_CATEGORY, $category)) {
            return $this->sendForbidden('Vous n\'avez pas les droits pour modifier cette catégorie.');
        }

        $dto = new UploadCategoryImageDto($request->files->get('image') ?? $request->files->get('file'));

        $violations = $this->validator->validate($dto);
        if (count($violations) > 0) {
            return $this->sendViolations($violations);
        }

        try {
            $this->attachmentService->uploadCategoryImage($dto->file, $category);
        } catch (FileUploadException $e) {
            return $this->sendJson(['message' => $e->getMessage()], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        if (!$this->categoryRepository->save($category, flush: true, isCreation: false)) {
            return $this->sendJson(
                ['message' => 'Erreur interne lors de l\'enregistrement de l\'image.'],
                Response::HTTP_INTERNAL_SERVER_ERROR
            );
        }

        return $this->sendJson($category, Response::HTTP_OK, context: ['groups' => ['category.read']]);
    }

    /**
     * Retire l'image de la catégorie : l'icône (settings.icon) est de nouveau affichée.
     */
    public function deleteImage(string $id): object
    {
        $category = Uuid::isValid($id) ? $this->categoryRepository->find(Uuid::fromString($id)) : null;
        if (!$category instanceof Category) {
            return $this->notFoundResponse('Catégorie introuvable.');
        }

        if (!$this->security->isGranted(TaxonomyVoter::MANAGE_CATEGORY, $category)) {
            return $this->sendForbidden('Vous n\'avez pas les droits pour modifier cette catégorie.');
        }

        if ($category->getImage() !== null) {
            $this->attachmentService->deleteCategoryImage($category);
            $this->categoryRepository->save($category, flush: true, isCreation: false);
        }

        return $this->sendJson($category, Response::HTTP_OK, context: ['groups' => ['category.read']]);
    }

    private function hydrateCategory(Category $category, SaveCategoryDto $dto, bool $isNew): void
    {
        $category->setName(trim($dto->name));

        $rawSlug = ($dto->slug !== null && trim($dto->slug) !== '')
            ? trim($dto->slug)
            : ($isNew || !$category->getSlug() ? $category->getName() : $category->getSlug());

        $category->setSlug(strtolower($this->slugger->slug((string) $rawSlug)->toString()));
        $category->setDescription($dto->description !== null && trim($dto->description) !== '' ? trim($dto->description) : null);

        if ($dto->settings !== null) {
            $category->setSettings($dto->settings);
        }
    }
}