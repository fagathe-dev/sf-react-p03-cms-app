import { z } from 'zod';

/** Mêmes règles que l'API (Assert\Regex de User::$password / ResetPasswordDto) */
export const passwordSchema = z
  .string()
  .min(8, 'Le mot de passe doit comporter au moins 8 caractères')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    'Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre'
  );
