/**
 * Identifiant stable des sous-éléments d'un bloc (diapositives, questions FAQ, images de galerie…)
 * utilisé comme `key` React et conservé dans le JSON du bloc.
 */
export const createBlockItemId = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2, 11);
