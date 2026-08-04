import type { IconComponent } from "./Icon.vue";

export interface CommandItem {
  id: string;
  label: string;
  keywords?: readonly string[];
  icon?: IconComponent;
  shortcut?: string;
  disabled?: boolean;
}

export interface CommandGroup {
  id: string;
  label: string;
  items: readonly CommandItem[];
}
