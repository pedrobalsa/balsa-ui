import {
  ArrowLeftRight,
  Bell,
  Boxes,
  ChartLine,
  Circle,
  Layers,
  LayoutDashboard,
  Receipt,
  Rocket,
  ScrollText,
  Shield,
  User,
} from "lucide-react";
import { type HTMLAttributes } from "react";
import { Icon, type IconComponent } from "../ui/Icon";
import { mergeClasses } from "../ui/classes";
import { CompositionRoot } from "./_CompositionRoot";
import type { CompositionSurfaceProps } from "./composition";

export interface NavigationMenuItem {
  id: string;
  label: string;
  icon?: IconComponent;
}

export interface NavigationMenuGroup {
  label: string;
  items: readonly NavigationMenuItem[];
}

/**
 * The default groups fill a 1x2 tile, which is the tile a sidebar navigation
 * is designed for: a nav that fits in one unit is a menu, not a sidebar.
 */
const defaultGroups: readonly NavigationMenuGroup[] = [
  { label: "Overview", items: [{ id: "dashboard", label: "Dashboard", icon: LayoutDashboard }, { id: "analytics", label: "Analytics", icon: ChartLine }] },
  { label: "Build", items: [{ id: "projects", label: "Projects", icon: Boxes }, { id: "deployments", label: "Deployments", icon: Rocket }, { id: "environments", label: "Environments", icon: Layers }] },
  { label: "Operate", items: [{ id: "activity", label: "Activity", icon: ArrowLeftRight }, { id: "alerts", label: "Alerts", icon: Bell }, { id: "logs", label: "Logs", icon: ScrollText }] },
  { label: "Account", items: [{ id: "profile", label: "Profile", icon: User }, { id: "security", label: "Security", icon: Shield }, { id: "billing", label: "Billing", icon: Receipt }] },
];

export interface NavigationMenuCardProps extends Omit<HTMLAttributes<HTMLDivElement>, "title" | "color">, CompositionSurfaceProps {
  "data-balsa"?: string;
  title?: string;
  description?: string;
  activeId?: string;
  groups?: readonly NavigationMenuGroup[];
  onNavigate?: (id: string) => void;
}

export function NavigationMenuCard({
  title = "Workspace sidebar",
  description = "Every destination in this workspace, grouped by the work it belongs to.",
  activeId = "dashboard",
  groups = defaultGroups,
  headingLevel,
  shadow,
  theme,
  onNavigate,
  "data-balsa": _dataBalsa,
  ...domProps
}: NavigationMenuCardProps) {
  void _dataBalsa;

  return (
    <CompositionRoot
      {...domProps}
      title={title}
      description={description}
      headingLevel={headingLevel}
      shadow={shadow}
      theme={theme}
      data-composition="navigation-menu"
    >
      <nav aria-label={title} className="grid flex-1 content-start gap-balsa-lg">
        {groups.map((group) => (
          <section key={group.label}>
            <small className="text-balsa-muted-foreground">{group.label}</small>
            <ul className="mt-balsa-xs grid gap-balsa-3xs" role="list">
              {group.items.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    aria-current={item.id === activeId ? "page" : undefined}
                    className={mergeClasses(
                      "flex w-full items-center gap-balsa-md rounded-balsa-control px-balsa-md py-balsa-xs text-left text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-balsa-focus-ring",
                      item.id === activeId ? "bg-balsa-muted font-medium" : "hover:bg-balsa-muted",
                    )}
                    onClick={() => onNavigate?.(item.id)}
                  >
                    <Icon icon={item.icon || Circle} size="sm" />
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </nav>
    </CompositionRoot>
  );
}
