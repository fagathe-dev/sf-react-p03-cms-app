import { describe, expect, it } from 'vitest';
import { excerpt, formatCount, getDisplayName, pluralize } from './format';

describe('pluralize', () => {
  it.each([
    [0, 'article'],
    [1, 'article'],
    [2, 'articles'],
    [1234, 'articles'],
  ])('%i → %s', (count, expected) => {
    expect(pluralize(count, 'article')).toBe(expected);
  });

  it('accepte un pluriel irrégulier', () => {
    expect(pluralize(3, 'brouillon en relecture', 'brouillons en relecture')).toBe('brouillons en relecture');
  });
});

describe('formatCount', () => {
  it('formate le nombre en français et accorde le mot', () => {
    expect(formatCount(1234, 'lecture').replace(/\s/g, ' ')).toBe('1 234 lectures');
    expect(formatCount(1, 'lecture')).toBe('1 lecture');
  });
});

describe('getDisplayName', () => {
  it('privilégie displayName, puis prénom + nom, puis username', () => {
    expect(getDisplayName({ username: 'jdoe', displayName: 'Jane D.', firstname: 'Jane', lastname: 'Doe' })).toBe('Jane D.');
    expect(getDisplayName({ username: 'jdoe', displayName: null, firstname: 'Jane', lastname: 'Doe' })).toBe('Jane Doe');
    expect(getDisplayName({ username: 'jdoe', displayName: ' ', firstname: null, lastname: null })).toBe('jdoe');
    expect(getDisplayName(null)).toBe('');
  });
});

describe('excerpt', () => {
  it('conserve un texte court et coupe un texte long sur un mot', () => {
    expect(excerpt('Texte court')).toBe('Texte court');
    const long = 'mot '.repeat(60);
    const result = excerpt(long, 20);
    expect(result.endsWith('…')).toBe(true);
    expect(result.length).toBeLessThanOrEqual(21);
  });
});
