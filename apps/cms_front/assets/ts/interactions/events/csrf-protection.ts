// =============================================================================
// csrf-protection.ts — Double-submit du jeton CSRF « stateless » de Symfony
// -----------------------------------------------------------------------------
// Reprise (sans Stimulus ni Turbo) de csrf_protection_controller.js, fourni par
// la recette symfony/stimulus-bundle. Complète SameOriginCsrfTokenManager
// (config/packages/csrf.yaml, stateless_token_ids) : à la soumission, le nom du
// jeton rendu par Symfony est remplacé par une valeur aléatoire, recopiée dans un
// cookie que le serveur compare au champ envoyé.
//
// Utiliser form.requestSubmit() plutôt que form.submit() : seul le premier
// déclenche l'événement submit écouté ici.
// =============================================================================

const CSRF_FIELD_SELECTOR = 'input[data-controller="csrf-protection"], input[name="_csrf_token"]';
const COOKIE_NAME_ATTRIBUTE = 'data-csrf-protection-cookie-value';

const nameCheck = /^[-_a-zA-Z0-9]{4,22}$/;
const tokenCheck = /^[-_/+a-zA-Z0-9]{24,}$/;

const randomToken = (): string =>
  btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(18))));

const writeCookie = (cookie: string): void => {
  document.cookie = window.location.protocol === 'https:' ? `__Host-${cookie}; secure` : cookie;
};

export const generateCsrfToken = (form: HTMLFormElement): void => {
  const field = form.querySelector<HTMLInputElement>(CSRF_FIELD_SELECTOR);
  if (!field) return;

  let cookieName = field.getAttribute(COOKIE_NAME_ATTRIBUTE);
  let token = field.value;

  if (!cookieName && nameCheck.test(token)) {
    cookieName = token;
    field.setAttribute(COOKIE_NAME_ATTRIBUTE, cookieName);
    token = randomToken();
    field.defaultValue = token;
  }
  field.dispatchEvent(new Event('change', { bubbles: true }));

  if (cookieName && tokenCheck.test(token)) {
    writeCookie(`${cookieName}_${token}=${cookieName}; path=/; samesite=strict`);
  }
};

let listening = false;

/** Pose une seule fois le listener de soumission (phase de capture) */
export const initCsrfProtection = (): void => {
  if (listening) return;
  listening = true;

  document.addEventListener(
    'submit',
    (event) => {
      if (event.target instanceof HTMLFormElement) generateCsrfToken(event.target);
    },
    true,
  );
};
