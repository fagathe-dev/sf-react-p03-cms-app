import { Alert, Button, Modal } from '@/ui/components';

export const UNSAVED_CHANGES_MESSAGE =
  "Vos modifications ne sont pas enregistrées. Enregistrez l'article avant de quitter le mode Rédaction, sinon elles seront perdues.";

interface UnsavedChangesDialogProps {
  isOpen: boolean;
  isSaving: boolean;
  /** Reste sur l'éditeur (navigation annulée) */
  onStay: () => void;
  /** Quitte l'éditeur en abandonnant les modifications */
  onLeave: () => void;
  /** Enregistre puis poursuit la navigation */
  onSaveAndLeave: () => void;
}

/**
 * Avertit avant de quitter la Rédaction (Aperçu, SEO, retour à la liste…) avec des modifications non enregistrées
 */
export const UnsavedChangesDialog = ({ isOpen, isSaving, onStay, onLeave, onSaveAndLeave }: UnsavedChangesDialogProps) => (
  <Modal isOpen={isOpen} onClose={onStay} maxWidth="480px" closeOnBackdrop={!isSaving}>
    <Modal.Header title="Modifications non enregistrées" onClose={onStay} />
    <Modal.Body>
      <Alert variant="warning">{UNSAVED_CHANGES_MESSAGE}</Alert>
    </Modal.Body>
    <Modal.Footer>
      <Button variant="ghost" onClick={onStay} disabled={isSaving}>
        Rester
      </Button>
      <Button variant="danger" onClick={onLeave} disabled={isSaving}>
        Quitter sans enregistrer
      </Button>
      <Button variant="primary" onClick={onSaveAndLeave} loading={isSaving}>
        Enregistrer et continuer
      </Button>
    </Modal.Footer>
  </Modal>
);
