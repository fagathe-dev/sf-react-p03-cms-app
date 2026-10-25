import { usePermissions } from '@/hooks/usePermissions';
import { ApiError } from '@/services/apiError';
import { createUser, updateUser } from '@/services/user.api';
import { User, UserRole } from '@/types';
import { Alert, Button, Card, ChoiceField, Text, TextField, ToggleField } from '@/ui/components';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { ROLE_DESCRIPTIONS, ROLE_LABELS } from '../constants';
import { buildUserSchema, UserFormData } from '../schemas';
import * as S from './User.styles';

// Champs du formulaire pouvant recevoir une violation renvoyée par l'API
const API_FIELDS: (keyof UserFormData)[] = ['email', 'username', 'firstname', 'lastname', 'role', 'password'];

interface UserFormProps {
  user?: User;
}

export const UserForm = ({ user }: UserFormProps) => {
  const { manageableRoles, user: currentUser } = usePermissions();
  const [apiError, setApiError] = useState<string | null>(null);
  const navigate = useNavigate();
  const isEdit = Boolean(user);
  const isSelf = user?.id === currentUser?.id;

  // Rôles proposés : ceux que l'opérateur peut attribuer (UserService::getManageableRoles)
  const roles = useMemo(
    () => (manageableRoles.length > 0 ? manageableRoles : ['ROLE_CONTRIBUTOR']) as [UserRole, ...UserRole[]],
    [manageableRoles]
  );
  const schema = useMemo(() => buildUserSchema(isEdit ? 'edit' : 'create', roles), [isEdit, roles]);

  const {
    register,
    watch,
    setError,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UserFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: user?.email ?? '',
      username: user?.username ?? '',
      firstname: user?.firstname ?? '',
      lastname: user?.lastname ?? '',
      role: user && roles.includes(user.role) ? user.role : 'ROLE_CONTRIBUTOR',
      password: '',
      confirmPassword: '',
      isVerified: user?.isVerified ?? true,
    },
  });

  const selectedRole = watch('role');

  const onSubmit = async (data: UserFormData) => {
    setApiError(null);

    const common = {
      email: data.email,
      username: data.username,
      firstname: data.firstname || null,
      lastname: data.lastname || null,
      role: data.role,
      isVerified: data.isVerified,
    };

    try {
      const saved = user
        ? await updateUser(user.id, { ...common, password: data.password || null })
        : await createUser({ ...common, password: data.password });

      const name = saved.displayName ?? saved.username;
      navigate(`/users/${saved.id}`, {
        state: {
          successMessage: isEdit ? `Le compte de ${name} a été mis à jour.` : `Le compte de ${name} a été créé.`,
        },
      });
    } catch (err) {
      if (err instanceof ApiError) {
        API_FIELDS.forEach((field) => {
          const message = err.violations[field];
          if (message) setError(field, { message });
        });
      }
      setApiError(err instanceof Error ? err.message : "Erreur lors de l'enregistrement du compte");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      {apiError && (
        <div style={{ marginBottom: '1rem' }}>
          <Alert variant="danger">{apiError}</Alert>
        </div>
      )}

      <Card elevation="sm" style={{ marginBottom: '1.5rem' }}>
        <Card.Header>
          <Card.Title>Identité</Card.Title>
        </Card.Header>
        <Card.Body>
          <S.FieldRow>
            <TextField
              label="Adresse e-mail"
              type="email"
              required
              placeholder="Ex : jane@example.com"
              error={errors.email?.message}
              {...register('email')}
            />
            <TextField
              label="Nom d'utilisateur"
              required
              placeholder="Ex : jane_doe"
              error={errors.username?.message}
              {...register('username')}
            />
          </S.FieldRow>
          <S.FieldRow>
            <TextField label="Prénom" error={errors.firstname?.message} {...register('firstname')} />
            <TextField label="Nom" error={errors.lastname?.message} {...register('lastname')} />
          </S.FieldRow>
        </Card.Body>
      </Card>

      <Card elevation="sm" style={{ marginBottom: '1.5rem' }}>
        <Card.Header>
          <Card.Title>Accès</Card.Title>
        </Card.Header>
        <Card.Body>
          <ChoiceField label="Rôle" required error={errors.role?.message} {...register('role')}>
            {roles.map((role) => (
              <option key={role} value={role}>
                {ROLE_LABELS[role]}
              </option>
            ))}
          </ChoiceField>
          <Text as="p" size="xs" style={{ marginTop: 0 }}>
            {ROLE_DESCRIPTIONS[selectedRole]}
          </Text>

          {isSelf && (
            <div style={{ marginBottom: '1rem' }}>
              <Alert variant="warning">
                Vous modifiez votre propre compte : abaisser votre rôle peut vous retirer l'accès à cette page.
              </Alert>
            </div>
          )}

          <ToggleField label="Adresse e-mail vérifiée" {...register('isVerified')} />
        </Card.Body>
      </Card>

      <Card elevation="sm">
        <Card.Header>
          <Card.Title>{isEdit ? 'Changer le mot de passe' : 'Mot de passe'}</Card.Title>
        </Card.Header>
        <Card.Body>
          {isEdit && (
            <Text as="p" size="sm" style={{ marginTop: 0 }}>
              Laissez vide pour conserver le mot de passe actuel.
            </Text>
          )}
          <S.FieldRow>
            <TextField
              label={isEdit ? 'Nouveau mot de passe' : 'Mot de passe'}
              type="password"
              required={!isEdit}
              autoComplete="new-password"
              placeholder="Min. 8 car., 1 majuscule, 1 chiffre"
              error={errors.password?.message}
              {...register('password')}
            />
            <TextField
              label="Confirmer le mot de passe"
              type="password"
              required={!isEdit}
              autoComplete="new-password"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />
          </S.FieldRow>
        </Card.Body>
      </Card>

      <S.FormActions>
        <Button
          type="button"
          variant="ghost"
          onClick={() => navigate(user ? `/users/${user.id}` : '/users')}
        >
          Annuler
        </Button>
        <Button type="submit" loading={isSubmitting}>
          {isEdit ? 'Enregistrer' : 'Créer le compte'}
        </Button>
      </S.FormActions>
    </form>
  );
};
