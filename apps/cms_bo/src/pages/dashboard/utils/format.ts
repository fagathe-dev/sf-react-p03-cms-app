import { UserSummary } from '@/types';

const numberFormatter = new Intl.NumberFormat('fr-FR');

export const formatNumber = (value: number): string => numberFormatter.format(value);

/**
 * Accord français : singulier pour 0 et 1, pluriel à partir de 2 (« 0 article », « 2 articles »).
 * Le pluriel par défaut ajoute un « s » au singulier.
 */
export const pluralize = (count: number, singular: string, plural = `${singular}s`): string =>
  Math.abs(count) >= 2 ? plural : singular;

/** Nombre formaté suivi du mot accordé : « 1 234 lectures » */
export const formatCount = (count: number, singular: string, plural?: string): string =>
  `${formatNumber(count)} ${pluralize(count, singular, plural)}`;

/** displayName, à défaut prénom + nom, à défaut username */
export const getDisplayName = (user: Pick<UserSummary, 'displayName' | 'firstname' | 'lastname' | 'username'> | null | undefined): string => {
  if (!user) return '';
  if (user.displayName?.trim()) return user.displayName.trim();

  const fullName = [user.firstname, user.lastname].filter((part) => part?.trim()).join(' ').trim();
  return fullName || user.username;
};

/** Extrait sur une limite de caractères, coupé à la fin d'un mot */
export const excerpt = (text: string | null | undefined, maxLength = 140): string => {
  const clean = (text ?? '').replace(/\s+/g, ' ').trim();
  if (clean.length <= maxLength) return clean;

  const cut = clean.slice(0, maxLength);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > maxLength * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
};
