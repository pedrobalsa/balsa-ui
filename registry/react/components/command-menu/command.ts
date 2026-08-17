import type { LucideIcon } from "lucide-react";

export interface CommandItem {
  id: string;
  label: string;
  keywords?: readonly string[];
  icon?: LucideIcon;
  shortcut?: string;
  disabled?: boolean;
}

export interface CommandGroup {
  id: string;
  label: string;
  items: readonly CommandItem[];
}
