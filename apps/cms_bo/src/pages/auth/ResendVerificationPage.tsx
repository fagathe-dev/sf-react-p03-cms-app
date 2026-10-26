import { fetchResendVerification } from '@/services/auth.api';
import { Alert, Button, Card, Text, TextField } from '@/ui/components';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { identifierSchema } from './schemas';

const resendVerificationSchema = z.object({
  username: identifierSchema,
});

type ResendVerificationFormData = z.infer<typeof resendVerificationSchema>;

export const ResendVerificationPage = () => {
  const [apiError, setApiError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [searchParams] = useSearchParams();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResendVerificationFormData>({
    resolver: zodResolver(resendVerificationSchema),
    defaultValues: {
      // Pré-rempli depuis la page de connexion (/resend-verification?username=xxx)
      username: searchParams.get('username') ?? '',
    },
  });

  const onSubmit = async (data: ResendVerificationFormData) => {
    setApiError(null);
    setSuccessMessage(null);
    try {
      // Réponse constante côté API (pas d'énumération des comptes)
      const { message } = await fetchResendVerification({ username: data.username.trim() });
      setSuccessMessage(message);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Erreur lors de l'envoi du lien de vérification");
    }
  };

  return (
    <Card elevation="sm">
      <Card.Header>
        <Card.Title>Activer mon compte</Card.Title>
      </Card.Header>
      <Card.Body>
        <Text as="p" size="sm" style={{ marginTop: 0 }}>
          Votre compte n'est pas encore activé ou le lien a expiré ? Renseignez votre e-mail ou votre nom
          d'utilisateur pour recevoir un nouveau lien de vérification (valable 72 heures).
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
            label="E-mail ou nom d'utilisateur"
            type="text"
            autoComplete="username"
            placeholder="Ex : john@example.com ou johndoe"
            error={errors.username?.message}
            {...register('username')}
          />

          <Button type="submit" loading={isSubmitting} fullWidth>
            Recevoir un nouveau lien
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
