/**
 * Erreur API enrichie des violations de validation renvoyées par ResponseTrait::sendViolations
 * ({ title, violations: { propertyPath: message }, status }) et du code métier éventuel
 * ({ message, code }, ex. `email_not_verified` renvoyé par ApiAuthenticator).
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly violations: Record<string, string> = {},
    public readonly code: string | null = null
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const toApiError = (data: unknown, fallback: string): ApiError => {
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    const code = typeof obj.code === 'string' ? obj.code : null;

    if (obj.violations && typeof obj.violations === 'object') {
      const violations = obj.violations as Record<string, string>;
      return new ApiError(Object.values(violations)[0] ?? fallback, violations, code);
    }

    if (typeof obj.message === 'string') return new ApiError(obj.message, {}, code);
  }

  return new ApiError(fallback);
};

/** Code métier de l'erreur (ex. `email_not_verified`), null si absent */
export const getErrorCode = (err: unknown): string | null => (err instanceof ApiError ? err.code : null);
