import { usePermissions } from '@/hooks/usePermissions';
import { deleteUser } from '@/services/user.api';
import { User } from '@/types';
import { Button, ConfirmDialog, Icon, IconButton, Tooltip } from '@/ui/components';
import { useState } from 'react';

interface DeleteUserButtonProps {
  user: User;
  onDeleted: (user: User) => void;
  onError: (message: string) => void;
  /** `icon` dans les tableaux, `button` sur la fiche */
  appearance?: 'icon' | 'button';
}

/**
 * Suppression d'un membre après confirmation (masqué si UserVoter::DELETE l'interdit)
 */
export const DeleteUserButton = ({ user, onDeleted, onError, appearance = 'icon' }: DeleteUserButtonProps) => {
  const { canDeleteUser } = usePermissions();
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!canDeleteUser(user)) return null;

  const name = user.displayName ?? user.username;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteUser(user.id);
      setIsOpen(false);
      onDeleted(user);
    } catch (err) {
      setIsOpen(false);
      onError(err instanceof Error ? err.message : "Erreur lors de la suppression de l'utilisateur");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      {appearance === 'icon' ? (
        <Tooltip content="Supprimer">
          <IconButton
            name="trash-can-outline"
            variant="ghost"
            size="sm"
            aria-label={`Supprimer le compte de ${name}`}
            onClick={() => setIsOpen(true)}
          />
        </Tooltip>
      ) : (
        <Button variant="danger" onClick={() => setIsOpen(true)}>
          <Icon name="trash-can-outline" size={18} />
          Supprimer le compte
        </Button>
      )}

      <ConfirmDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onConfirm={handleDelete}
        title="Supprimer le compte"
        message={`Le compte de ${name} sera définitivement supprimé. Cette action est irréversible.`}
        confirmLabel="Supprimer"
        loading={isDeleting}
      />
    </>
  );
};
