import { z } from 'zod';

/**
 * Slug optionnel : vide = généré par l'API à partir du nom
 */
export const slugSchema = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Le slug ne peut pas dépasser ${max} caractères`)
    .regex(/^[a-z0-9]*(?:-[a-z0-9]+)*$/, 'Le slug ne peut contenir que des minuscules, des chiffres et des tirets');
