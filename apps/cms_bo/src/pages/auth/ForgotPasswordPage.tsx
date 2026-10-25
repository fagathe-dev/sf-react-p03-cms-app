import { fetchForgotPassword } from '@/services/auth.api';
import { Alert, Button, Card, Text, TextField } from '@/ui/components';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link as RouterLink } from 'react-router-dom';
import { z } from 'zod';

const forgotPasswordSchema = z.object({
  email: z
    .email("Format d'e-mail invalide")
    .min(1, "L'adresse e-mail est obligatoire"),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export const ForgotPasswordPage = () => {
  const [apiError, setApiError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setApiError(null);
    setSuccessMessage(null);
    try {
      // Réponse constante côté API (pas d'énumération des comptes)
      const { message } = await fetchForgotPassword(data);
      setSuccessMessage(message);
    } catch (err) {
      setApiError(
        err instanceof Error ? err.message : 'Erreur lors de la demande de réinitialisation'
      );
    }
  };

  return (
    <Card elevation="sm">
      <Card.Header>
        <Card.Title>Mot de passe oublié</Card.Title>
      </Card.Header>
      <Card.Body>
        <Text as="p" size="sm" style={{ marginTop: 0 }}>
          Renseignez l'adresse e-mail de votre compte, nous vous enverrons un lien pour
          réinitialiser votre mot de passe.
        </Text>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          {apiError && (
            <div style={{ marginBottom: '1rem' }}>
              <Alert variant="danger">{apiError}</Alert>
            </div>
          )}

          {successMessage && (
            <div style={{ marginBottom: '1rem' }}>
              <Alert variant="success">{successMessage}</Alert>
            </div>
          )}

          <TextField
            label="Adresse e-mail"
            type="email"
            placeholder="Ex : john@example.com"
            error={errors.email?.message}
            {...register('email')}
          />

          <Button type="submit" loading={isSubmitting} fullWidth>
            Envoyer le lien
          </Button>
        </form>
      </Card.Body>
      <Card.Footer style={{ justifyContent: 'center' }}>
        <Text size="sm">
          <RouterLink to="/login" style={{ color: 'inherit', fontWeight: 600 }}>
            Retour à la connexion
          </RouterLink>
        </Text>
      </Card.Footer>
    </Card>
  );
};
