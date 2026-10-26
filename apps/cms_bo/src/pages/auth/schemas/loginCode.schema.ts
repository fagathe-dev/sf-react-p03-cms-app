import { z } from 'zod';

/** Code de connexion à 6 chiffres reçu par e-mail */
export const loginCodeSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/, 'Le code doit contenir exactement 6 chiffres');
