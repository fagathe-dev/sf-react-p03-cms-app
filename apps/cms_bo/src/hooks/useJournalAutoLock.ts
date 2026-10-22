import { useJournalStore } from '@/stores/journal.store';
import { useEffect, useRef, useState } from 'react';
import { useActionTimer } from './useActionTimer';

/** Durée passée sans focus avant le verrouillage automatique du journal : 1 minute. */
export const JOURNAL_AUTO_LOCK_DELAY_MS = 90_000;

/** La page est « active » si l'onglet est visible ET que la fenêtre a le focus. */
const isPageFocused = (): boolean => document.visibilityState === 'visible' && document.hasFocus();

/**
 * Verrouille le journal une minute après que la page a perdu le focus (changement d'onglet,
 * fenêtre réduite ou autre fenêtre au premier plan). Revenir sur la page avant ce délai
 * annule le verrouillage.
 *
 * Un rechargement (Ctrl + R / F5) n'a pas besoin de cas particulier : il détruit le timer,
 * donc le journal reste déverrouillé et le sessionStorage n'est pas vidé.
 */
export const useJournalAutoLock = () => {
  const lock = useJournalStore((state) => state.lock);
  const isUnlocked = useJournalStore((state) => state.isUnlocked);

  const [isFocused, setIsFocused] = useState(isPageFocused);
  const blurredAtRef = useRef<number | null>(null);

  // Suit le focus de la page : onglet masqué, ou fenêtre qui perd / regagne le focus
  useEffect(() => {
    const syncFocus = () => setIsFocused(isPageFocused());

    window.addEventListener('focus', syncFocus);
    window.addEventListener('blur', syncFocus);
    document.addEventListener('visibilitychange', syncFocus);

    return () => {
      window.removeEventListener('focus', syncFocus);
      window.removeEventListener('blur', syncFocus);
      document.removeEventListener('visibilitychange', syncFocus);
    };
  }, []);

  // Timer d'une minute, actif uniquement si le journal est déverrouillé ET que la page n'a pas le focus.
  // Il est annulé automatiquement dès que `delay` repasse à null (retour sur la page, ou journal verrouillé).
  useActionTimer({
    type: 'timeout',
    delay: isUnlocked && !isFocused ? JOURNAL_AUTO_LOCK_DELAY_MS : null,
    action: lock,
  });

  // Filet de sécurité : pendant une mise en veille ou un onglet gelé, le timer peut être suspendu.
  // Au retour sur la page, on compare l'heure réelle et on verrouille si le délai est dépassé.
  useEffect(() => {
    if (!isUnlocked) {
      blurredAtRef.current = null;
      return;
    }

    if (!isFocused) {
      if (blurredAtRef.current === null) blurredAtRef.current = Date.now();
      return;
    }

    const blurredAt = blurredAtRef.current;
    blurredAtRef.current = null;

    if (blurredAt !== null && Date.now() - blurredAt >= JOURNAL_AUTO_LOCK_DELAY_MS) {
      lock();
    }
  }, [isFocused, isUnlocked, lock]);
};
