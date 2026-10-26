import { getErrorCode } from '@/services/apiError';
import { fetchLogin } from '@/services/auth.api';
import { Alert, Button, Text, TextField } from '@/ui/components';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link as RouterLink } from 'react-router-dom';
import { z } from 'zod';
import { useBackOfficeSession } from '../hooks';
import { identifierSchema } from '../schemas';

/** Code renvoyé par ApiAuthenticator quand l'adresse e-mail n'est pas vérifiée */
const EMAIL_NOT_VERIFIED = 'email_not_verified';

const passwordLoginSchema = z.object({
  username: identifierSchema,
  password: z.string().min(1, 'Le mot de passe est obligatoire'),
});

type PasswordLoginFormData = z.infer<typeof passwordLoginSchema>;

/**
 * Connexion par identifiant (e-mail ou nom d'utilisateur) + mot de passe.
 */
export const PasswordLoginForm = () => {
  const [apiError, setApiError] = useState<string | null>(null);
  const [isNotVerified, setIsNotVerified] = useState(false);
  const { openSession } = useBackOfficeSession();

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<PasswordLoginFormData>({
    resolver: zodResolver(passwordLoginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const onSubmit = async (data: PasswordLoginFormData) => {
    setApiError(null);
    setIsNotVerified(false);
    try {
      setApiError(openSession(await fetchLogin(data)));
    } catch (err) {
      setIsNotVerified(getErrorCode(err) === EMAIL_NOT_VERIFIED);
      setApiError(err instanceof Error ? err.message : 'Erreur de connexion');
    }
  };

  const resendUrl = `/resend-verification?username=${encodeURIComponent(getValues('username').trim())}`;

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      {apiError && (
        <div style={{ marginBottom: '1rem' }}>
          <Alert variant={isNotVerified ? 'warning' : 'danger'}>
            {apiError}
            {isNotVerified && (
              <>
                {' '}
                <RouterLink to={resendUrl} style={{ color: 'inherit', fontWeight: 600 }}>
                  Recevoir un nouveau lien
                </RouterLink>
              </>
            )}
          </Alert>
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

      <TextField
        label="Mot de passe"
        type="password"
        autoComplete="current-password"
        placeholder="••••••••"
        error={errors.password?.message}
        {...register('password')}
      />

      <div style={{ marginBottom: '1rem', textAlign: 'end' }}>
        <Text size="sm">
          <RouterLink to="/forgot-password" style={{ color: 'inherit', fontWeight: 600 }}>
            Mot de passe oublié ?
          </RouterLink>
        </Text>
      </div>

      <Button type="submit" loading={isSubmitting} fullWidth>
        Se connecter
      </Button>
    </form>
  );
};
