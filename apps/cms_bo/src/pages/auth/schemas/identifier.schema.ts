import { z } from 'zod';

/** Identifiant de connexion : adresse e-mail ou nom d'utilisateur */
export const identifierSchema = z
  .string()
  .trim()
  .min(1, "L'identifiant est obligatoire")
  .refine((val) => z.email().safeParse(val).success || val.length >= 3, {
    message: "Veuillez renseigner une adresse e-mail valide ou un nom d'utilisateur (au moins 3 caractères)",
  });
