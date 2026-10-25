import { Button, Modal, Text, TextareaField, ToggleField } from '@/ui/components';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

export interface ModerationDecision {
  moderationNote: string | null;
  resetFlags: boolean;
}

interface ModerationNoteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (decision: ModerationDecision) => void;
  title: string;
  description: string;
  confirmLabel: string;
  confirmVariant?: 'primary' | 'danger' | 'secondary';
  noteMaxLength: number;
  noteRequired?: boolean;
  showResetFlags?: boolean;
  loading?: boolean;
}

const buildSchema = (maxLength: number, required: boolean) =>
  z.object({
    moderationNote: z
      .string()
      .trim()
      .max(maxLength, `La note ne peut pas dépasser ${maxLength} caractères`)
      .refine((value) => !required || value.length > 0, {
        message: "Une note est obligatoire pour expliquer la décision à l'auteur",
      }),
    resetFlags: z.boolean(),
  });

type ModerationNoteFormData = z.infer<ReturnType<typeof buildSchema>>;

/**
 * Dialogue de décision de modération : note optionnelle (ou obligatoire) et remise à zéro des signalements
 */
export const ModerationNoteDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel,
  confirmVariant = 'primary',
  noteMaxLength,
  noteRequired = false,
  showResetFlags = false,
  loading = false,
}: ModerationNoteDialogProps) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ModerationNoteFormData>({
    resolver: zodResolver(buildSchema(noteMaxLength, noteRequired)),
    defaultValues: {
      moderationNote: '',
      resetFlags: false,
    },
  });

  // Formulaire vierge à chaque ouverture
  useEffect(() => {
    if (isOpen) reset({ moderationNote: '', resetFlags: false });
  }, [isOpen, reset]);

  const onSubmit = (data: ModerationNoteFormData) => {
    onConfirm({
      moderationNote: data.moderationNote || null,
      resetFlags: data.resetFlags,
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Modal.Header title={title} onClose={onClose} />
        <Modal.Body>
          <Text as="p" size="sm" style={{ marginTop: 0 }}>
            {description}
          </Text>

          <TextareaField
            label={noteRequired ? 'Note de modération' : 'Note de modération (optionnelle)'}
            rows={4}
            placeholder="Expliquez votre décision…"
            hint={`${noteMaxLength} caractères maximum.`}
            error={errors.moderationNote?.message}
            {...register('moderationNote')}
          />

          {showResetFlags && <ToggleField label="Remettre les signalements à zéro" {...register('resetFlags')} />}
        </Modal.Body>
        <Modal.Footer>
          <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
            Annuler
          </Button>
          <Button type="submit" variant={confirmVariant} loading={loading}>
            {confirmLabel}
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
};
