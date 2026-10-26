import { fetchVerifyEmail } from '@/services/auth.api';
import { Alert, Button, Card, Loading } from '@/ui/components';
import { useEffect, useRef, useState } from 'react';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';
import { useBackOfficeSession } from './hooks';

/**
 * Page ouverte depuis le lien reçu à l'inscription (/verify-email?token=…) :
 * active le compte puis connecte automatiquement l'utilisateur.
 */
export const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token')?.trim() ?? '';
  const { openSession } = useBackOfficeSession();

  const [apiError, setApiError] = useState<string | null>(token ? null : 'Le lien de vérification est incomplet.');
  const [isVerified, setIsVerified] = useState(false);
  // Le jeton est à usage unique : évite un second appel (StrictMode exécute les effets deux fois en dev)
  const hasVerified = useRef(false);

  useEffect(() => {
    if (!token || hasVerified.current) return;
    hasVerified.current = true;

    const verify = async () => {
      try {
        const response = await fetchVerifyEmail({ token });
        setIsVerified(true);
        // Connexion automatique (ou message si le compte n'a pas encore de rôle back-office)
        setApiError(openSession(response));
      } catch (err) {
        setApiError(err instanceof Error ? err.message : 'Ce lien de vérification est invalide ou a expiré');
      }
    };

    verify();
  }, [token, openSession]);

  return (
    <Card elevation="sm">
      <Card.Header>
        <Card.Title>Vérification du compte</Card.Title>
      </Card.Header>
      <Card.Body>
        {apiError ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Alert variant={isVerified ? 'warning' : 'danger'}>{apiError}</Alert>
            <Button as={RouterLink} to={isVerified ? '/login' : '/resend-verification'} fullWidth>
              {isVerified ? 'Retour à la connexion' : 'Recevoir un nouveau lien'}
            </Button>
          </div>
        ) : (
          <Loading size="lg" label="Activation de votre compte…" />
        )}
      </Card.Body>
    </Card>
  );
};
