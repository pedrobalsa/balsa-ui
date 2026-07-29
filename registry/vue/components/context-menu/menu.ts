export type MenuItemType =
  | "action"
  | "checkbox"
  | "radio"
  | "label"
  | "separator"
  | "submenu";

export interface MenuItem {
  id: string;
  label?: string;
  type?: MenuItemType;
  icon?: string;
  shortcut?: string;
  disabled?: boolean;
  destructive?: boolean;
  checked?: boolean;
  value?: string;
  group?: string;
  children?: readonly MenuItem[];
}

export interface MenuSelection {
  id: string;
  type: Exclude<MenuItemType, "label" | "separator" | "submenu">;
  value?: string;
  checked?: boolean;
}

export type MenuVariant = "surface" | "outline" | "soft" | "glass";

export function isInteractiveMenuItem(item: MenuItem): boolean {
  return item.type !== "label" && item.type !== "separator" && !item.disabled;
}
