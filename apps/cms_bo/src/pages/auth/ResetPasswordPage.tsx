import { fetchResetPassword } from '@/services/auth.api';
import { Alert, Button, Card, Text, TextField } from '@/ui/components';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link as RouterLink, useNavigate, useSearchParams } from 'react-router-dom';
import { z } from 'zod';

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Le mot de passe doit comporter au moins 8 caractères')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre'
      ),
    confirmPassword: z.string().min(1, 'Veuillez confirmer votre mot de passe'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export const ResetPasswordPage = () => {
  const [apiError, setApiError] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Jeton transmis dans le lien reçu par e-mail : /reset-password?token=xxx
  const token = searchParams.get('token') ?? '';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    setApiError(null);
    try {
      const { message } = await fetchResetPassword({ token, password: data.password });
      navigate('/login', { replace: true, state: { successMessage: message } });
    } catch (err) {
      setApiError(
        err instanceof Error ? err.message : 'Erreur lors de la réinitialisation du mot de passe'
      );
    }
  };

  return (
    <Card elevation="sm">
      <Card.Header>
        <Card.Title>Nouveau mot de passe</Card.Title>
      </Card.Header>
      <Card.Body>
        {!token ? (
          <Alert variant="warning" title="Lien invalide">
            Le lien de réinitialisation est incomplet. Veuillez refaire une demande.
          </Alert>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            {apiError && (
              <div style={{ marginBottom: '1rem' }}>
                <Alert variant="danger">{apiError}</Alert>
              </div>
            )}

            <TextField
              label="Nouveau mot de passe"
              type="password"
              placeholder="Min. 8 car., 1 majuscule, 1 chiffre"
              error={errors.password?.message}
              {...register('password')}
            />

            <TextField
              label="Confirmer le mot de passe"
              type="password"
              placeholder="Retapez votre mot de passe"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />

            <Button type="submit" loading={isSubmitting} fullWidth>
              Réinitialiser le mot de passe
            </Button>
          </form>
        )}
      </Card.Body>
      <Card.Footer style={{ justifyContent: 'center' }}>
        <Text size="sm">
          <RouterLink to="/forgot-password" style={{ color: 'inherit', fontWeight: 600 }}>
            Demander un nouveau lien
          </RouterLink>
        </Text>
      </Card.Footer>
    </Card>
  );
};
