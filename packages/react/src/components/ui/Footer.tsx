import {
  type CSSProperties,
  type HTMLAttributes,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { mergeClasses } from "./classes";
import { Icon } from "./Icon";
import type {
  BrandLogo,
  FooterContactGroup,
  FooterSection,
  FooterSocialLink,
  NavigationLink,
} from "./navigation";
import {
  BalsaThemeContext,
  useResolvedThemeProps,
} from "./theme-context";
import type { ThemeInput } from "./theme";

export type FooterVariant = "surface" | "inverse";

export interface FooterProps extends HTMLAttributes<HTMLElement> {
  legalLogo: BrandLogo;
  description: string;
  sections: readonly FooterSection[];
  copyright: string;
  contactGroups?: readonly FooterContactGroup[];
  socialLinks?: readonly FooterSocialLink[];
  leadTitle?: string;
  navigationLabel?: string;
  legalText?: string;
  variant?: FooterVariant;
  theme?: ThemeInput;
  onNavigate?: (item: NavigationLink, event: ReactMouseEvent<HTMLAnchorElement>) => void;
}

const variantClasses: Readonly<Record<FooterVariant, string>> = {
  surface: "bg-balsa-surface text-balsa-surface-foreground",
  inverse: "bg-balsa-inverse text-balsa-inverse-foreground",
};

export function Footer(rawProps: FooterProps) {
  const { props, theme } = useResolvedThemeProps("footer", "navigation", rawProps, {} as const);
  const {
    legalLogo,
    description,
    sections,
    copyright,
    contactGroups = [],
    socialLinks = [],
    leadTitle = "Balsa UI",
    navigationLabel = "Footer navigation",
    legalText = "Open source. Open code. Built for Vue.",
    variant = "inverse",
    theme: _themeInput,
    onNavigate,
    className,
    style,
    ...domProps
  } = props;
  void _themeInput;

  function navigate(title: string, link: string, event: ReactMouseEvent<HTMLAnchorElement>): void {
    onNavigate?.({ title, link }, event);
  }

  return (
    <BalsaThemeContext.Provider value={theme}>
      <footer
        {...domProps}
        data-balsa="footer"
        data-theme={theme.explicitPresentation?.id}
        data-theme-base={theme.explicitPresentation?.base}
        data-variant={variant}
        className={mergeClasses(
          "relative z-10 w-full border-t border-balsa-border-strong",
          variantClasses[variant],
          className,
        )}
        style={
          {
            ...theme.explicitPresentation?.style,
            ...style,
          } as CSSProperties
        }
      >
        <div>
          <div className="mx-auto grid max-w-7xl gap-balsa-section-sm px-balsa-xl py-balsa-section-md sm:px-8 lg:grid-cols-[minmax(18rem,1.35fr)_minmax(0,2fr)] lg:gap-x-14 lg:px-12">
            <div className="min-w-0">
              <a
                href={legalLogo.href}
                aria-label={legalLogo.alt}
                className="mb-balsa-2xl inline-flex rounded-balsa-control focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current"
                onClick={(event) => navigate(legalLogo.alt, legalLogo.href, event)}
              >
                {"title" in legalLogo && legalLogo.title ? (
                  <span className="font-balsa-title text-xl font-medium tracking-[0.12em] text-current">
                    {legalLogo.title}
                  </span>
                ) : (
                  <img
                    src={"src" in legalLogo ? legalLogo.src : undefined}
                    alt=""
                    className="h-12 w-44 object-contain object-left"
                  />
                )}
              </a>
              <h3 className="sr-only">{leadTitle}</h3>
              <p className="max-w-sm text-sm text-current/75">{description}</p>
              {contactGroups.length > 0 ? (
                <div className="mt-balsa-3xl grid gap-x-balsa-3xl gap-y-balsa-2xl sm:grid-cols-2">
                  {contactGroups.map((group) => (
                    <div key={group.title} className="min-w-0">
                      <p className="text-current/75">{group.title}</p>
                      <ul className="space-y-balsa-xs">
                        {group.items.map((item) => (
                          <li key={item.label}>
                            {item.link ? (
                              <a
                                href={item.link}
                                target={item.external ? "_blank" : undefined}
                                rel={item.external ? "noreferrer" : undefined}
                                className="block text-sm font-semibold text-current no-underline decoration-current decoration-2 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
                                onClick={(event) => navigate(item.label, item.link!, event)}
                              >
                                {item.label}
                              </a>
                            ) : (
                              <span className="block text-sm font-semibold text-current">
                                {item.label}
                              </span>
                            )}
                            {item.detail ? (
                              <span className="block text-xs text-current/75">{item.detail}</span>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              ) : null}
              {socialLinks.length > 0 ? (
                <ul className="mt-balsa-2xl flex gap-balsa-xl">
                  {socialLinks.map((social) => (
                    <li key={social.link}>
                      <a
                        href={social.link}
                        aria-label={social.title}
                        target="_blank"
                        rel="noreferrer"
                        className="flex cursor-pointer items-center justify-center text-current/75 no-underline transition-colors hover:text-current focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
                        onClick={(event) => navigate(social.title, social.link, event)}
                      >
                        <Icon icon={social.icon} size="xl" />
                      </a>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
            {sections.length > 0 ? (
              <nav
                aria-label={navigationLabel}
                className="grid min-w-0 gap-balsa-3xl sm:grid-cols-2 xl:grid-cols-3"
              >
                {sections.map((section) => (
                  <div key={section.title} className="min-w-0">
                    <h3 className="mb-balsa-xl text-base text-current">{section.title}</h3>
                    <ul className="space-y-balsa-lg">
                      {section.links.map((link) => (
                        <li key={link.link}>
                          <a
                            href={link.link}
                            className="text-sm font-medium text-current/75 no-underline decoration-current decoration-2 underline-offset-4 hover:text-current hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
                            onClick={(event) => navigate(link.title, link.link, event)}
                          >
                            {link.title}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </nav>
            ) : null}
          </div>
        </div>
        <div className="border-t border-current/25">
          <div className="mx-auto flex max-w-7xl flex-col gap-balsa-md px-balsa-xl py-balsa-xl sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-12">
            <p className="text-xs text-current/75">{copyright}</p>
            <p className="text-xs text-current/75">{legalText}</p>
          </div>
        </div>
      </footer>
    </BalsaThemeContext.Provider>
  );
}
