import { hasMinimumRole, resolveUserRole } from '@/security/permissions';
import { useAuthStore } from '@/stores/auth.store';
import { AuthResponse, UserRole } from '@/types';
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

/** Rôle minimum pour accéder au back-office (voir ProtectedRoute dans router/index.tsx) */
export const BACK_OFFICE_MIN_ROLE: UserRole = 'ROLE_CONTRIBUTOR';

export const NO_BACK_OFFICE_ACCESS_MESSAGE =
  "Votre compte est actif mais n'a pas encore accès au back-office : un administrateur doit vous attribuer un rôle.";

/**
 * Ouvre la session après une authentification réussie (mot de passe, code ou lien de vérification).
 * Un compte sans rôle back-office n'est pas connecté : ProtectedRoute le renverrait en boucle vers "/".
 */
export const useBackOfficeSession = () => {
  const setAuth = useAuthStore((state) => state.setAuth);
  const navigate = useNavigate();

  /** @returns un message d'erreur si le compte n'a pas accès au back-office, sinon null (redirection effectuée) */
  const openSession = useCallback(
    ({ token, user }: AuthResponse): string | null => {
      if (!hasMinimumRole(resolveUserRole(user), BACK_OFFICE_MIN_ROLE)) {
        return NO_BACK_OFFICE_ACCESS_MESSAGE;
      }

      setAuth(token, user);
      navigate('/', { replace: true });

      return null;
    },
    [setAuth, navigate]
  );

  return { openSession };
};
