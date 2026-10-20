# Utilisation des Composants de Base (UI Kit)

Ce document détaille l'utilisation des composants "atomiques" de l'application. Tous ces composants héritent des contrats stricts définis dans `@/ui/types/components.types.ts` et utilisent les tokens du Design System.

**Import recommandé :**
Tous les composants doivent être importés depuis l'index global du module UI :
`import { Button, Icon, Avatar } from '@/ui/components';` *(Assurez-vous que le forwarding d'export est configuré).*

---

## 1. Button

Le composant d'action principal. Il gère ses propres états visuels (hover, focus, disabled, loading).

**Props spécifiques :**
- `variant` : `'primary' | 'secondary' | 'tertiary' | 'danger' | 'ghost' | 'outline'` (défaut: `'primary'`)
- `size` : `'sm' | 'base' | 'lg'` (défaut: `'base'`)
- `fullWidth` : `boolean` (prend 100% du conteneur parent)
- `loading` : `boolean` (baisse l'opacité et désactive le clic)

**Exemples d'utilisation :**
```tsx
<Button variant="primary" size="lg" onClick={handleClick}>
  Publier l'article
</Button>

<Button variant="outline" loading>
  Sauvegarde en cours...
</Button>

<Button variant="danger" fullWidth disabled>
  Supprimer
</Button>
```

---

## 2. Icon

Affiche une icône provenant d'une police d'icônes (Material Design Icons `mdi` ou BoxIcons `bx`). Le composant détecte automatiquement la famille si le préfixe est inclus dans le nom.

**Props spécifiques :**
- `name` : `string` (ex: `'mdi-check'`, `'bx-user'`, ou juste `'check'` si on spécifie `iconSet`)
- `iconSet` : `'mdi' | 'bx' | 'bxs' | 'bxl'` (optionnel, fallback sur `mdi`)
- `size` : `number | string` (défaut: `20`)
- `color` : `string` (défaut: `'currentColor'`)
- `spin` : `boolean` (applique une rotation infinie)
- `rotate` : `90 | 180 | 270` (rotation statique)

**Exemples d'utilisation :**
```tsx
{/* Détection automatique via le nom */}
<Icon name="mdi-home" size={24} color="#007bff" />

{/* Sans préfixe, on précise le set */}
<Icon name="user-circle" iconSet="bxs" />

{/* Icône de chargement animée */}
<Icon name="mdi-loading" spin />
```

---

## 3. IconButton

Un bouton carré ou rond contenant uniquement une icône. Idéal pour les barres d'outils (comme l'éditeur de blocs). Il hérite des props du `Button` mais nécessite strictement un attribut `aria-label` pour l'accessibilité.

**Props spécifiques :**
- `name` : `string` (Nom de l'icône, passé au composant `Icon`)
- `aria-label` : `string` (Obligatoire, pour les lecteurs d'écran)
- `round` : `boolean` (Rend le bouton parfaitement rond, défaut: `false`)
- `size` : `'sm' | 'base' | 'lg'` (défaut: `'base'`)

**Exemples d'utilisation :**
```tsx
<IconButton 
  name="mdi-format-bold" 
  variant="ghost" 
  aria-label="Mettre en gras" 
/>

<IconButton 
  name="mdi-close" 
  variant="danger" 
  round 
  size="sm"
  aria-label="Fermer la modale" 
/>
```

---

## 4. Avatar

Affiche l'image de profil d'un utilisateur. Gère automatiquement les erreurs de chargement de l'image (liens cassés) en affichant un fallback basé sur les initiales du nom.

**Props spécifiques :**
- `src` : `string` (URL de l'image)
- `name` : `string` (Sert de fallback pour générer jusqu'à 2 initiales)
- `size` : `'sm' | 'base' | 'lg'` (défaut: `'base'`)

**Exemples d'utilisation :**
```tsx
{/* Affiche l'image de profil */}
<Avatar src="https://api.com/user.jpg" name="Jimmy Doe" size="lg" />

{/* Si l'URL échoue ou est absente, affichera "JD" dans une bulle stylisée */}
<Avatar name="Jimmy Doe" size="base" />
```

---

## 5. Badge

Une petite étiquette visuelle souvent utilisée pour les statuts (ex: "Brouillon", "Publié") ou les catégories.

**Props spécifiques :**
- `variant` : `'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral'`
- `pill` : `boolean` (Arrondit fortement les bords, type pilule)
- `color` : `string` (Permet d'outrepasser le thème en passant un code couleur Hex direct, utile pour des tags d'utilisateurs dynamiques).

**Exemples d'utilisation :**
```tsx
<Badge variant="success" pill>Publié</Badge>

<Badge variant="warning">Brouillon</Badge>

{/* Utilisation dynamique avec une couleur provenant de l'API */}
<Badge color="#8e44ad">Tag Custom</Badge>
```

---

## 6. Link

Un lien stylisé qui peut agir comme une balise `<a>` classique, ou simuler un lien visuel sur un bouton via le polymorphisme.

**Props spécifiques :**
- `href` : `string`
- `as` : `'a' | 'button' | 'span' | 'div'` (défaut: `'a'`)

**Exemples d'utilisation :**
```tsx
{/* Lien classique de navigation extérieure */}
<Link href="https://example.com" target="_blank">
  Visiter le site
</Link>

{/* Lien agissant comme une action de formulaire (pas de redirection) */}
<Link as="button" onClick={() => resetPassword()}>
  Mot de passe oublié ?
</Link>
```

---

## 7. Divider

Un séparateur visuel (ligne) discret, très utile dans les menus ou entre les blocs.

**Props spécifiques :**
- `orientation` : `'horizontal' | 'vertical'` (défaut: `'horizontal'`)
- `margin` : `string` (Permet d'outrepasser la marge par défaut, ex: `'1rem 0'`)

**Exemples d'utilisation :**
```tsx
<div style={{ display: 'flex' }}>
  <span>Élément 1</span>
  <Divider orientation="vertical" />
  <span>Élément 2</span>
</div>

<p>Paragraphe haut</p>
<Divider />
<p>Paragraphe bas</p>
```