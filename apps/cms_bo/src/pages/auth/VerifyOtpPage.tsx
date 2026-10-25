import { fetchVerifyOtp } from '@/services/auth.api';
import { Alert, Button, Card, Text, TextField } from '@/ui/components';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link as RouterLink, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { z } from 'zod';

const verifyOtpSchema = z.object({
  code: z.string().trim().min(1, 'Le code de vérification est obligatoire'),
});

type VerifyOtpFormData = z.infer<typeof verifyOtpSchema>;

interface VerifyOtpLocationState {
  successMessage?: string;
}

export const VerifyOtpPage = () => {
  const [apiError, setApiError] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  // E-mail transmis par l'inscription (/verify-otp?email=xxx) pour pré-remplir le renvoi du code
  const email = searchParams.get('email') ?? '';
  const infoMessage = (location.state as VerifyOtpLocationState | null)?.successMessage;
  const resendUrl = email ? `/resend-otp?email=${encodeURIComponent(email)}` : '/resend-otp';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<VerifyOtpFormData>({
    resolver: zodResolver(verifyOtpSchema),
    defaultValues: {
      code: '',
    },
  });

  const onSubmit = async (data: VerifyOtpFormData) => {
    setApiError(null);
    try {
      const { message } = await fetchVerifyOtp(data);
      navigate('/login', { replace: true, state: { successMessage: message } });
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Code de vérification invalide');
    }
  };

  return (
    <Card elevation="sm">
      <Card.Header>
        <Card.Title>Vérification de l'e-mail</Card.Title>
      </Card.Header>
      <Card.Body>
        <Text as="p" size="sm" style={{ marginTop: 0 }}>
          Saisissez le code de confirmation reçu par e-mail
          {email ? (
            <>
              {' '}à l'adresse <Text weight="semibold">{email}</Text>
            </>
          ) : null}
          . Il est valable 15 minutes.
        </Text>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          {infoMessage && !apiError && (
            <div style={{ marginBottom: '1rem' }}>
              <Alert variant="success">{infoMessage}</Alert>
            </div>
          )}

          {apiError && (
            <div style={{ marginBottom: '1rem' }}>
              <Alert variant="danger">{apiError}</Alert>
            </div>
          )}

          <TextField
            label="Code de vérification"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="Ex : 123456"
            error={errors.code?.message}
            {...register('code')}
          />

          <Button type="submit" loading={isSubmitting} fullWidth>
            Vérifier mon adresse
          </Button>
        </form>
      </Card.Body>
      <Card.Footer style={{ justifyContent: 'center' }}>
        <Text size="sm">
          Code non reçu ou expiré ?{' '}
          <RouterLink to={resendUrl} style={{ color: 'inherit', fontWeight: 600 }}>
            Renvoyer un code
          </RouterLink>
        </Text>
      </Card.Footer>
    </Card>
  );
};
