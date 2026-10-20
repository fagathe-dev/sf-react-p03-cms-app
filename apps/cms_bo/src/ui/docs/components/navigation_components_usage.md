# Documentation des Composants de Navigation (`navigation_components_usage.md`)

Ce document détaille l'utilisation des composants de navigation (`Navbar`, `Sidebar`, `Tabs`, `Pagination`, `Dropdown`) dans l'application React[cite: 115].

Tous les composants et hooks associés s'importent directement depuis l'index central :

```tsx
import {
  // Navbar
  Navbar,
  NavbarBrand,
  NavbarCollapse,
  NavbarDropdown,
  NavbarDropdownDivider,
  NavbarDropdownHeader,
  NavbarDropdownItem,
  NavbarDropdownMenu,
  NavbarDropdownToggle,
  NavbarItem,
  NavbarLink,
  NavbarNav,
  useDropdown,
  useNavbar,
  // Sidebar
  Sidebar,
  SidebarFooter,
  SidebarHeader,
  SidebarItem,
  SidebarLink,
  SidebarNav,
  SidebarProvider,
  SidebarSection,
  SidebarToggle,
  useSidebar,
  // Tabs
  TabContent,
  TabList,
  Tabs,
  TabTrigger,
  useTabs,
  // Pagination
  Pagination,
  PaginationButton,
  PaginationContainer,
  PaginationEllipsis,
  PaginationItem,
  // Dropdown autonome
  Dropdown,
  DropdownDivider,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  useGenericDropdown,
} from '@/ui/components';
```

---

## 1. Navbar & NavbarDropdown

Barre de navigation horizontale supérieure supportant `sticky`, `breakpoint`, `isOpen` et `onToggle`[cite: 115].
* **Sous-composants** : `Navbar`, `NavbarBrand`, `NavbarCollapse`, `NavbarNav`, `NavbarItem`, `NavbarLink`[cite: 115].
* **Menu intégré** : `NavbarDropdown`, `NavbarDropdownToggle`, `NavbarDropdownMenu`, `NavbarDropdownItem`, `NavbarDropdownHeader`, `NavbarDropdownDivider`[cite: 115].

---

## 2. Sidebar

Barre de navigation latérale verticale (`sticky` sur desktop, tiroir `fixed` avec `Backdrop` sous le `breakpoint`)[cite: 115].
* **Sous-composants** : `SidebarProvider`, `Sidebar`, `SidebarHeader`, `SidebarNav`, `SidebarSection`, `SidebarItem`, `SidebarLink` (slots `icon` et `badge`), `SidebarFooter`, `SidebarToggle`[cite: 115].

---

## 3. Tabs (Système d'Onglets)

Navigation par onglets avec montage conditionnel des panneaux[cite: 115].
* **Sous-composants** : `Tabs` (`defaultValue`, `value`, `onValueChange`), `TabList`, `TabTrigger` (`value`, `disabled`), `TabContent` (`value`)[cite: 115].

---

## 4. Pagination

Navigation par pages avec calcul automatique des intervalles et ellipses[cite: 115].
* **Props** : `currentPage`, `totalPages`, `onPageChange`, `siblingCount = 1`, `showFirstLast = true`, `disabled = false`[cite: 115].
* **Sous-composants atomiques** : `Pagination.Container`, `Pagination.Item`, `Pagination.Button`, `Pagination.Ellipsis`[cite: 115].

---

## 5. Dropdown (Menu d'actions contextuel autonome)

Contrairement à `NavbarDropdown` qui est dédié à la barre supérieure, `Dropdown` s'utilise n'importe où dans l'interface : au bout des lignes d'un `Table` d'articles (bouton `⋮`) ou dans les barres d'outils de cartes. Il se ferme automatiquement au clic extérieur (`mousedown`), à la sélection d'une option ou avec la touche `Escape`.

### 5.1. Sous-composants composés
* **`Dropdown`** : Conteneur racine relatif fournissant le `GenericDropdownContext`.
* **`Dropdown.Trigger`** (`DropdownTrigger`) : Enveloppe l'élément déclencheur (ex. un `<IconButton name="dots-vertical" />` ou un `<Button>`).
* **`Dropdown.Menu`** (`DropdownMenu`) : Liste flottante (`role="menu"`).
* **`Dropdown.Item`** (`DropdownItem`) : Bouton d'action individuel (`role="menuitem"`) qui exécute son `onClick` puis referme automatiquement le menu.
* **`Dropdown.Divider`** (`DropdownDivider`) : Ligne de séparation horizontale.

### 5.2. Props

#### `Dropdown.Menu` (`DropdownMenuProps`)
| Prop | Type | Défaut | Description |
| :--- | :--- | :--- | :--- |
| `align` | `'left' \| 'right'` | `'right'` | Alignement horizontal du menu par rapport au déclencheur |
| `minWidth` | `string` | `'180px'` | Largeur minimale du menu déroulant |

#### `Dropdown.Item` (`DropdownItemProps`)
| Prop | Type | Défaut | Description |
| :--- | :--- | :--- | :--- |
| `icon` | `React.ReactNode` | `undefined` | Icône affichée à gauche du libellé |
| `variant` | `'default' \| 'danger'` | `'default'` | Applique la couleur `danger.base` pour les actions destructrices |
| `disabled` | `boolean` | `false` | Désactive l'action |

### Exemple d'utilisation (Colonne d'actions dans un tableau d'articles)

```tsx
import { Dropdown, Icon, IconButton } from '@/ui/components';

export const PostRowActions = ({
  onEdit,
  onDuplicate,
  onDelete,
}: {
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) => {
  return (
    <Dropdown>
      <Dropdown.Trigger>
        <IconButton aria-label="Actions sur l'article" name="dots-vertical" size="sm" variant="ghost"/>
      </Dropdown.Trigger>

      <Dropdown.Menu align="right" minWidth="190px">
        <Dropdown.Item icon="{<Icon" name="pencil-outline" size="{16}"/>}
          onClick={onEdit}
        >
          Modifier l'article
        </Dropdown.Item>
        <Dropdown.Item icon="{<Icon" name="content-copy" size="{16}"/>}
          onClick={onDuplicate}
        >
          Dupliquer
        </Dropdown.Item>
        <Dropdown.Divider/>
        <Dropdown.Item icon="{<Icon" name="trash-can-outline" size="{16}" variant="danger"/>}
          onClick={onDelete}
        >
          Supprimer
        </Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  );
};
```