import { DashboardResponse } from '@/types';
import { Icon } from '@/ui/components';
import { ComponentProps, ComponentType } from 'react';

export type IconName = ComponentProps<typeof Icon>['name'];

/** Colonne principale (~2/3) ou latérale (~1/3) */
export type DashboardColumn = 'main' | 'side';

export interface DashboardWidgetProps {
  data: DashboardResponse;
  /** Recharge le dashboard après une action (ex. modération), sans repasser par le loader */
  onDataChange: () => void;
}

/**
 * Déclaration d'un widget du registre. Ajouter un widget = un composant + une entrée dans registry.ts.
 */
export interface DashboardWidgetDefinition {
  id: string;
  title: string;
  icon: IconName;
  column: DashboardColumn;
  /** Disponibilité déduite de la présence des données : l'API reste la source de vérité des droits */
  isAvailable: (data: DashboardResponse) => boolean;
  Component: ComponentType<DashboardWidgetProps>;
}
