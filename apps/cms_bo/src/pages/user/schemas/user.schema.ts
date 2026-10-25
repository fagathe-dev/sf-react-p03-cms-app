import { UserRole } from '@/types';
import { z } from 'zod';

// Miroir de l'Assert\Regex de CreateUserDto / UpdateUserDto
const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
const PASSWORD_MESSAGE =
  'Le mot de passe doit contenir au moins 8 caractères, dont une majuscule, une minuscule et un chiffre';

/**
 * Schéma du formulaire membre : mot de passe obligatoire à la création, optionnel en édition
 * (vide = mot de passe inchangé).
 */
export const buildUserSchema = (mode: 'create' | 'edit', roles: [UserRole, ...UserRole[]]) =>
  z
    .object({
      email: z
        .email("Format d'e-mail invalide")
        .min(1, "L'adresse e-mail est obligatoire")
        .max(180, "L'adresse e-mail ne peut pas dépasser 180 caractères"),
      username: z
        .string()
        .trim()
        .min(3, "Le nom d'utilisateur doit contenir au moins 3 caractères")
        .max(90, "Le nom d'utilisateur ne peut pas dépasser 90 caractères"),
      firstname: z.string().trim().max(80, 'Le prénom ne peut pas dépasser 80 caractères'),
      lastname: z.string().trim().max(80, 'Le nom ne peut pas dépasser 80 caractères'),
      role: z.enum(roles, { message: 'Veuillez choisir un rôle' }),
      password:
        mode === 'create'
          ? z.string().regex(PASSWORD_PATTERN, PASSWORD_MESSAGE)
          : z.string().refine((value) => value === '' || PASSWORD_PATTERN.test(value), PASSWORD_MESSAGE),
      confirmPassword: z.string(),
      isVerified: z.boolean(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: 'Les mots de passe ne correspondent pas',
      path: ['confirmPassword'],
    });

export type UserFormData = z.infer<ReturnType<typeof buildUserSchema>>;
