export interface BrandImage {
  src: string;
  alt: string;
  href: string;
  title?: never;
}

export interface BrandTitle {
  title: string;
  alt: string;
  href: string;
  src?: never;
}

export type BrandLogo = BrandImage | BrandTitle;

export interface NavigationLink {
  title: string;
  link: string;
  shortDescription?: string;
}

export interface NavigationGroup extends NavigationLink {
  links?: readonly NavigationLink[];
}

export interface FooterSection {
  title: string;
  links: readonly NavigationLink[];
}

export interface FooterSocialLink {
  title: string;
  link: string;
  icon: IconComponent;
}

export interface FooterContactItem {
  label: string;
  link?: string;
  detail?: string;
  external?: boolean;
}

export interface FooterContactGroup {
  title: string;
  items: readonly FooterContactItem[];
}
import type { IconComponent } from "./Icon.vue";
