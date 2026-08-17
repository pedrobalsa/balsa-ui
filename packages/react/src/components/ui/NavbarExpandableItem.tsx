import { ChevronDown, ChevronUp } from "lucide-react";
import {
  type KeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from "react";
import { Icon } from "./Icon";
import type { NavigationGroup } from "./navigation";

export interface NavbarExpandableItemProps {
  item: NavigationGroup;
  expanded?: boolean;
  menuId?: string;
  onOpen?: (item: NavigationGroup) => void;
  onClose?: () => void;
  onNavigate?: (item: NavigationGroup, event: ReactMouseEvent<HTMLAnchorElement>) => void;
  children?: ReactNode;
}

export function NavbarExpandableItem({
  item,
  expanded = false,
  menuId,
  onOpen,
  onClose,
  onNavigate,
  children,
}: NavbarExpandableItemProps) {
  const hasLinks = Boolean(item.links?.length);

  return (
    <li
      className="group relative flex h-full shrink-0 items-center gap-balsa-3xs px-balsa-lg"
      onMouseEnter={() => onOpen?.(item)}
      onMouseLeave={() => onClose?.()}
      onKeyDown={(event: KeyboardEvent<HTMLLIElement>) => {
        if (event.key !== "Escape") return;
        event.stopPropagation();
        onClose?.();
      }}
    >
      <a
        href={item.link}
        className="flex h-full cursor-pointer items-center whitespace-nowrap font-balsa-title font-medium text-balsa-foreground no-underline decoration-balsa-accent decoration-2 underline-offset-8 transition-colors hover:text-balsa-foreground hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-balsa-focus-ring"
        aria-expanded={hasLinks ? expanded : undefined}
        aria-controls={hasLinks ? menuId : undefined}
        aria-haspopup={hasLinks ? true : undefined}
        onFocus={() => onOpen?.(item)}
        onClick={(event) => onNavigate?.(item, event)}
      >
        {item.title}
      </a>
      {hasLinks ? (
        <Icon
          icon={expanded ? ChevronUp : ChevronDown}
          size="md"
          className="text-balsa-accent transition-transform duration-200"
        />
      ) : null}
      {children}
    </li>
  );
}
