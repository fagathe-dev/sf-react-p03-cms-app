import { fetchResendOtp } from '@/services/auth.api';
import { Alert, Button, Card, Text, TextField } from '@/ui/components';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link as RouterLink, useNavigate, useSearchParams } from 'react-router-dom';
import { z } from 'zod';

const resendOtpSchema = z.object({
  email: z
    .email("Format d'e-mail invalide")
    .min(1, "L'adresse e-mail est obligatoire"),
});

type ResendOtpFormData = z.infer<typeof resendOtpSchema>;

export const ResendOtpPage = () => {
  const [apiError, setApiError] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResendOtpFormData>({
    resolver: zodResolver(resendOtpSchema),
    defaultValues: {
      email: searchParams.get('email') ?? '',
    },
  });

  const onSubmit = async (data: ResendOtpFormData) => {
    setApiError(null);
    try {
      const { message } = await fetchResendOtp(data);
      navigate(`/verify-otp?email=${encodeURIComponent(data.email)}`, {
        state: { successMessage: message },
      });
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Erreur lors de l'envoi du code");
    }
  };

  return (
    <Card elevation="sm">
      <Card.Header>
        <Card.Title>Renvoyer le code</Card.Title>
      </Card.Header>
      <Card.Body>
        <Text as="p" size="sm" style={{ marginTop: 0 }}>
          Votre compte n'est pas encore activé ? Renseignez votre adresse e-mail pour recevoir
          un nouveau code de vérification.
        </Text>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          {apiError && (
            <div style={{ marginBottom: '1rem' }}>
              <Alert variant="danger">{apiError}</Alert>
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
            Recevoir un nouveau code
          </Button>
        </form>
      </Card.Body>
      <Card.Footer style={{ justifyContent: 'center' }}>
        <Text size="sm">
          Déjà un code ?{' '}
          <RouterLink to="/verify-otp" style={{ color: 'inherit', fontWeight: 600 }}>
            Vérifier mon adresse
          </RouterLink>
        </Text>
      </Card.Footer>
    </Card>
  );
};
