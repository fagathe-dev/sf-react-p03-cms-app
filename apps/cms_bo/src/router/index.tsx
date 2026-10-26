// src/router/index.tsx
import { AppLayout, AuthLayout } from '@/layouts';
import {
  CategoriesPage,
  CategoryCreatePage,
  CategoryEditPage,
  CommentModerationPage,
  ForgotPasswordPage,
  LoginPage,
  LogoutPage,
  PostCreatePage,
  PostEditPage,
  PostModerationPage,
  PostPreviewPage,
  PostsArchivePage,
  PostSeoPage,
  PostsPage,
  PostsTrashPage,
  ProfilePage,
  RegisterPage,
  ResendVerificationPage,
  ResetPasswordPage,
  SearchPage,
  SeoMetadataPage,
  TagCreatePage,
  TagEditPage,
  TagsPage,
  UserCreatePage,
  UserDetailsPage,
  UserEditPage,
  UsersPage,
  VerifyEmailPage,
} from '@/pages';
import { ProtectedRoute } from '@/router/protectedRoute';
import { PublicRoute } from '@/router/publicRoute';
import { createBrowserRouter, Navigate } from 'react-router-dom';

export const router = createBrowserRouter([
  // 0. Déconnexion (accessible dès qu'on clique sur Déconnexion)
  {
    path: '/logout',
    element: <LogoutPage />,
  },

  // 1. Espace Back-Office connecté (ROLE_CONTRIBUTOR minimum)
  {
    element: <ProtectedRoute minRole="ROLE_CONTRIBUTOR" />,
    children: [
      {
        element: <AppLayout />,
        children: [
          // Redirection racine vers la liste des articles
          {
            path: '/',
            element: <Navigate to="/posts" replace />,
          },

          // Recherche globale Full-Text (SearchController)
          {
            path: '/search',
            element: <SearchPage />,
          },

          // Module Articles, Médias & SEO d'article (PostController, PostMediaController, PostSeoController)
          {
            path: '/posts',
            children: [
              { index: true, element: <PostsPage /> },
              { path: 'new', element: <PostCreatePage /> },
              { path: 'archives', element: <PostsArchivePage /> },
              { path: 'trash', element: <PostsTrashPage /> },
              { path: ':postId', element: <PostPreviewPage /> },
              { path: ':postId/edit', element: <PostEditPage /> },
              { path: ':postId/seo', element: <PostSeoPage /> },
            ],
          },

          // Module Taxonomies : Catégories & Tags (CategoryController, TagController)
          // Lecture pour tous les membres de l'admin, actions d'écriture gérées en UI/API pour ROLE_MANAGER+
          {
            path: '/categories',
            children: [
              { index: true, element: <CategoriesPage /> },
              {
                element: <ProtectedRoute minRole="ROLE_MANAGER" redirectTo="/categories" />,
                children: [
                  { path: 'new', element: <CategoryCreatePage /> },
                  { path: ':categoryId/edit', element: <CategoryEditPage /> },
                ],
              },
            ],
          },
          {
            path: '/tags',
            children: [
              { index: true, element: <TagsPage /> },
              {
                element: <ProtectedRoute minRole="ROLE_MANAGER" redirectTo="/tags" />,
                children: [
                  { path: 'new', element: <TagCreatePage /> },
                  { path: ':tagId/edit', element: <TagEditPage /> },
                ],
              },
            ],
          },

          // Module Modération (CommentModerationController, PostModerationController) — ROLE_MODERATOR+
          {
            path: '/moderation',
            element: <ProtectedRoute minRole="ROLE_MODERATOR" />,
            children: [
              {
                index: true,
                element: <Navigate to="/moderation/comments" replace />,
              },
              { path: 'comments', element: <CommentModerationPage /> },
              { path: 'posts', element: <PostModerationPage /> },
            ],
          },

          // Module Administration & Gestion (UserController, SeoMetadataController) — ROLE_MANAGER+
          {
            element: <ProtectedRoute minRole="ROLE_MANAGER" />,
            children: [
              {
                path: '/users',
                children: [
                  { index: true, element: <UsersPage /> },
                  { path: 'new', element: <UserCreatePage /> },
                  { path: ':userId', element: <UserDetailsPage /> },
                  { path: ':userId/edit', element: <UserEditPage /> },
                ],
              },
              {
                path: '/seo',
                element: <SeoMetadataPage />,
              },
            ],
          },

          // Gestion du compte & profil (AccountController)
          {
            path: '/profile',
            element: <ProfilePage />,
          },
        ],
      },
    ],
  },

  // 2. Espace public : Authentification (AuthController)
  {
    element: <PublicRoute />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          {
            path: '/login',
            element: <LoginPage />,
          },
          {
            path: '/register',
            element: <RegisterPage />,
          },
          {
            path: '/forgot-password',
            element: <ForgotPasswordPage />,
          },
          {
            path: '/resend-verification',
            element: <ResendVerificationPage />,
          },
        ],
      },
    ],
  },

  // 3. Liens reçus par e-mail : accessibles connecté ou non (le jeton fait foi)
  {
    element: <AuthLayout />,
    children: [
      {
        path: '/verify-email',
        element: <VerifyEmailPage />,
      },
      {
        path: '/reset-password',
        element: <ResetPasswordPage />,
      },
    ],
  },

  // 4. Fallback 404
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
