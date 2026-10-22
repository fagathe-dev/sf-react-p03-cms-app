import type { DueDateEnum } from '@/types/todo.types';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { dueDateEnumToIso, isoToDueDateCategory } from './dueDate.resolver';

// Mardi 20 octobre 2026, 10h00 (heure locale) : les assertions utilisent des champs
// locaux (getDate, getHours…) pour rester indépendantes du fuseau horaire de la machine.
const NOW = new Date(2026, 9, 20, 10, 0, 0);

const ENUM_VALUES: DueDateEnum[] = ['today', 'tomorrow', 'this_week', 'later'];

/** Date locale -> chaîne ISO, comme la renverrait l'API */
const iso = (year: number, month: number, day: number, hours = 12, minutes = 0): string =>
  new Date(year, month, day, hours, minutes).toISOString();

const localParts = (value: string | null) => {
  const date = new Date(value as string);
  return {
    year: date.getFullYear(),
    month: date.getMonth(),
    date: date.getDate(),
    hours: date.getHours(),
    minutes: date.getMinutes(),
    seconds: date.getSeconds(),
    ms: date.getMilliseconds(),
  };
};

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('dueDateEnumToIso', () => {
  it('retourne null sans valeur', () => {
    expect(dueDateEnumToIso(null)).toBeNull();
    expect(dueDateEnumToIso(undefined)).toBeNull();
  });

  it('retourne une chaîne ISO 8601 valide', () => {
    expect(dueDateEnumToIso('today')).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });

  it.each(ENUM_VALUES)('cale "%s" à 23:59:59.999', (value) => {
    const parts = localParts(dueDateEnumToIso(value));

    expect([parts.hours, parts.minutes, parts.seconds, parts.ms]).toEqual([23, 59, 59, 999]);
  });

  it('"today" retourne aujourd’hui', () => {
    const parts = localParts(dueDateEnumToIso('today'));

    expect([parts.year, parts.month, parts.date]).toEqual([2026, 9, 20]);
  });

  it('"tomorrow" retourne demain', () => {
    const parts = localParts(dueDateEnumToIso('tomorrow'));

    expect([parts.year, parts.month, parts.date]).toEqual([2026, 9, 21]);
  });

  it('"tomorrow" passe correctement au mois suivant', () => {
    vi.setSystemTime(new Date(2026, 9, 31, 10, 0, 0));
    const parts = localParts(dueDateEnumToIso('tomorrow'));

    expect([parts.year, parts.month, parts.date]).toEqual([2026, 10, 1]);
  });

  it('"this_week" retourne le dimanche de la semaine courante', () => {
    const parts = localParts(dueDateEnumToIso('this_week'));

    expect([parts.year, parts.month, parts.date]).toEqual([2026, 9, 25]);
  });

  it('"this_week" retourne aujourd’hui quand on est dimanche', () => {
    vi.setSystemTime(new Date(2026, 9, 25, 10, 0, 0));
    const parts = localParts(dueDateEnumToIso('this_week'));

    expect([parts.year, parts.month, parts.date]).toEqual([2026, 9, 25]);
  });

  it('"later" retourne le dernier jour du mois courant', () => {
    const parts = localParts(dueDateEnumToIso('later'));

    expect([parts.year, parts.month, parts.date]).toEqual([2026, 9, 31]);
  });

  it('"later" gère les années bissextiles', () => {
    vi.setSystemTime(new Date(2028, 1, 10, 10, 0, 0));
    expect(localParts(dueDateEnumToIso('later')).date).toBe(29);

    vi.setSystemTime(new Date(2027, 1, 10, 10, 0, 0));
    expect(localParts(dueDateEnumToIso('later')).date).toBe(28);
  });
});

describe('isoToDueDateCategory', () => {
  it('retourne "none" sans date', () => {
    expect(isoToDueDateCategory(null)).toBe('none');
    expect(isoToDueDateCategory(undefined)).toBe('none');
    expect(isoToDueDateCategory('')).toBe('none');
  });

  it('retourne "none" pour une date invalide', () => {
    expect(isoToDueDateCategory('pas-une-date')).toBe('none');
  });

  it('retourne "overdue" pour une date passée', () => {
    expect(isoToDueDateCategory(iso(2026, 9, 19, 23, 59))).toBe('overdue');
  });

  it('retourne "overdue" pour une échéance du jour déjà dépassée', () => {
    expect(isoToDueDateCategory(iso(2026, 9, 20, 8, 0))).toBe('overdue');
  });

  it('retourne "today" pour une échéance plus tard dans la journée', () => {
    expect(isoToDueDateCategory(iso(2026, 9, 20, 23, 59))).toBe('today');
  });

  it('retourne "tomorrow" pour demain', () => {
    expect(isoToDueDateCategory(iso(2026, 9, 21, 23, 59))).toBe('tomorrow');
  });

  it('retourne "this_week" jusqu’au dimanche inclus', () => {
    expect(isoToDueDateCategory(iso(2026, 9, 22))).toBe('this_week');
    expect(isoToDueDateCategory(iso(2026, 9, 25, 23, 59))).toBe('this_week');
  });

  it('retourne "later" au-delà de la semaine courante', () => {
    expect(isoToDueDateCategory(iso(2026, 9, 26))).toBe('later');
    expect(isoToDueDateCategory(iso(2026, 10, 15))).toBe('later');
  });

  it.each(ENUM_VALUES)('est cohérent avec dueDateEnumToIso pour "%s"', (value) => {
    expect(isoToDueDateCategory(dueDateEnumToIso(value))).toBe(value);
  });
});
