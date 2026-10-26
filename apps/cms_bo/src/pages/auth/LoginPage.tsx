import { useAuthStore } from '@/stores/auth.store';
import { Alert, Card, SegmentedControl, Text } from '@/ui/components';
import { useEffect, useState } from 'react';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { CodeLoginForm, PasswordLoginForm } from './components';

type LoginMode = 'password' | 'code';

const LOGIN_MODES: Array<{ value: LoginMode; label: string; icon: string }> = [
  { value: 'password', label: 'Mot de passe', icon: 'lock-outline' },
  { value: 'code', label: 'Code par e-mail', icon: 'email-fast-outline' },
];

interface LoginLocationState {
  successMessage?: string;
}

export const LoginPage = () => {
  const [mode, setMode] = useState<LoginMode>('password');
  const { token, user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  // Message transmis après inscription ou réinitialisation du mot de passe
  const successMessage = (location.state as LoginLocationState | null)?.successMessage;

  // Redirection automatique si une session valide est déjà active
  useEffect(() => {
    if (token && user) {
      navigate('/', { replace: true });
    }
  }, [token, user, navigate]);

  return (
    <Card elevation="sm">
      <Card.Header>
        <Card.Title>Connexion</Card.Title>
      </Card.Header>
      <Card.Body>
        {successMessage && (
          <div style={{ marginBottom: '1rem' }}>
            <Alert variant="success">{successMessage}</Alert>
          </div>
        )}

        <div style={{ marginBottom: '1rem' }}>
          <SegmentedControl
            aria-label="Mode de connexion"
            options={LOGIN_MODES}
            value={mode}
            onChange={setMode}
            fullWidth
          />
        </div>

        {mode === 'password' ? <PasswordLoginForm /> : <CodeLoginForm />}
      </Card.Body>
      <Card.Footer style={{ flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
        <Text size="sm">
          Pas encore de compte ?{' '}
          <RouterLink to="/register" style={{ color: 'inherit', fontWeight: 600 }}>
            Créer un compte
          </RouterLink>
        </Text>
        <Text size="sm">
          Compte non activé ?{' '}
          <RouterLink to="/resend-verification" style={{ color: 'inherit', fontWeight: 600 }}>
            Recevoir un nouveau lien
          </RouterLink>
        </Text>
      </Card.Footer>
    </Card>
  );
};
