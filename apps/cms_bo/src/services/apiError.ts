/**
 * Erreur API enrichie des violations de validation renvoyées par ResponseTrait::sendViolations
 * ({ title, violations: { propertyPath: message }, status })
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly violations: Record<string, string> = {}
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const toApiError = (data: unknown, fallback: string): ApiError => {
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;

    if (obj.violations && typeof obj.violations === 'object') {
      const violations = obj.violations as Record<string, string>;
      return new ApiError(Object.values(violations)[0] ?? fallback, violations);
    }

    if (typeof obj.message === 'string') return new ApiError(obj.message);
  }

  return new ApiError(fallback);
};
