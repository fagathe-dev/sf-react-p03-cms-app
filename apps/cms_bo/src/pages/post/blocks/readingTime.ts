const WORDS_PER_MINUTE = 200;

const collectStrings = (value: unknown, acc: string[]): void => {
  if (typeof value === 'string') {
    acc.push(value);
  } else if (Array.isArray(value)) {
    value.forEach((item) => collectStrings(item, acc));
  } else if (value && typeof value === 'object') {
    Object.entries(value).forEach(([key, item]) => {
      // Clés techniques ignorées, comme BlocContent::IGNORED_SEARCH_KEYS
      if (!['id', 'url', 'src', 'icon', 'language', 'variant', 'aspectRatio'].includes(key)) {
        collectStrings(item, acc);
      }
    });
  }
};

/**
 * Temps de lecture estimé (minutes) à partir du contenu textuel des blocs — stocké dans settings.reading_time
 */
export const computeReadingTime = (blocks: { data: unknown }[]): number | null => {
  const strings: string[] = [];
  blocks.forEach((block) => collectStrings(block.data, strings));

  const words = strings.join(' ').split(/\s+/).filter(Boolean).length;
  return words === 0 ? null : Math.max(1, Math.round(words / WORDS_PER_MINUTE));
};
