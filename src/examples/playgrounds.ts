export interface PlaygroundFooterItem {
  id: string;
  title: string;
}

export interface PlaygroundFooterSection {
  id: string;
  title: string;
  items: readonly PlaygroundFooterItem[];
}

export interface PlaygroundAccordionItem {
  id: string;
  title: string;
  content: string;
  disabled?: boolean;
}

export type PlaygroundStructuredCollection =
  | "carousel"
  | "command-menu"
  | "data-table"
  | "menu"
  | "menubar"
  | "sidebar";

export interface PlaygroundStructuredItem {
  id: string;
  label: string;
  secondary?: string;
  value?: string;
  type?: string;
  color?: string;
  disabled?: boolean;
  destructive?: boolean;
}

export type PlaygroundValue =
  | string
  | number
  | boolean
  | readonly string[]
  | readonly PlaygroundAccordionItem[]
  | readonly PlaygroundStructuredItem[]
  | readonly PlaygroundFooterSection[];
export type PlaygroundValues = Record<string, PlaygroundValue>;

export interface PlaygroundOption {
  label: string;
  value: string;
}

export interface PlaygroundControl {
  key: string;
  label: string;
  type: "color" | "footer-sections" | "multi-select" | "number" | "select" | "structured-items" | "toggle" | "text";
  collection?: PlaygroundStructuredCollection;
  options?: readonly PlaygroundOption[];
  presentation?: "semantic-color";
  hint?: string;
  wide?: boolean;
  min?: number;
  max?: number;
  step?: number;
}

export interface PlaygroundDefinition {
  defaults: PlaygroundValues;
  controls: readonly PlaygroundControl[];
  source: (values: PlaygroundValues) => string;
}

const actionColorOptions: readonly PlaygroundOption[] = [
  { label: "Primary", value: "primary" },
  { label: "Secondary", value: "secondary" },
  { label: "Accent", value: "accent" },
  { label: "Destructive", value: "destructive" },
];

const semanticColorOptions: readonly PlaygroundOption[] = [
  ...actionColorOptions,
  { label: "Success", value: "success" },
  { label: "Warning", value: "warning" },
  { label: "Information", value: "info" },
];
const tableColorOptions: readonly PlaygroundOption[] = [
  { label: "Neutral", value: "neutral" },
  ...semanticColorOptions,
];

const playgroundStatusOptions: readonly PlaygroundOption[] = [
  { label: "Disabled", value: "disabled" },
  { label: "Loading", value: "loading" },
  { label: "Validated", value: "validated" },
  { label: "Unvalidated", value: "unvalidated" },
];

const fieldSizeOptions: readonly PlaygroundOption[] = [
  { label: "Small", value: "sm" },
  { label: "Medium", value: "md" },
];
const formVariantOptions: readonly PlaygroundOption[] = [
  { label: "Outline", value: "outline" },
  { label: "Surface", value: "surface" },
  { label: "Soft", value: "soft" },
  { label: "Glass", value: "glass" },
];
const modalVariantOptions: readonly PlaygroundOption[] = [
  { label: "Surface", value: "surface" },
  { label: "Solid", value: "solid" },
  { label: "Outline", value: "outline" },
  { label: "Soft", value: "soft" },
  { label: "Glass", value: "glass" },
];
const alertActionClasses: Readonly<Record<string, string>> = {
  neutral: "border-balsa-border-strong text-balsa-foreground hover:bg-balsa-muted active:bg-balsa-muted",
  info: "border-balsa-info text-balsa-info hover:bg-balsa-info/15 active:bg-balsa-info/25",
  success: "border-balsa-success text-balsa-success hover:bg-balsa-success/15 active:bg-balsa-success/25",
  warning: "border-balsa-warning text-balsa-warning hover:bg-balsa-warning/15 active:bg-balsa-warning/25",
  destructive: "border-balsa-destructive text-balsa-destructive hover:bg-balsa-destructive/15 active:bg-balsa-destructive/25",
};
const alertActionClass = (color: string, variant: string): string =>
  variant === "solid"
    ? "border-current text-inherit hover:bg-current/15 active:bg-current/25"
    : alertActionClasses[color] ?? alertActionClasses.neutral;
const colorPickerSizeOptions: readonly PlaygroundOption[] = [
  { label: "Small", value: "sm" },
  { label: "Medium", value: "md" },
  { label: "Large", value: "lg" },
];
const roundedOptions: readonly PlaygroundOption[] = [
  { label: "None", value: "none" },
  { label: "Small", value: "sm" },
  { label: "Medium", value: "md" },
  { label: "Large", value: "lg" },
  { label: "Extra large", value: "xl" },
  { label: "2XL", value: "2xl" },
  { label: "3XL", value: "3xl" },
  { label: "Full", value: "full" },
];
const dropdownWidthOptions: readonly PlaygroundOption[] = [
  { label: "Compact", value: "sm" },
  { label: "Default", value: "md" },
  { label: "Wide", value: "lg" },
  { label: "Extra wide", value: "xl" },
];

const bool = (values: PlaygroundValues, key: string): boolean =>
  values[key] === true;
const includes = (values: PlaygroundValues, key: string, option: string): boolean => {
  const value = values[key];
  return Array.isArray(value) && value.includes(option);
};
const fieldStatus = (values: PlaygroundValues): "default" | "validated" | "unvalidated" => {
  if (includes(values, "status", "unvalidated")) return "unvalidated";
  if (includes(values, "status", "validated")) return "validated";
  return "default";
};
const text = (values: PlaygroundValues, key: string): string =>
  String(values[key] ?? "");
const number = (values: PlaygroundValues, key: string): number => {
  const value = values[key];
  return typeof value === "number" ? value : Number(value) || 0;
};
const escapedText = (value: string): string =>
  value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
const escapedAttribute = (value: string): string =>
  escapedText(value).replaceAll('"', "&quot;");
const optionalAttribute = (
  name: string,
  value: string,
  defaultValue: string,
): string => (value === defaultValue ? "" : ` ${name}="${escapedAttribute(value)}"`);
const booleanAttribute = (name: string, value: boolean): string =>
  value ? ` ${name}` : "";
const footerSections = (
  values: PlaygroundValues,
): readonly PlaygroundFooterSection[] => {
  const value = values.sections;
  return Array.isArray(value) ? value as readonly PlaygroundFooterSection[] : [];
};

const accordionItems = (
  values: PlaygroundValues,
): readonly PlaygroundAccordionItem[] => {
  const value = values.items;
  return Array.isArray(value)
    ? value as readonly PlaygroundAccordionItem[]
    : [];
};

const structuredItems = (
  values: PlaygroundValues,
): readonly PlaygroundStructuredItem[] => {
  const value = values.items;
  return Array.isArray(value)
    ? value as readonly PlaygroundStructuredItem[]
    : [];
};

const sourceString = (value: string): string => JSON.stringify(value);

const footerItemLink = (title: string): string => {
  const slug = title
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return `#${slug || "item"}`;
};

function componentSource(
  component: string,
  path: string,
  template: string,
  setup = "",
): string {
  const setupLines = setup ? `\n${setup}` : "";
  return `<script setup lang="ts">\nimport ${component} from "${path}";${setupLines}\n</script>\n\n<template>\n  ${template}\n</template>`;
}

const lucideIconNames: Readonly<Record<string, string>> = {
  plus: "Plus",
  "chevron-down": "ChevronDown",
  "arrow-right": "ArrowRight",
  external: "ExternalLink",
  eye: "Eye",
  code: "Code2",
  "align-left": "AlignLeft",
  "align-center": "AlignCenter",
  "align-right": "AlignRight",
  dashboard: "LayoutDashboard",
  chart: "ChartNoAxesColumn",
  archive: "Archive",
  circle: "Circle",
  info: "Info",
  success: "CircleCheckBig",
  warning: "TriangleAlert",
  destructive: "CircleAlert",
  bell: "Bell",
};

function lucideIconName(value: string): string | undefined {
  return lucideIconNames[value];
}

function lucideImport(values: readonly string[]): string {
  const names = [...new Set(values.map(lucideIconName).filter((name): name is string => Boolean(name)))];
  return names.length ? `import { ${names.join(", ")} } from "@lucide/vue";` : "";
}

const iconPlayground: PlaygroundDefinition = {
  defaults: { icon: "search", size: "md", strokeWidth: "2", label: "Icon placeholder" },
  controls: [
    { key: "icon", label: "Icon", type: "select", options: [{ label: "Search", value: "search" }, { label: "Help", value: "help" }] },
    { key: "size", label: "Size", type: "select", options: [{ label: "Extra small", value: "xs" }, { label: "Small", value: "sm" }, { label: "Medium", value: "md" }, { label: "Large", value: "lg" }, { label: "Extra large", value: "xl" }] },
    { key: "strokeWidth", label: "Stroke width", type: "select", options: [{ label: "1.5", value: "1.5" }, { label: "2", value: "2" }, { label: "2.5", value: "2.5" }] },
    { key: "label", label: "Accessible label", type: "text" },
  ],
  source: (values) => {
    const name = text(values, "icon") === "help" ? "CircleHelp" : "Search";
    const label = text(values, "label");
    return componentSource(
      "Icon",
      "@/components/ui/Icon.vue",
      `<Icon :icon="${name}" size="${escapedAttribute(text(values, "size"))}" :stroke-width="${escapedAttribute(text(values, "strokeWidth"))}"${label ? ` label="${escapedAttribute(label)}"` : ""} />`,
      `import { ${name} } from "@lucide/vue";`,
    );
  },
};

const button: PlaygroundDefinition = {
  defaults: {
    label: "button",
    variant: "solid",
    color: "primary",
    size: "md",
    shape: "rounded",
    icon: "plus",
    suffixIcon: "none",
    disabled: false,
    loading: false,
  },
  controls: [
    { key: "label", label: "Label", type: "text" },
    {
      key: "variant",
      label: "Variant",
      type: "select",
      options: [
        { label: "Solid", value: "solid" },
        { label: "Soft", value: "soft" },
        { label: "Outline", value: "outline" },
        { label: "Glass", value: "glass" },
      ],
    },
    {
      key: "color",
      label: "Color",
      type: "select",
      options: actionColorOptions,
      presentation: "semantic-color",
    },
    {
      key: "size",
      label: "Size",
      type: "select",
      options: [
        { label: "Small", value: "sm" },
        { label: "Medium", value: "md" },
        { label: "Large", value: "lg" },
        { label: "Extra large", value: "xl" },
        { label: "2XL", value: "2xl" },
      ],
    },
    {
      key: "shape",
      label: "Shape",
      type: "select",
      options: [
        { label: "Rounded", value: "rounded" },
        { label: "Pill", value: "pill" },
        { label: "FAB", value: "fab" },
      ],
    },
    {
      key: "icon",
      label: "Prefix icon",
      type: "select",
      options: [
        { label: "None", value: "none" },
        { label: "Plus", value: "plus" },
        { label: "Chevron down", value: "chevron-down" },
        { label: "Arrow right", value: "arrow-right" },
      ],
    },
    {
      key: "suffixIcon",
      label: "Suffix icon",
      type: "select",
      options: [
        { label: "None", value: "none" },
        { label: "Chevron down", value: "chevron-down" },
        { label: "Arrow right", value: "arrow-right" },
      ],
    },
    { key: "disabled", label: "Disabled", type: "toggle" },
    { key: "loading", label: "Loading", type: "toggle" },
  ],
  source: (values) => {
    const icon = text(values, "icon");
    const suffixIcon = text(values, "suffixIcon");
    const fab = text(values, "shape") === "fab";
    const attributes = [
      optionalAttribute("variant", text(values, "variant"), "solid"),
      optionalAttribute("color", text(values, "color"), "primary"),
      optionalAttribute("size", text(values, "size"), "md"),
      optionalAttribute("shape", text(values, "shape"), "rounded"),
      icon === "none" ? "" : ` :prefix-icon="${lucideIconName(icon)}"`,
      suffixIcon === "none" ? "" : ` :suffix-icon="${lucideIconName(suffixIcon)}"`,
      fab ? ` aria-label="${escapedAttribute(text(values, "label"))}"` : "",
      booleanAttribute("disabled", bool(values, "disabled")),
      booleanAttribute("loading", bool(values, "loading")),
    ].join("");
    return componentSource(
      "Button",
      "@/components/ui/Button.vue",
      fab
        ? `<Button${attributes} />`
        : `<Button${attributes}>${escapedText(text(values, "label"))}</Button>`,
      lucideImport([icon, suffixIcon]),
    );
  },
};

const buttonGroup: PlaygroundDefinition = {
  defaults: {
    active: "preview",
    color: "primary",
    size: "sm",
    // ButtonGroup has no underline variant; surface is what the theme resolves
    // to, and the source generator treats it as the omittable default.
    variant: "surface",
    shape: "rounded",
    icons: true,
    collapseLabels: false,
  },
  controls: [
    {
      key: "active",
      label: "Selected item",
      type: "select",
      options: [
        { label: "Preview", value: "preview" },
        { label: "Code", value: "code" },
      ],
    },
    {
      key: "variant",
      label: "Variant",
      type: "select",
      options: [
        { label: "Surface", value: "surface" },
        { label: "Solid", value: "solid" },
        { label: "Outline", value: "outline" },
        { label: "Glass", value: "glass" },
        { label: "Code", value: "code" },
      ],
    },
    {
      key: "color",
      label: "Color",
      type: "select",
      options: actionColorOptions,
      presentation: "semantic-color",
    },
    {
      key: "size",
      label: "Size",
      type: "select",
      options: [
        { label: "Small", value: "sm" },
        { label: "Medium", value: "md" },
        { label: "Large", value: "lg" },
        { label: "Extra large", value: "xl" },
      ],
    },
    {
      key: "shape",
      label: "Shape",
      type: "select",
      options: [
        { label: "Rounded", value: "rounded" },
        { label: "Pill", value: "pill" },
      ],
    },
    { key: "icons", label: "Show icons", type: "toggle" },
    { key: "collapseLabels", label: "Collapse labels", type: "toggle" },
  ],
  source: (values) => {
    const icons = bool(values, "icons");
    const attributes = [
      optionalAttribute("color", text(values, "color"), "primary"),
      optionalAttribute("size", text(values, "size"), "sm"),
      optionalAttribute("variant", text(values, "variant"), "surface"),
      optionalAttribute("shape", text(values, "shape"), "rounded"),
      booleanAttribute("collapse-labels", bool(values, "collapseLabels")),
    ].join("");
    return componentSource(
      "ButtonGroup",
      "@/components/ui/ButtonGroup.vue",
      `<ButtonGroup v-model="activeView" :options="viewOptions" label="Options placeholder"${attributes} />`,
      `import { ref } from "vue";${icons ? '\nimport { Code2, Eye } from "@lucide/vue";' : ""}\n\nconst activeView = ref("${text(values, "active")}");\nconst viewOptions = [\n  { id: "preview", label: "Option 01"${icons ? ", icon: Eye" : ""} },\n  { id: "code", label: "Option 02"${icons ? ", icon: Code2" : ""} },\n];`,
    );
  },
};

const link: PlaygroundDefinition = {
  defaults: {
    label: "Link placeholder",
    variant: "text",
    color: "accent",
    size: "md",
    icon: "arrow-right",
    external: false,
    rounded: "lg",
  },
  controls: [
    { key: "label", label: "Label", type: "text" },
    {
      key: "variant",
      label: "Variant",
      type: "select",
      options: [
        { label: "Text", value: "text" },
        { label: "Solid", value: "solid" },
        { label: "Outline", value: "outline" },
      ],
    },
    {
      key: "color",
      label: "Color",
      type: "select",
      options: actionColorOptions,
      presentation: "semantic-color",
    },
    {
      key: "size",
      label: "Size",
      type: "select",
      options: [
        { label: "Small", value: "sm" },
        { label: "Medium", value: "md" },
        { label: "Large", value: "lg" },
      ],
    },
    {
      key: "icon",
      label: "Suffix icon",
      type: "select",
      options: [
        { label: "None", value: "none" },
        { label: "Arrow right", value: "arrow-right" },
        { label: "Open external", value: "external" },
      ],
    },
    { key: "external", label: "External", type: "toggle" },
    { key: "rounded", label: "Rounded", type: "select", options: roundedOptions },
  ],
  source: (values) => {
    const icon = text(values, "icon");
    const attributes = [
      ' href="/docs"',
      optionalAttribute("variant", text(values, "variant"), "text"),
      optionalAttribute("color", text(values, "color"), "accent"),
      optionalAttribute("size", text(values, "size"), "md"),
      icon === "none" ? "" : ` :suffix-icon="${lucideIconName(icon)}"`,
      booleanAttribute("external", bool(values, "external")),
      optionalAttribute("rounded", text(values, "rounded"), "lg"),
    ].join("");
    return componentSource(
      "Link",
      "@/components/ui/Link.vue",
      `<Link${attributes}>${escapedText(text(values, "label"))}</Link>`,
      lucideImport([icon]),
    );
  },
};

const badge: PlaygroundDefinition = {
  defaults: { label: "Status placeholder", variant: "soft", color: "primary", size: "md", rounded: "full" },
  controls: [
    { key: "label", label: "Label", type: "text" },
    {
      key: "variant",
      label: "Variant",
      type: "select",
      options: [
        { label: "Solid", value: "solid" },
        { label: "Soft", value: "soft" },
        { label: "Outline", value: "outline" },
        { label: "Glass", value: "glass" },
      ],
    },
    {
      key: "color",
      label: "Color",
      type: "select",
      options: semanticColorOptions,
      presentation: "semantic-color",
    },
    {
      key: "size",
      label: "Size",
      type: "select",
      options: [
        { label: "Small", value: "sm" },
        { label: "Medium", value: "md" },
        { label: "Large", value: "lg" },
      ],
    },
    { key: "rounded", label: "Rounded", type: "select", options: roundedOptions },
  ],
  source: (values) =>
    componentSource(
      "Badge",
      "@/components/ui/Badge.vue",
      `<Badge${optionalAttribute("variant", text(values, "variant"), "soft")}${optionalAttribute("color", text(values, "color"), "primary")}${optionalAttribute("size", text(values, "size"), "md")}${optionalAttribute("rounded", text(values, "rounded"), "full")}>${escapedText(text(values, "label"))}</Badge>`,
    ),
};

const card: PlaygroundDefinition = {
  defaults: {
    variant: "surface",
    color: "neutral",
    size: "md",
    rounded: "2xl",
    shadow: true,
    title: "Heading placeholder",
  },
  controls: [
    { key: "title", label: "Title", type: "text" },
    {
      key: "variant",
      label: "Variant",
      type: "select",
      options: [
        { label: "Surface", value: "surface" },
        { label: "Elevated", value: "elevated" },
        { label: "Muted", value: "muted" },
        { label: "Outline", value: "outline" },
        { label: "Soft", value: "soft" },
        { label: "Glass", value: "glass" },
      ],
    },
    {
      key: "color",
      label: "Color",
      type: "select",
      options: [{ label: "Neutral", value: "neutral" }, ...actionColorOptions],
      presentation: "semantic-color",
    },
    {
      key: "size",
      label: "Size",
      type: "select",
      options: [
        { label: "None", value: "none" },
        { label: "Small", value: "sm" },
        { label: "Medium", value: "md" },
        { label: "Large", value: "lg" },
      ],
    },
    { key: "rounded", label: "Rounded", type: "select", options: roundedOptions },
    { key: "shadow", label: "Shadow", type: "toggle" },
  ],
  source: (values) => {
    const shadowAttribute = bool(values, "shadow") ? "" : ' :shadow="false"';
    const attributes = [
      ` variant="${text(values, "variant")}"`,
      optionalAttribute("color", text(values, "color"), "neutral"),
      optionalAttribute("size", text(values, "size"), "md"),
      shadowAttribute,
      optionalAttribute("rounded", text(values, "rounded"), "2xl"),
    ].join("");

    return componentSource(
      "Card",
      "@/components/ui/Card.vue",
      `<Card${attributes}>\n    <h3 class="mb-balsa-xs">${escapedText(text(values, "title"))}</h3>\n    <p class="text-sm opacity-80">Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>\n  </Card>`,
    );
  },
};

const applicationCard: PlaygroundDefinition = {
  defaults: {
    title: "Workspace placeholder",
    description: "Lorem ipsum dolor sit amet.",
    variant: "surface",
    size: "md",
    rounded: "2xl",
    shadow: true,
    footer: true,
  },
  controls: [
    { key: "title", label: "Title", type: "text" },
    { key: "description", label: "Description", type: "text" },
    {
      key: "variant",
      label: "Variant",
      type: "select",
      options: [
        { label: "Surface", value: "surface" },
        { label: "Elevated", value: "elevated" },
        { label: "Muted", value: "muted" },
        { label: "Outline", value: "outline" },
        { label: "Soft", value: "soft" },
        { label: "Glass", value: "glass" },
      ],
    },
    {
      key: "size",
      label: "Size",
      type: "select",
      options: [
        { label: "Small", value: "sm" },
        { label: "Medium", value: "md" },
        { label: "Large", value: "lg" },
      ],
    },
    { key: "rounded", label: "Rounded", type: "select", options: roundedOptions },
    { key: "shadow", label: "Shadow", type: "toggle" },
    { key: "footer", label: "Footer", type: "toggle" },
  ],
  source: (values) => {
    const attributes = [
      ` title="${escapedAttribute(text(values, "title"))}"`,
      ` description="${escapedAttribute(text(values, "description"))}"`,
      optionalAttribute("variant", text(values, "variant"), "surface"),
      optionalAttribute("size", text(values, "size"), "md"),
      optionalAttribute("rounded", text(values, "rounded"), "2xl"),
      bool(values, "shadow") ? "" : ' :shadow="false"',
    ].join("");
    const footer = bool(values, "footer")
      ? '\n    <template #footer>Metadata placeholder</template>'
      : "";
    return componentSource(
      "ApplicationCard",
      "@/components/compositions/ApplicationCard.vue",
      `<ApplicationCard${attributes}>\n    <strong class="text-3xl">92%</strong>${footer}\n  </ApplicationCard>`,
    );
  },
};

const input: PlaygroundDefinition = {
  defaults: {
    label: "Field placeholder",
    type: "text",
    size: "md",
    variant: "surface",
    color: "primary",
    status: [],
    mask: "",
    required: false,
    rounded: "lg",
  },
  controls: [
    { key: "label", label: "Label", type: "text" },
    {
      key: "type",
      label: "Type",
      type: "select",
      options: [
        { label: "Text", value: "text" },
        { label: "Email", value: "email" },
        { label: "Number", value: "number" },
        { label: "Date", value: "date" },
        { label: "Phone", value: "phone" },
        { label: "Password", value: "password" },
        { label: "Monetary", value: "monetary" },
        { label: "Percentage", value: "percentage" },
      ],
    },
    { key: "size", label: "Size", type: "select", options: fieldSizeOptions },
    { key: "variant", label: "Variant", type: "select", options: [
      { label: "Underline", value: "underline" },
      ...formVariantOptions,
    ] },
    { key: "mask", label: "Mask", type: "text", hint: "Use # for each digit, for example ##-##-####." },
    {
      key: "status",
      label: "Status",
      type: "multi-select",
      options: playgroundStatusOptions,
    },
    { key: "required", label: "Required", type: "toggle" },
    { key: "rounded", label: "Rounded", type: "select", options: roundedOptions },
  ],
  source: (values) => {
    const attributes = [
      ' id="display-name"',
      ' v-model="name"',
      ` label="${escapedAttribute(text(values, "label"))}"`,
      optionalAttribute("type", text(values, "type"), "text"),
      optionalAttribute("size", text(values, "size"), "md"),
      optionalAttribute("variant", text(values, "variant"), "surface"),
      optionalAttribute("mask", text(values, "mask"), ""),
      optionalAttribute("status", fieldStatus(values), "default"),
      booleanAttribute("required", bool(values, "required")),
      booleanAttribute("disabled", includes(values, "status", "disabled")),
      booleanAttribute("loading", includes(values, "status", "loading")),
      optionalAttribute("rounded", text(values, "rounded"), "lg"),
    ].join("");
    return componentSource(
      "Input",
      "@/components/ui/Input.vue",
      `<Input${attributes} hint="Helper text placeholder." />`,
      'import { ref } from "vue";\n\nconst name = ref("");',
    );
  },
};

const inputGroup: PlaygroundDefinition = {
  defaults: {
    label: "Address placeholder",
    layout: "inline",
    startText: "https://",
    endText: ".example",
    size: "md",
    status: [],
    required: false,
    rounded: "lg",
  },
  controls: [
    { key: "label", label: "Label", type: "text" },
    {
      key: "layout",
      label: "Layout",
      type: "select",
      options: [
        { label: "Inline", value: "inline" },
        { label: "Stacked", value: "stacked" },
      ],
    },
    { key: "startText", label: "Start text", type: "text" },
    { key: "endText", label: "End text", type: "text" },
    { key: "size", label: "Size", type: "select", options: fieldSizeOptions },
    {
      key: "status",
      label: "Status",
      type: "multi-select",
      options: playgroundStatusOptions,
    },
    { key: "required", label: "Required", type: "toggle" },
    { key: "rounded", label: "Rounded", type: "select", options: roundedOptions },
  ],
  source: (values) =>
    componentSource(
      "InputGroup",
      "@/components/ui/InputGroup.vue",
      `<InputGroup id="address-placeholder" v-model="address" label="${escapedAttribute(text(values, "label"))}"${optionalAttribute("layout", text(values, "layout"), "inline")}${optionalAttribute("start-text", text(values, "startText"), "")}${optionalAttribute("end-text", text(values, "endText"), "")}${optionalAttribute("size", text(values, "size"), "md")}${optionalAttribute("status", fieldStatus(values), "default")}${booleanAttribute("required", bool(values, "required"))}${booleanAttribute("disabled", includes(values, "status", "disabled"))}${booleanAttribute("loading", includes(values, "status", "loading"))}${optionalAttribute("rounded", text(values, "rounded"), "lg")} placeholder="value-placeholder" hint="Helper text placeholder." />`,
      'import { ref } from "vue";\n\nconst address = ref("");',
    ),
};

const inputOTP: PlaygroundDefinition = {
  defaults: {
    label: "Verification code placeholder",
    length: 6,
    mode: "numeric",
    mask: false,
    grouped: false,
    size: "md",
    variant: "surface",
    color: "primary",
    status: [],
    required: true,
    rounded: "lg",
  },
  controls: [
    { key: "label", label: "Label", type: "text" },
    { key: "length", label: "Length", type: "number", min: 4, max: 10, step: 1 },
    {
      key: "mode",
      label: "Mode",
      type: "select",
      options: [
        { label: "Numeric", value: "numeric" },
        { label: "Alphanumeric", value: "alphanumeric" },
      ],
    },
    { key: "mask", label: "Mask", type: "toggle" },
    { key: "grouped", label: "Grouped", type: "toggle" },
    { key: "size", label: "Size", type: "select", options: fieldSizeOptions },
    { key: "variant", label: "Variant", type: "select", options: [
      { label: "Surface", value: "surface" },
      { label: "Outline", value: "outline" },
      { label: "Soft", value: "soft" },
      { label: "Solid", value: "solid" },
      { label: "Glass", value: "glass" },
    ] },
    {
      key: "color",
      label: "Color",
      type: "select",
      options: semanticColorOptions,
      presentation: "semantic-color",
    },
    {
      key: "status",
      label: "Status",
      type: "multi-select",
      options: playgroundStatusOptions,
    },
    { key: "required", label: "Required", type: "toggle" },
    { key: "rounded", label: "Rounded", type: "select", options: roundedOptions },
  ],
  source: (values) =>
    componentSource(
      "InputOTP",
      "@/components/ui/InputOTP.vue",
      `<InputOTP id="code-placeholder" v-model="code" label="${escapedAttribute(text(values, "label"))}" :length="${number(values, "length")}"${optionalAttribute("mode", text(values, "mode"), "numeric")}${booleanAttribute("mask", bool(values, "mask"))}${booleanAttribute("grouped", bool(values, "grouped"))}${optionalAttribute("size", text(values, "size"), "md")}${optionalAttribute("variant", text(values, "variant"), "surface")}${optionalAttribute("color", text(values, "color"), "primary")}${optionalAttribute("status", fieldStatus(values), "default")}${booleanAttribute("required", bool(values, "required"))}${booleanAttribute("disabled", includes(values, "status", "disabled"))}${booleanAttribute("loading", includes(values, "status", "loading"))}${optionalAttribute("rounded", text(values, "rounded"), "lg")} hint="Helper text placeholder." @complete="handleComplete" />`,
      'import { ref } from "vue";\n\nconst code = ref("");\n\nfunction handleComplete(value: string): void {\n  console.info("Code complete", value);\n}',
    ),
};

const radioGroup: PlaygroundDefinition = {
  defaults: {
    label: "Choice placeholder",
    layout: "column",
    color: "primary",
    size: "md",
    status: [],
    required: true,
    rounded: "lg",
  },
  controls: [
    { key: "label", label: "Label", type: "text" },
    {
      key: "layout",
      label: "Layout",
      type: "select",
      options: [
        { label: "Column", value: "column" },
        { label: "Row", value: "row" },
        { label: "Cards", value: "cards" },
      ],
    },
    {
      key: "color",
      label: "Color",
      type: "select",
      options: semanticColorOptions,
      presentation: "semantic-color",
    },
    { key: "size", label: "Size", type: "select", options: fieldSizeOptions },
    {
      key: "status",
      label: "Status",
      type: "multi-select",
      options: playgroundStatusOptions,
    },
    { key: "required", label: "Required", type: "toggle" },
    { key: "rounded", label: "Rounded", type: "select", options: roundedOptions },
  ],
  source: (values) =>
    componentSource(
      "RadioGroup",
      "@/components/ui/RadioGroup.vue",
      `<RadioGroup id="choice-placeholder" v-model="choice" label="${escapedAttribute(text(values, "label"))}" :options="options"${optionalAttribute("layout", text(values, "layout"), "column")}${optionalAttribute("color", text(values, "color"), "primary")}${optionalAttribute("size", text(values, "size"), "md")}${optionalAttribute("status", fieldStatus(values), "default")}${booleanAttribute("required", bool(values, "required"))}${booleanAttribute("disabled", includes(values, "status", "disabled"))}${booleanAttribute("loading", includes(values, "status", "loading"))}${optionalAttribute("rounded", text(values, "rounded"), "lg")} hint="Helper text placeholder." />`,
      'import { ref } from "vue";\n\nconst choice = ref("option-01");\nconst options = [\n  { value: "option-01", label: "Option placeholder 01", description: "Lorem ipsum dolor sit amet." },\n  { value: "option-02", label: "Option placeholder 02", description: "Consectetur adipiscing elit." },\n  { value: "option-03", label: "Option placeholder 03", description: "Sed do eiusmod tempor." },\n];',
    ),
};

const slider: PlaygroundDefinition = {
  defaults: {
    label: "Slider placeholder",
    range: false,
    min: 0,
    max: 100,
    step: 5,
    orientation: "horizontal",
    size: "md",
    showValue: true,
    disabled: false,
    rounded: "full",
  },
  controls: [
    { key: "label", label: "Label", type: "text" },
    { key: "range", label: "Range", type: "toggle" },
    { key: "min", label: "Minimum", type: "number", min: -100, max: 100, step: 1 },
    { key: "max", label: "Maximum", type: "number", min: 0, max: 1000, step: 1 },
    { key: "step", label: "Step", type: "number", min: 1, max: 100, step: 1 },
    {
      key: "orientation",
      label: "Orientation",
      type: "select",
      options: [
        { label: "Horizontal", value: "horizontal" },
        { label: "Vertical", value: "vertical" },
      ],
    },
    {
      key: "size",
      label: "Size",
      type: "select",
      options: [
        { label: "Small", value: "sm" },
        { label: "Medium", value: "md" },
        { label: "Large", value: "lg" },
      ],
    },
    { key: "showValue", label: "Show value", type: "toggle" },
    { key: "disabled", label: "Disabled", type: "toggle" },
    { key: "rounded", label: "Rounded", type: "select", options: roundedOptions },
  ],
  source: (values) =>
    componentSource(
      "Slider",
      "@/components/ui/Slider.vue",
      `<Slider id="range-placeholder" v-model="value" label="${escapedAttribute(text(values, "label"))}" :min="${number(values, "min")}" :max="${number(values, "max")}" :step="${number(values, "step")}"${optionalAttribute("orientation", text(values, "orientation"), "horizontal")}${optionalAttribute("size", text(values, "size"), "md")}${bool(values, "showValue") ? "" : ' :show-value="false"'}${booleanAttribute("disabled", bool(values, "disabled"))}${optionalAttribute("rounded", text(values, "rounded"), "full")} hint="Helper text placeholder." />`,
      `import { ref } from "vue";\n\nconst value = ref${bool(values, "range") ? "<[number, number]>([25, 75])" : "(50)"};`,
    ),
};

const layerVariantOptions: readonly PlaygroundOption[] = [
  { label: "Surface", value: "surface" },
  { label: "Outline", value: "outline" },
  { label: "Soft", value: "soft" },
  { label: "Glass", value: "glass" },
];

const layerSideOptions: readonly PlaygroundOption[] = [
  { label: "Top", value: "top" },
  { label: "Right", value: "right" },
  { label: "Bottom", value: "bottom" },
  { label: "Left", value: "left" },
];

const popup: PlaygroundDefinition = {
  defaults: { label: "Open popup", side: "bottom", align: "center", variant: "surface", size: "md", rounded: "lg" },
  controls: [
    { key: "label", label: "Trigger label", type: "text" },
    { key: "side", label: "Side", type: "select", options: layerSideOptions },
    { key: "align", label: "Align", type: "select", options: [{ label: "Start", value: "start" }, { label: "Center", value: "center" }, { label: "End", value: "end" }] },
    { key: "variant", label: "Variant", type: "select", options: layerVariantOptions },
    { key: "size", label: "Size", type: "select", options: [{ label: "Small", value: "sm" }, { label: "Medium", value: "md" }, { label: "Large", value: "lg" }, { label: "Trigger", value: "trigger" }] },
    { key: "rounded", label: "Rounded", type: "select", options: roundedOptions },
  ],
  source: (values) => componentSource(
    "Popup", "@/components/ui/Popup.vue",
    `<Popup id="settings-popup" v-model="open" label="Settings placeholder"${optionalAttribute("side", text(values, "side"), "bottom")}${optionalAttribute("align", text(values, "align"), "center")}${optionalAttribute("variant", text(values, "variant"), "surface")}${optionalAttribute("size", text(values, "size"), "md")}${optionalAttribute("rounded", text(values, "rounded"), "lg")}>\n    <template #trigger>${escapedText(text(values, "label"))}</template>\n    <h3>Settings placeholder</h3>\n    <p class="mt-balsa-xs text-sm text-balsa-muted-foreground">Lorem ipsum dolor sit amet.</p>\n  </Popup>`,
    'import { ref } from "vue";\n\nconst open = ref(false);',
  ),
};

const hoverCard: PlaygroundDefinition = {
  defaults: { label: "Hover placeholder", side: "bottom", variant: "surface", openDelay: 300, closeDelay: 180, rounded: "lg" },
  controls: [
    { key: "label", label: "Trigger label", type: "text" },
    { key: "side", label: "Side", type: "select", options: layerSideOptions },
    { key: "variant", label: "Variant", type: "select", options: layerVariantOptions },
    { key: "openDelay", label: "Open delay", type: "number", min: 0, max: 1000, step: 50 },
    { key: "closeDelay", label: "Close delay", type: "number", min: 0, max: 1000, step: 50 },
    { key: "rounded", label: "Rounded", type: "select", options: roundedOptions },
  ],
  source: (values) => componentSource(
    "HoverCard", "@/components/ui/HoverCard.vue",
    `<HoverCard id="summary-preview" label="Summary placeholder"${optionalAttribute("side", text(values, "side"), "bottom")}${optionalAttribute("variant", text(values, "variant"), "surface")} :open-delay="${number(values, "openDelay")}" :close-delay="${number(values, "closeDelay")}"${optionalAttribute("rounded", text(values, "rounded"), "lg")}>\n    <template #trigger>${escapedText(text(values, "label"))}</template>\n    <h3>Preview heading placeholder</h3>\n    <p class="mt-balsa-xs text-sm text-balsa-muted-foreground">Lorem ipsum dolor sit amet.</p>\n  </HoverCard>`,
  ),
};

const tooltip: PlaygroundDefinition = {
  defaults: { label: "More information placeholder", side: "top", variant: "surface", openDelay: 300, closeDelay: 180, rounded: "lg" },
  controls: [
    { key: "label", label: "Trigger label", type: "text" },
    { key: "side", label: "Side", type: "select", options: layerSideOptions },
    { key: "variant", label: "Variant", type: "select", options: layerVariantOptions },
    { key: "openDelay", label: "Open delay", type: "number", min: 0, max: 1000, step: 50 },
    { key: "closeDelay", label: "Close delay", type: "number", min: 0, max: 1000, step: 50 },
    { key: "rounded", label: "Rounded", type: "select", options: roundedOptions },
  ],
  source: (values) => componentSource(
    "Tooltip", "@/components/ui/Tooltip.vue",
    `<Tooltip id="more-information" label="More information placeholder"${optionalAttribute("side", text(values, "side"), "top")}${optionalAttribute("variant", text(values, "variant"), "surface")} :open-delay="${number(values, "openDelay")}" :close-delay="${number(values, "closeDelay")}"${optionalAttribute("rounded", text(values, "rounded"), "lg")}>
    <template #trigger>${escapedText(text(values, "label"))}</template>
    Tooltip content placeholder
  </Tooltip>`,
  ),
};

const defaultMenuItems: readonly PlaygroundStructuredItem[] = [
  { id: "edit", label: "Edit placeholder", type: "action" },
  { id: "visible", label: "Visible placeholder", type: "checkbox" },
  { id: "separator", label: "", type: "separator" },
  { id: "remove", label: "Remove placeholder", type: "action", destructive: true },
];
const defaultMenubarItems: readonly PlaygroundStructuredItem[] = [
  { id: "file", label: "File placeholder", secondary: "New placeholder" },
  { id: "edit", label: "Edit placeholder", secondary: "Undo placeholder" },
];
const defaultCommandItems: readonly PlaygroundStructuredItem[] = [
  { id: "home", label: "Home placeholder", secondary: "start, navigation", value: "H" },
  { id: "docs", label: "Docs placeholder", secondary: "guide, reference", value: "D" },
  { id: "create", label: "Create placeholder", secondary: "new, action", value: "C" },
];
function menuSetup(menuItems: readonly PlaygroundStructuredItem[]): string {
  const items = menuItems.map((item) => {
    if (item.type === "separator") {
      return `  { id: ${sourceString(item.id)}, type: "separator" },`;
    }
    const type = item.type === "checkbox" ? ', type: "checkbox", checked: true' : "";
    const disabled = item.disabled ? ", disabled: true" : "";
    const destructive = item.destructive ? ", destructive: true" : "";
    return `  { id: ${sourceString(item.id)}, label: ${sourceString(item.label)}${type}${disabled}${destructive} },`;
  }).join("\n");
  return `import type { MenuItem } from "@/components/ui/menu";\n\nconst items: readonly MenuItem[] = [\n${items}\n];`;
}
const dropdownMenu: PlaygroundDefinition = {
  defaults: { variant: "surface", color: "primary", rounded: "lg", disabled: false, align: "start" },
  controls: [
    { key: "variant", label: "Variant", type: "select", options: layerVariantOptions },
    { key: "color", label: "Color", type: "select", options: actionColorOptions, presentation: "semantic-color" },
    { key: "align", label: "Align", type: "select", options: [{ label: "Start", value: "start" }, { label: "Center", value: "center" }, { label: "End", value: "end" }] },
    { key: "rounded", label: "Rounded", type: "select", options: roundedOptions },
    { key: "disabled", label: "Disabled", type: "toggle" },
  ],
  source: (values) => componentSource(
    "DropdownMenu", "@/components/ui/DropdownMenu.vue",
    `<DropdownMenu id="actions-menu" label="Actions placeholder" :items="items"${optionalAttribute("variant", text(values, "variant"), "surface")}${optionalAttribute("color", text(values, "color"), "primary")}${optionalAttribute("align", text(values, "align"), "start")}${optionalAttribute("rounded", text(values, "rounded"), "lg")}${booleanAttribute("disabled", bool(values, "disabled"))} @select="handleSelect">\n    <template #trigger>Actions placeholder</template>\n  </DropdownMenu>`,
    `${menuSetup(defaultMenuItems)}\n\nfunction handleSelect(item: unknown): void {\n  console.info("Selected", item);\n}`,
  ),
};

const contextMenu: PlaygroundDefinition = {
  defaults: { variant: "surface", color: "primary", rounded: "lg", disabled: false },
  controls: [
    { key: "variant", label: "Variant", type: "select", options: layerVariantOptions },
    { key: "color", label: "Color", type: "select", options: actionColorOptions, presentation: "semantic-color" },
    { key: "rounded", label: "Rounded", type: "select", options: roundedOptions },
    { key: "disabled", label: "Disabled", type: "toggle" },
  ],
  source: (values) => componentSource(
    "ContextMenu", "@/components/ui/ContextMenu.vue",
    `<ContextMenu id="canvas-menu" label="Canvas actions placeholder" :items="items"${optionalAttribute("variant", text(values, "variant"), "surface")}${optionalAttribute("color", text(values, "color"), "primary")}${optionalAttribute("rounded", text(values, "rounded"), "lg")}${booleanAttribute("disabled", bool(values, "disabled"))} @select="handleSelect">\n    <div class="grid min-h-48 place-items-center rounded-xl border border-dashed border-balsa-border-strong">Right-click placeholder</div>\n  </ContextMenu>`,
    `${menuSetup(defaultMenuItems)}\n\nfunction handleSelect(item: unknown): void {\n  console.info("Selected", item);\n}`,
  ),
};

const menubar: PlaygroundDefinition = {
  defaults: { variant: "surface" },
  controls: [
    { key: "variant", label: "Variant", type: "select", options: layerVariantOptions },
  ],
  source: (values) => componentSource(
    "Menubar", "@/components/ui/Menubar.vue",
    `<Menubar id="editor-menubar" v-model="openMenu" label="Editor menu placeholder" :menus="menus"${optionalAttribute("variant", text(values, "variant"), "surface")} @select="handleSelect" />`,
    `import { ref } from "vue";\nimport type { MenubarMenu } from "@/components/ui/Menubar.vue";\n\nconst openMenu = ref<string | null>(null);\nconst menus: readonly MenubarMenu[] = [\n${defaultMenubarItems.map((item) => `  { id: ${sourceString(item.id)}, label: ${sourceString(item.label)}, items: [{ id: ${sourceString(`${item.id}-action`)}, label: ${sourceString(item.secondary || "Action placeholder")} }] },`).join("\n")}\n];\n\nfunction handleSelect(item: unknown): void {\n  console.info("Selected", item);\n}`,
  ),
};

const commandMenu: PlaygroundDefinition = {
  defaults: { mode: "inline", variant: "surface", size: "lg", loading: false, rounded: "xl" },
  controls: [
    { key: "mode", label: "Mode", type: "select", options: [{ label: "Inline", value: "inline" }, { label: "Dialog", value: "dialog" }] },
    { key: "variant", label: "Variant", type: "select", options: layerVariantOptions },
    { key: "size", label: "Size", type: "select", options: [{ label: "Small", value: "sm" }, { label: "Medium", value: "md" }, { label: "Large", value: "lg" }] },
    { key: "loading", label: "Loading", type: "toggle" },
    { key: "rounded", label: "Rounded", type: "select", options: roundedOptions },
  ],
  source: (values) => {
    const mode = text(values, "mode");
    const commandSource = `<CommandMenu id="command-palette" v-model="open" v-model:query="query" label="Commands placeholder" :groups="groups"${optionalAttribute("mode", mode, "inline")}${optionalAttribute("variant", text(values, "variant"), "surface")}${optionalAttribute("size", text(values, "size"), "lg")}${booleanAttribute("loading", bool(values, "loading"))}${optionalAttribute("rounded", text(values, "rounded"), "xl")} @select="handleSelect" />`;
    const trigger = mode === "dialog"
      ? `<Button @click="open = true">Open commands placeholder</Button>\n  ${commandSource}`
      : commandSource;
    const buttonImport = mode === "dialog"
      ? 'import Button from "@/components/ui/Button.vue";\n'
      : "";
    return `<script setup lang="ts">\nimport CommandMenu from "@/components/ui/CommandMenu.vue";\n${buttonImport}import { ref } from "vue";\nimport type { CommandGroup } from "@/components/ui/command";\n\nconst open = ref(false);\nconst query = ref("");\nconst groups: readonly CommandGroup[] = [\n  { id: "commands", label: "Commands placeholder", items: [\n${defaultCommandItems.map((item) => {
      const keywords = (item.secondary ?? "").split(",").map((keyword) => keyword.trim()).filter(Boolean);
      const shortcut = item.value ? `, shortcut: ${sourceString(item.value)}` : "";
      return `    { id: ${sourceString(item.id)}, label: ${sourceString(item.label)}, keywords: ${JSON.stringify(keywords)}${shortcut} },`;
    }).join("\n")}\n  ] },\n];\n\nfunction handleSelect(item: unknown): void {\n  console.info("Selected", item);\n}\n</script>\n\n<template>\n  ${trigger}\n</template>`;
  },
};

const drawer: PlaygroundDefinition = {
  defaults: { side: "bottom", size: "md", variant: "surface", rounded: "2xl", dismissible: true, showHandle: false },
  controls: [
    { key: "side", label: "Side", type: "select", options: layerSideOptions },
    { key: "size", label: "Size", type: "select", options: [{ label: "Small", value: "sm" }, { label: "Medium", value: "md" }, { label: "Large", value: "lg" }] },
    { key: "variant", label: "Variant", type: "select", options: layerVariantOptions },
    { key: "rounded", label: "Rounded", type: "select", options: roundedOptions },
    { key: "dismissible", label: "Dismissible", type: "toggle" },
    { key: "showHandle", label: "Show handle", type: "toggle" },
  ],
  source: (values) => componentSource(
    "Drawer", "@/components/ui/Drawer.vue",
    `<Button @click="open = true">Open drawer placeholder</Button>\n  <Drawer id="task-drawer" v-model="open" title="Task placeholder" description="Lorem ipsum dolor sit amet."${optionalAttribute("side", text(values, "side"), "bottom")}${optionalAttribute("size", text(values, "size"), "md")}${optionalAttribute("variant", text(values, "variant"), "surface")}${optionalAttribute("rounded", text(values, "rounded"), "2xl")}${bool(values, "dismissible") ? "" : ' :dismissible="false"'}${bool(values, "showHandle") ? "" : ' :show-handle="false"'}>\n    <p>Drawer content placeholder.</p>\n    <template #footer="{ close }"><Button variant="outline" @click="close">Close placeholder</Button></template>\n  </Drawer>`,
    'import { ref } from "vue";\nimport Button from "@/components/ui/Button.vue";\n\nconst open = ref(false);',
  ),
};

const colorPicker: PlaygroundDefinition = {
  defaults: {
    color: "#0f766e",
    label: "Color 1",
    type: "field",
    labelPosition: "outside",
    size: "md",
    variant: "surface",
    disabled: false,
    rounded: "lg",
  },
  controls: [
    { key: "label", label: "Label", type: "text" },
    {
      key: "type",
      label: "Type",
      type: "select",
      options: [
        { label: "Field", value: "field" },
        { label: "Palette", value: "palette" },
      ],
    },
    {
      key: "labelPosition",
      label: "Label position",
      type: "select",
      options: [
        { label: "Outside", value: "outside" },
        { label: "Inside", value: "inside" },
      ],
    },
    { key: "size", label: "Size", type: "select", options: colorPickerSizeOptions },
    { key: "variant", label: "Variant", type: "select", options: formVariantOptions },
    { key: "disabled", label: "Disabled", type: "toggle" },
    { key: "rounded", label: "Rounded", type: "select", options: roundedOptions },
  ],
  source: (values) => {
    const type = text(values, "type");
    const labelPosition = text(values, "labelPosition");
    const size = text(values, "size");
    const disabled = booleanAttribute("disabled", bool(values, "disabled"));
    const rounded = optionalAttribute("rounded", text(values, "rounded"), "lg");
    const variant = optionalAttribute("variant", text(values, "variant"), "surface");
    const picker = `<ColorPicker id="placeholder-color" v-model="color" label="${escapedAttribute(text(values, "label"))}"${optionalAttribute("type", type, "field")}${optionalAttribute("label-position", labelPosition, "outside")}${optionalAttribute("size", size, "md")}${variant}${booleanAttribute("disabled", bool(values, "disabled"))}${rounded} />`;
    const paletteLabels = [
      text(values, "label"),
      "Color 2",
      "Color 3",
      "Color 4",
    ];
    const palettePickers = paletteLabels
      .map(
        (label, index) =>
          `<ColorPicker id="palette-color-${index + 1}" v-model="colors[${index}]" label="${escapedAttribute(label)}" type="palette"${variant}${disabled} />`,
      )
      .join("\n  ");
    const template = type === "palette"
      ? `<div class="flex h-12 max-w-xs items-stretch overflow-hidden rounded-balsa-control border border-balsa-border-strong bg-balsa-input">\n  ${palettePickers}\n</div>`
      : picker;

    return componentSource(
      "ColorPicker",
      "@/components/ui/ColorPicker.vue",
      template,
      type === "palette"
        ? `import { ref } from "vue";\n\nconst colors = ref(["${escapedAttribute(text(values, "color"))}", "#7C3AED", "#EA580C", "#0284C7"]);`
        : `import { ref } from "vue";\n\nconst color = ref("${escapedAttribute(text(values, "color"))}");`,
    );
  },
};

function selectionSource(
  component: "Select" | "Autocomplete",
  values: PlaygroundValues,
): string {
  const isSelect = component === "Select";
  const multiple = bool(values, "multiple");
  const options = isSelect
    ? 'const roles = [\n  { label: "Option placeholder 01", value: "option-01" },\n  { label: "Option placeholder 02", value: "option-02" },\n  { label: "Option placeholder 03", value: "option-03" },\n];'
    : 'const frameworks = ["Suggestion 01", "Suggestion 02", "Suggestion 03", "Suggestion 04"];';
  const dataProp = isSelect ? ':options="roles"' : ':suggestions="frameworks"';
  const model = isSelect ? "role" : "framework";
  const label = isSelect ? "Select placeholder" : "Search placeholder";
  const initial = isSelect
    ? multiple
      ? '["option-01", "option-02"]'
      : '"option-02"'
    : multiple
      ? '["Suggestion 01", "Suggestion 03"]'
      : '"Suggestion 01"';
  const attributes = [
    ` id="demo-${model}"`,
    ` v-model="${model}"`,
    ` label="${label}"`,
    ` ${dataProp}`,
    booleanAttribute("multiple", multiple),
    optionalAttribute("size", text(values, "size"), "md"),
    optionalAttribute("variant", text(values, "variant"), "surface"),
    optionalAttribute("status", fieldStatus(values), "default"),
    booleanAttribute("required", bool(values, "required")),
    booleanAttribute("disabled", includes(values, "status", "disabled")),
    booleanAttribute("loading", includes(values, "status", "loading")),
    optionalAttribute("rounded", text(values, "rounded"), "lg"),
  ].join("");
  return componentSource(
    component,
    `@/components/ui/${component}.vue`,
    `<${component}${attributes} />`,
    `import { ref } from "vue";\n\nconst ${model} = ref(${initial});\n${options}`,
  );
}

const selectionControls: readonly PlaygroundControl[] = [
  { key: "size", label: "Size", type: "select", options: fieldSizeOptions },
  { key: "variant", label: "Variant", type: "select", options: formVariantOptions },
  { key: "rounded", label: "Rounded", type: "select", options: roundedOptions },
  {
    key: "status",
    label: "Status",
    type: "multi-select",
    options: playgroundStatusOptions,
  },
  { key: "required", label: "Required", type: "toggle" },
];

const select: PlaygroundDefinition = {
  defaults: { size: "md", variant: "surface", status: [], required: false, multiple: false, rounded: "lg" },
  controls: [
    { key: "multiple", label: "Multiple", type: "toggle" },
    ...selectionControls,
  ],
  source: (values) => selectionSource("Select", values),
};

const autocomplete: PlaygroundDefinition = {
  defaults: { size: "sm", variant: "surface", status: [], required: false, multiple: false, rounded: "lg" },
  controls: [
    { key: "multiple", label: "Multiple", type: "toggle" },
    ...selectionControls,
  ],
  source: (values) => selectionSource("Autocomplete", values),
};

const checkbox: PlaygroundDefinition = {
  defaults: { label: "Checkbox placeholder", checked: true, required: false, disabled: false, size: "md", variant: "surface", rounded: "md" },
  controls: [
    { key: "label", label: "Label", type: "text" },
    { key: "checked", label: "Checked", type: "toggle" },
    { key: "required", label: "Required", type: "toggle" },
    { key: "disabled", label: "Disabled", type: "toggle" },
    { key: "size", label: "Size", type: "select", options: colorPickerSizeOptions },
    { key: "variant", label: "Variant", type: "select", options: formVariantOptions },
    { key: "rounded", label: "Rounded", type: "select", options: roundedOptions },
  ],
  source: (values) =>
    componentSource(
      "Checkbox",
      "@/components/ui/Checkbox.vue",
      `<Checkbox id="placeholder-checkbox" v-model="accepted" label="${escapedAttribute(text(values, "label"))}" hint="Helper text placeholder."${optionalAttribute("size", text(values, "size"), "md")}${optionalAttribute("variant", text(values, "variant"), "surface")}${booleanAttribute("required", bool(values, "required"))}${booleanAttribute("disabled", bool(values, "disabled"))}${optionalAttribute("rounded", text(values, "rounded"), "md")} />`,
      `import { ref } from "vue";\n\nconst accepted = ref(${bool(values, "checked")});`,
    ),
};

const switchComponent: PlaygroundDefinition = {
  defaults: { label: "Switch placeholder", enabled: true, required: false, disabled: false, size: "md", variant: "surface", rounded: "full" },
  controls: [
    { key: "label", label: "Label", type: "text" },
    { key: "enabled", label: "Enabled", type: "toggle" },
    { key: "required", label: "Required", type: "toggle" },
    { key: "disabled", label: "Disabled", type: "toggle" },
    { key: "size", label: "Size", type: "select", options: colorPickerSizeOptions },
    { key: "variant", label: "Variant", type: "select", options: formVariantOptions },
    { key: "rounded", label: "Rounded", type: "select", options: roundedOptions },
  ],
  source: (values) =>
    componentSource(
      "Switch",
      "@/components/ui/Switch.vue",
      `<Switch id="placeholder-switch" v-model="enabled" label="${escapedAttribute(text(values, "label"))}" hint="Helper text placeholder."${optionalAttribute("size", text(values, "size"), "md")}${optionalAttribute("variant", text(values, "variant"), "surface")}${booleanAttribute("required", bool(values, "required"))}${booleanAttribute("disabled", bool(values, "disabled"))}${optionalAttribute("rounded", text(values, "rounded"), "full")} />`,
      `import { ref } from "vue";\n\nconst enabled = ref(${bool(values, "enabled")});`,
    ),
};

const toggle: PlaygroundDefinition = {
  defaults: {
    label: "toggle",
    pressed: true,
    type: "button",
    variant: "surface",
    color: "primary",
    size: "md",
    rounded: "lg",
    icon: "bookmark",
    disabled: false,
  },
  controls: [
    { key: "label", label: "Label", type: "text" },
    { key: "pressed", label: "Pressed", type: "toggle" },
    { key: "type", label: "Type", type: "select", options: [
      { label: "Button", value: "button" },
      { label: "Icon", value: "icon" },
    ] },
    { key: "icon", label: "Icon", type: "select", options: [
      { label: "Bookmark", value: "bookmark" },
      { label: "Heart", value: "heart" },
      { label: "Star", value: "star" },
      { label: "Pin", value: "pin" },
      { label: "Bell", value: "bell" },
      { label: "Flag", value: "flag" },
    ] },
    { key: "variant", label: "Variant", type: "select", options: [
      { label: "Surface", value: "surface" },
      { label: "Solid", value: "solid" },
      { label: "Outline", value: "outline" },
      { label: "Glass", value: "glass" },
    ] },
    { key: "color", label: "Color", type: "select", options: actionColorOptions, presentation: "semantic-color" },
    { key: "size", label: "Size", type: "select", options: [
      ...colorPickerSizeOptions,
      { label: "Extra large", value: "xl" },
    ] },
    { key: "rounded", label: "Rounded", type: "select", options: roundedOptions },
    { key: "disabled", label: "Disabled", type: "toggle" },
  ],
  source: (values) => {
    const type = text(values, "type");
    const iconType = type === "icon";
    const label = text(values, "label");

    return componentSource(
      "Toggle",
      "@/components/ui/Toggle.vue",
      `<Toggle v-model="pressed"${optionalAttribute("type", type, "button")}${iconType ? ` icon="${escapedAttribute(text(values, "icon"))}" aria-label="${escapedAttribute(label)}"` : ""}${optionalAttribute("variant", text(values, "variant"), "surface")}${optionalAttribute("color", text(values, "color"), "primary")}${optionalAttribute("size", text(values, "size"), "md")}${optionalAttribute("rounded", text(values, "rounded"), "lg")}${booleanAttribute("disabled", bool(values, "disabled"))}>${iconType ? "" : escapedText(label)}</Toggle>`,
      `import { ref } from "vue";\n\nconst pressed = ref(${bool(values, "pressed")}); // Toggle state placeholder.`,
    );
  },
};

const toggleGroup: PlaygroundDefinition = {
  defaults: {
    type: "single",
    orientation: "horizontal",
    selection: ["center"],
    allowEmpty: true,
    variant: "surface",
    color: "primary",
    size: "md",
    rounded: "lg",
    disabled: false,
  },
  controls: [
    { key: "type", label: "Selection", type: "select", options: [
      { label: "Single", value: "single" },
      { label: "Multiple", value: "multiple" },
    ] },
    { key: "selection", label: "Pressed items", type: "multi-select", options: [
      { label: "Left", value: "left" },
      { label: "Center", value: "center" },
      { label: "Right", value: "right" },
    ] },
    { key: "orientation", label: "Orientation", type: "select", options: [
      { label: "Horizontal", value: "horizontal" },
      { label: "Vertical", value: "vertical" },
    ] },
    { key: "allowEmpty", label: "Allow empty", type: "toggle" },
    { key: "variant", label: "Variant", type: "select", options: [
      { label: "Surface", value: "surface" },
      { label: "Solid", value: "solid" },
      { label: "Outline", value: "outline" },
      { label: "Glass", value: "glass" },
    ] },
    { key: "color", label: "Color", type: "select", options: actionColorOptions, presentation: "semantic-color" },
    { key: "size", label: "Size", type: "select", options: [
      ...colorPickerSizeOptions,
      { label: "Extra large", value: "xl" },
    ] },
    { key: "rounded", label: "Rounded", type: "select", options: roundedOptions },
    { key: "disabled", label: "Disabled", type: "toggle" },
  ],
  source: (values) => {
    const selection = Array.isArray(values.selection)
      ? values.selection.filter((value): value is string => typeof value === "string")
      : [];
    const initialValue = text(values, "type") === "multiple"
      ? `[${selection.map((value) => `"${escapedAttribute(value)}"`).join(", ")}]`
      : `"${escapedAttribute(selection[0] ?? "")}"`;

    return componentSource(
      "ToggleGroup",
      "@/components/ui/ToggleGroup.vue",
      `<ToggleGroup v-model="alignment" :options="options" label="Text alignment placeholder" type="${escapedAttribute(text(values, "type"))}"${optionalAttribute("orientation", text(values, "orientation"), "horizontal")}${bool(values, "allowEmpty") ? "" : ' :allow-empty="false"'}${optionalAttribute("variant", text(values, "variant"), "surface")}${optionalAttribute("color", text(values, "color"), "primary")}${optionalAttribute("size", text(values, "size"), "md")}${optionalAttribute("rounded", text(values, "rounded"), "lg")}${booleanAttribute("disabled", bool(values, "disabled"))} />`,
      `import { ref } from "vue";\nimport { AlignCenter, AlignLeft, AlignRight } from "@lucide/vue";\n\nconst alignment = ref(${initialValue});\nconst options = [\n  { id: "left", label: "Left", icon: AlignLeft },\n  { id: "center", label: "Center", icon: AlignCenter },\n  { id: "right", label: "Right", icon: AlignRight },\n];`,
    );
  },
};

const collapsible: PlaygroundDefinition = {
  defaults: {
    title: "Details placeholder",
    open: true,
    variant: "underline",
    size: "md",
    rounded: "lg",
    disabled: false,
  },
  controls: [
    { key: "title", label: "Title", type: "text" },
    { key: "open", label: "Open", type: "toggle" },
    { key: "variant", label: "Variant", type: "select", options: [
      { label: "Underline", value: "underline" },
      ...formVariantOptions,
    ] },
    { key: "size", label: "Size", type: "select", options: colorPickerSizeOptions },
    { key: "rounded", label: "Rounded", type: "select", options: roundedOptions },
    { key: "disabled", label: "Disabled", type: "toggle" },
  ],
  source: (values) =>
    componentSource(
      "Collapsible",
      "@/components/ui/Collapsible.vue",
      `<Collapsible id="details-placeholder" v-model="open" title="${escapedAttribute(text(values, "title"))}"${optionalAttribute("variant", text(values, "variant"), "underline")}${optionalAttribute("size", text(values, "size"), "md")}${optionalAttribute("rounded", text(values, "rounded"), "lg")}${booleanAttribute("disabled", bool(values, "disabled"))}>\n    <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>\n  </Collapsible>`,
      `import { ref } from "vue";\n\nconst open = ref(${bool(values, "open")});`,
    ),
};

const defaultAccordionItems: readonly PlaygroundAccordionItem[] = [
  {
    id: "first",
    title: "Question placeholder 01",
    content: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
  },
  {
    id: "second",
    title: "Question placeholder 02",
    content: "Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
  },
  {
    id: "third",
    title: "Question placeholder 03",
    content: "Ut enim ad minim veniam, quis nostrud exercitation ullamco.",
    disabled: true,
  },
];

const accordion: PlaygroundDefinition = {
  defaults: {
    items: defaultAccordionItems,
    type: "single",
    collapsible: true,
    variant: "surface",
    size: "md",
    rounded: "lg",
    disabled: false,
  },
  controls: [
    {
      key: "type",
      label: "Type",
      type: "select",
      options: [
        { label: "Single", value: "single" },
        { label: "Multiple", value: "multiple" },
      ],
    },
    { key: "collapsible", label: "Allow all closed", type: "toggle" },
    { key: "variant", label: "Variant", type: "select", options: [
      { label: "Underline", value: "underline" },
      ...formVariantOptions,
    ] },
    { key: "size", label: "Size", type: "select", options: colorPickerSizeOptions },
    { key: "rounded", label: "Rounded", type: "select", options: roundedOptions },
    { key: "disabled", label: "Disabled", type: "toggle" },
  ],
  source: (values) => {
    const items = accordionItems(values);
    const firstId = items.find((item) => !item.disabled)?.id ?? "";
    const initialValue = text(values, "type") === "multiple"
      ? `[${firstId ? `"${escapedAttribute(firstId)}"` : ""}]`
      : `"${escapedAttribute(firstId)}"`;

    return componentSource(
      "Accordion",
      "@/components/ui/Accordion.vue",
      `<Accordion id="questions-placeholder" v-model="openItems" :items="items" type="${escapedAttribute(text(values, "type"))}"${bool(values, "collapsible") ? "" : ' :collapsible="false"'}${optionalAttribute("variant", text(values, "variant"), "surface")}${optionalAttribute("size", text(values, "size"), "md")}${optionalAttribute("rounded", text(values, "rounded"), "lg")}${booleanAttribute("disabled", bool(values, "disabled"))} />`,
      `import { ref } from "vue";\n\nconst openItems = ref<string | readonly string[]>(${initialValue});\nconst items = ${JSON.stringify(items, null, 2)};`,
    );
  },
};

const kbd: PlaygroundDefinition = {
  defaults: {
    keys: "Ctrl,K",
    separator: "+",
    accessibleLabel: "Control plus K",
    variant: "soft",
    size: "md",
    rounded: "md",
  },
  controls: [
    { key: "keys", label: "Keys", type: "text", hint: "Separate key caps with commas." },
    { key: "separator", label: "Separator", type: "text" },
    { key: "accessibleLabel", label: "Accessible label", type: "text" },
    {
      key: "variant",
      label: "Variant",
      type: "select",
      options: [
        { label: "Raised", value: "raised" },
        { label: "Outline", value: "outline" },
        { label: "Soft", value: "soft" },
      ],
    },
    { key: "size", label: "Size", type: "select", options: colorPickerSizeOptions },
    { key: "rounded", label: "Rounded", type: "select", options: roundedOptions },
  ],
  source: (values) => {
    const keys = text(values, "keys")
      .split(",")
      .map((key) => key.trim())
      .filter(Boolean);
    return componentSource(
      "Kbd",
      "@/components/ui/Kbd.vue",
      `<p class="flex items-center gap-balsa-xs">Press <Kbd :keys="keys" separator="${escapedAttribute(text(values, "separator"))}" accessible-label="${escapedAttribute(text(values, "accessibleLabel"))}"${optionalAttribute("variant", text(values, "variant"), "soft")}${optionalAttribute("size", text(values, "size"), "md")}${optionalAttribute("rounded", text(values, "rounded"), "md")} /> to open the placeholder command menu.</p>`,
      `const keys = ${JSON.stringify(keys)};`,
    );
  },
};

const avatar: PlaygroundDefinition = {
  defaults: {
    label: "Person placeholder",
    fallback: "PP",
    size: "lg",
    shape: "circle",
    loading: "lazy",
    fallbackDelay: 0,
    brokenImage: false,
  },
  controls: [
    { key: "label", label: "Accessible label", type: "text" },
    { key: "fallback", label: "Fallback", type: "text" },
    { key: "size", label: "Size", type: "select", options: [
      { label: "Small", value: "sm" },
      { label: "Medium", value: "md" },
      { label: "Large", value: "lg" },
      { label: "Extra large", value: "xl" },
    ] },
    { key: "shape", label: "Shape", type: "select", options: [
      { label: "Circle", value: "circle" },
      { label: "Rounded", value: "rounded" },
      { label: "Square", value: "square" },
    ] },
    { key: "loading", label: "Image loading", type: "select", options: [
      { label: "Lazy", value: "lazy" },
      { label: "Eager", value: "eager" },
    ] },
    { key: "fallbackDelay", label: "Fallback delay (ms)", type: "number", min: 0, max: 2000, step: 100 },
    { key: "brokenImage", label: "Broken image", type: "toggle" },
  ],
  source: (values) =>
    componentSource(
      "Avatar",
      "@/components/ui/Avatar.vue",
      `<Avatar${bool(values, "brokenImage") ? ' src="/missing-avatar-placeholder.jpg"' : ""} label="${escapedAttribute(text(values, "label"))}" fallback="${escapedAttribute(text(values, "fallback"))}"${optionalAttribute("size", text(values, "size"), "md")}${optionalAttribute("shape", text(values, "shape"), "circle")}${optionalAttribute("loading", text(values, "loading"), "lazy")} :fallback-delay="${number(values, "fallbackDelay")}" />`,
    ),
};

const pagination: PlaygroundDefinition = {
  defaults: {
    total: 248,
    pageSize: 20,
    siblingCount: 1,
    presentation: "pages",
    showEdges: true,
    showLabels: true,
    size: "md",
    rounded: "lg",
    disabled: false,
  },
  controls: [
    { key: "total", label: "Total items", type: "number", min: 0, max: 10000, step: 1 },
    { key: "pageSize", label: "Items per page", type: "number", min: 1, max: 100, step: 1 },
    { key: "siblingCount", label: "Sibling pages", type: "number", min: 0, max: 3, step: 1 },
    { key: "presentation", label: "Presentation", type: "select", options: [
      { label: "Page numbers", value: "pages" },
      { label: "Action labels", value: "action-labels" },
      { label: "Icons only", value: "icons" },
    ] },
    { key: "showEdges", label: "First and last", type: "toggle" },
    { key: "showLabels", label: "Action labels", type: "toggle" },
    { key: "size", label: "Size", type: "select", options: colorPickerSizeOptions },
    { key: "rounded", label: "Rounded", type: "select", options: roundedOptions },
    { key: "disabled", label: "Disabled", type: "toggle" },
  ],
  source: (values) =>
    componentSource(
      "Pagination",
      "@/components/ui/Pagination.vue",
      `<Pagination v-model="page" :total="${number(values, "total")}" :page-size="${number(values, "pageSize")}" :sibling-count="${number(values, "siblingCount")}" label="Result pages placeholder"${optionalAttribute("presentation", text(values, "presentation"), "pages")}${bool(values, "showEdges") ? "" : ' :show-edges="false"'}${bool(values, "showLabels") ? "" : ' :show-labels="false"'}${optionalAttribute("size", text(values, "size"), "md")}${optionalAttribute("rounded", text(values, "rounded"), "lg")}${booleanAttribute("disabled", bool(values, "disabled"))} />`,
      `import { ref } from "vue";\n\nconst page = ref(4);`,
    ),
};

const resizable: PlaygroundDefinition = {
  defaults: {
    value: 42,
    orientation: "horizontal",
    min: 15,
    max: 85,
    step: 5,
    showGrip: true,
    variant: "surface",
    size: "md",
    rounded: "lg",
    disabled: false,
  },
  controls: [
    { key: "value", label: "First panel (%)", type: "number", min: 0, max: 100, step: 1 },
    { key: "orientation", label: "Orientation", type: "select", options: [
      { label: "Horizontal", value: "horizontal" },
      { label: "Vertical", value: "vertical" },
    ] },
    { key: "min", label: "Minimum (%)", type: "number", min: 0, max: 100, step: 1 },
    { key: "max", label: "Maximum (%)", type: "number", min: 0, max: 100, step: 1 },
    { key: "step", label: "Keyboard step", type: "number", min: 1, max: 25, step: 1 },
    { key: "showGrip", label: "Show grip", type: "toggle" },
    { key: "variant", label: "Variant", type: "select", options: formVariantOptions },
    { key: "size", label: "Handle size", type: "select", options: colorPickerSizeOptions },
    { key: "rounded", label: "Rounded", type: "select", options: roundedOptions },
    { key: "disabled", label: "Disabled", type: "toggle" },
  ],
  source: (values) =>
    componentSource(
      "Resizable",
      "@/components/ui/Resizable.vue",
      `<Resizable id="workspace-placeholder" v-model="split" label="Resize placeholder panels" orientation="${escapedAttribute(text(values, "orientation"))}" :min="${number(values, "min")}" :max="${number(values, "max")}" :step="${number(values, "step")}"${bool(values, "showGrip") ? "" : ' :show-grip="false"'}${optionalAttribute("variant", text(values, "variant"), "surface")}${optionalAttribute("size", text(values, "size"), "md")}${optionalAttribute("rounded", text(values, "rounded"), "lg")}${booleanAttribute("disabled", bool(values, "disabled"))} class="h-80">\n    <template #first><div class="p-balsa-2xl">First panel placeholder</div></template>\n    <template #second>\n      <Resizable id="workspace-secondary-placeholder" v-model="secondarySplit" label="Resize secondary placeholder panels" orientation="vertical" :min="25" :max="75" :step="${number(values, "step")}"${bool(values, "showGrip") ? "" : ' :show-grip="false"'}${optionalAttribute("variant", text(values, "variant"), "surface")}${optionalAttribute("size", text(values, "size"), "md")} rounded="none" class="size-full border-0">\n        <template #first><div class="p-balsa-2xl">Second panel placeholder</div></template>\n        <template #second><div class="p-balsa-2xl">Third panel placeholder</div></template>\n      </Resizable>\n    </template>\n  </Resizable>`,
      `import { ref } from "vue";\n\nconst split = ref(${number(values, "value")});\nconst secondarySplit = ref(52);`,
    ),
};

const scrollArea: PlaygroundDefinition = {
  defaults: {
    orientation: "vertical",
    visibility: "auto",
    size: "regular",
    edgeFade: false,
    rounded: "lg",
  },
  controls: [
    { key: "orientation", label: "Orientation", type: "select", options: [
      { label: "Vertical", value: "vertical" },
      { label: "Horizontal", value: "horizontal" },
      { label: "Both", value: "both" },
    ] },
    { key: "visibility", label: "Scrollbar", type: "select", options: [
      { label: "Automatic", value: "auto" },
      { label: "Always reserved", value: "always" },
      { label: "On hover or focus", value: "hover" },
    ] },
    { key: "size", label: "Scrollbar size", type: "select", options: [
      { label: "Thin", value: "thin" },
      { label: "Regular", value: "regular" },
    ] },
    { key: "edgeFade", label: "Edge fade", type: "toggle" },
    { key: "rounded", label: "Rounded", type: "select", options: roundedOptions },
  ],
  source: (values) =>
    componentSource(
      "ScrollArea",
      "@/components/ui/ScrollArea.vue",
      `<ScrollArea label="Scrollable items placeholder" orientation="${escapedAttribute(text(values, "orientation"))}" visibility="${escapedAttribute(text(values, "visibility"))}" size="${escapedAttribute(text(values, "size"))}"${booleanAttribute("edge-fade", bool(values, "edgeFade"))}${optionalAttribute("rounded", text(values, "rounded"), "lg")} class="h-64 w-full">\n    <div class="min-w-[42rem] space-y-balsa-md p-balsa-lg">\n      <p v-for="item in 12" :key="item">Item placeholder {{ item }}</p>\n    </div>\n  </ScrollArea>`,
  ),
};

const preview: PlaygroundDefinition = {
  defaults: { viewport: "desktop", width: 1366, height: 844, aspectRatio: 0, maxWidth: 1600, maxHeight: 480, autoHeight: true, fit: true, edgeToEdge: false, fullscreen: true },
  controls: [
    { key: "viewport", label: "Viewport", type: "select", options: [
      { label: "Responsive", value: "responsive" },
      { label: "Desktop", value: "desktop" },
      { label: "Tablet", value: "tablet" },
      { label: "Mobile", value: "mobile" },
      { label: "Fixed", value: "fixed" },
    ] },
    { key: "width", label: "Logical width", type: "number", min: 240, max: 1920, step: 1 },
    { key: "height", label: "Logical height", type: "number", min: 240, max: 1200, step: 1 },
    { key: "aspectRatio", label: "Canvas aspect ratio", type: "number", min: 0, max: 3, step: 0.01 },
    { key: "maxWidth", label: "Maximum width", type: "number", min: 240, max: 1920, step: 10 },
    { key: "maxHeight", label: "Workbench height", type: "number", min: 240, max: 800, step: 10 },
    { key: "autoHeight", label: "Natural height", type: "toggle" },
    { key: "fit", label: "Scale to fit", type: "toggle" },
    { key: "edgeToEdge", label: "Edge to edge", type: "toggle" },
    { key: "fullscreen", label: "Fullscreen", type: "toggle" },
  ],
  source: (values) => componentSource(
    "Preview",
    "@/components/ui/Preview.vue",
    `<Preview title="Interface placeholder" viewport="${escapedAttribute(text(values, "viewport"))}" :width="${number(values, "width")}" :height="${number(values, "height")}"${number(values, "aspectRatio") > 0 ? ` :aspect-ratio="${number(values, "aspectRatio")}"` : ""} :max-width="${number(values, "maxWidth")}" :max-height="${number(values, "maxHeight")}"${booleanAttribute("auto-height", bool(values, "autoHeight"))}${bool(values, "fit") ? "" : ' :fit="false"'}${booleanAttribute("edge-to-edge", bool(values, "edgeToEdge"))}${bool(values, "fullscreen") ? "" : ' :fullscreen="false"'}>\n    <div class="p-balsa-3xl">Responsive interface placeholder</div>\n  </Preview>`,
  ),
};

const carousel: PlaygroundDefinition = {
  defaults: {
    variant: "surface",
    orientation: "horizontal",
    align: "start",
    loop: false,
    slidesPerView: 1,
    gap: 16,
    controls: true,
    arrowsPosition: "bottom-start",
    indicators: true,
    indicatorsPosition: "bottom-end",
    autoplay: 0,
    rounded: "lg",
  },
  controls: [
    { key: "variant", label: "Variant", type: "select", options: [
      { label: "Surface", value: "surface" },
      { label: "Outline", value: "outline" },
      { label: "Soft", value: "soft" },
      { label: "Glass", value: "glass" },
    ] },
    { key: "orientation", label: "Orientation", type: "select", options: [
      { label: "Horizontal", value: "horizontal" },
      { label: "Vertical", value: "vertical" },
    ] },
    { key: "align", label: "Alignment", type: "select", options: [
      { label: "Start", value: "start" },
      { label: "Center", value: "center" },
      { label: "End", value: "end" },
    ] },
    { key: "slidesPerView", label: "Slides per view", type: "number", min: 1, max: 4, step: 1 },
    { key: "gap", label: "Gap", type: "number", min: 0, max: 48, step: 4 },
    { key: "loop", label: "Loop", type: "toggle" },
    { key: "controls", label: "Controls", type: "toggle" },
    { key: "arrowsPosition", label: "Arrows position", type: "select", options: [
      { label: "Bottom start", value: "bottom-start" },
      { label: "Bottom end", value: "bottom-end" },
      { label: "Inside", value: "inside" },
    ] },
    { key: "indicators", label: "Indicators", type: "toggle" },
    { key: "indicatorsPosition", label: "Indicators position", type: "select", options: [
      { label: "Bottom start", value: "bottom-start" },
      { label: "Bottom center", value: "bottom-center" },
      { label: "Bottom end", value: "bottom-end" },
      { label: "Inside", value: "inside" },
    ] },
    { key: "autoplay", label: "Autoplay (ms)", type: "number", min: 0, max: 10000, step: 1000 },
    { key: "rounded", label: "Rounded", type: "select", options: roundedOptions },
  ],
  source: (values) => componentSource(
    "Carousel",
    "@/components/ui/Carousel.vue",
    `<Carousel :items="items" label="Cards placeholder"${optionalAttribute("variant", text(values, "variant"), "surface")} orientation="${escapedAttribute(text(values, "orientation"))}" align="${escapedAttribute(text(values, "align"))}" :slides-per-view="${number(values, "slidesPerView")}" :gap="${number(values, "gap")}"${booleanAttribute("loop", bool(values, "loop"))}${bool(values, "controls") ? "" : ' :controls="false"'}${optionalAttribute("arrows-position", text(values, "arrowsPosition"), "bottom-start")}${bool(values, "indicators") ? "" : ' :indicators="false"'}${optionalAttribute("indicators-position", text(values, "indicatorsPosition"), "bottom-end")} :autoplay="${number(values, "autoplay")}"${optionalAttribute("rounded", text(values, "rounded"), "lg")}>\n    <template #item="{ item }"><article class="p-balsa-2xl">{{ item.label }}</article></template>\n  </Carousel>`,
    `const items = [\n  { id: "slide-1", label: "Card placeholder 1" },\n  { id: "slide-2", label: "Card placeholder 2" },\n  { id: "slide-3", label: "Card placeholder 3" },\n  { id: "slide-4", label: "Card placeholder 4" },\n  { id: "slide-5", label: "Card placeholder 5" },\n];`,
  ),
};

const sidebar: PlaygroundDefinition = {
  defaults: {
    items: [
      { id: "overview", label: "Overview placeholder", secondary: "dashboard" },
      { id: "reports", label: "Reports placeholder", secondary: "chart", value: "3" },
      { id: "archive", label: "Archive placeholder", secondary: "archive" },
    ] satisfies readonly PlaygroundStructuredItem[],
    collapsed: false,
    side: "left",
    variant: "surface",
    collapsible: "rail",
    rounded: "lg",
  },
  controls: [
    {
      key: "items",
      label: "Navigation items",
      type: "structured-items",
      collection: "sidebar",
      hint: "Edit destinations, Lucide icons, badges, and disabled state.",
      wide: true,
    },
    { key: "collapsed", label: "Collapsed", type: "toggle" },
    { key: "side", label: "Side", type: "select", options: [
      { label: "Left", value: "left" },
      { label: "Right", value: "right" },
    ] },
    { key: "variant", label: "Variant", type: "select", options: formVariantOptions },
    { key: "collapsible", label: "Collapse mode", type: "select", options: [
      { label: "Rail", value: "rail" },
      { label: "Off canvas", value: "offcanvas" },
      { label: "None", value: "none" },
    ] },
    { key: "rounded", label: "Rounded", type: "select", options: roundedOptions },
  ],
  source: (values) => {
    const items = structuredItems(values);
    const iconKeys = items.map((item) => item.secondary ?? "");
    return componentSource(
      "Sidebar",
      "@/components/ui/Sidebar.vue",
      `<Sidebar id="workspace-navigation-placeholder" v-model="active" v-model:collapsed="collapsed" label="Workspace placeholder" :groups="groups" side="${escapedAttribute(text(values, "side"))}" variant="${escapedAttribute(text(values, "variant"))}" collapsible="${escapedAttribute(text(values, "collapsible"))}"${optionalAttribute("rounded", text(values, "rounded"), "lg")} />`,
      `${lucideImport(iconKeys)}\nimport { ref } from "vue";\nimport type { SidebarGroup } from "@/components/ui/Sidebar.vue";\n\nconst active = ref(${sourceString(items[0]?.id ?? "")});\nconst collapsed = ref(${bool(values, "collapsed")});\nconst groups: readonly SidebarGroup[] = [{\n  id: "main",\n  label: "Workspace placeholder",\n  items: [\n${items.map((item) => `    { id: ${sourceString(item.id)}, label: ${sourceString(item.label)}${item.secondary && lucideIconName(item.secondary) ? `, icon: ${lucideIconName(item.secondary)}` : ""}${item.value ? `, badge: ${sourceString(item.value)}` : ""}${item.disabled ? ", disabled: true" : ""} },`).join("\n")}\n  ],\n}];`,
    );
  },
};

const attachment: PlaygroundDefinition = {
  defaults: { multiple: true, accept: ".pdf,.png,.jpg", maxSize: 5242880, maxFiles: 4, required: false, disabled: false, loading: false, status: "default", size: "md", rounded: "lg" },
  controls: [
    { key: "accept", label: "Accepted files", type: "text" },
    { key: "maxSize", label: "Maximum bytes", type: "number", min: 1, max: 50000000, step: 1024 },
    { key: "maxFiles", label: "Maximum files", type: "number", min: 1, max: 20, step: 1 },
    { key: "multiple", label: "Multiple", type: "toggle" },
    { key: "required", label: "Required", type: "toggle" },
    { key: "disabled", label: "Disabled", type: "toggle" },
    { key: "loading", label: "Loading", type: "toggle" },
    { key: "status", label: "Status", type: "select", options: [
      { label: "Default", value: "default" },
      { label: "Unvalidated", value: "unvalidated" },
    ] },
    { key: "size", label: "Size", type: "select", options: colorPickerSizeOptions },
    { key: "rounded", label: "Rounded", type: "select", options: roundedOptions },
  ],
  source: (values) => componentSource(
    "Attachment",
    "@/components/ui/Attachment.vue",
    `<Attachment id="files-placeholder" v-model="files" label="Files placeholder" accept="${escapedAttribute(text(values, "accept"))}" :max-size="${number(values, "maxSize")}" :max-files="${number(values, "maxFiles")}"${booleanAttribute("multiple", bool(values, "multiple"))}${booleanAttribute("required", bool(values, "required"))}${booleanAttribute("disabled", bool(values, "disabled"))}${booleanAttribute("loading", bool(values, "loading"))}${optionalAttribute("status", text(values, "status"), "default")}${optionalAttribute("size", text(values, "size"), "md")}${optionalAttribute("rounded", text(values, "rounded"), "lg")} />`,
    `import { ref } from "vue";\n\nconst files = ref<readonly File[]>([]);`,
  ),
};

const table: PlaygroundDefinition = {
  defaults: { variant: "surface", density: "default", headerColor: "neutral", rowColor: "neutral", striped: true, hover: true, gridlines: false, stickyHeader: false, loading: false, empty: false, rounded: "lg" },
  controls: [
    { key: "variant", label: "Variant", type: "select", options: formVariantOptions },
    { key: "density", label: "Density", type: "select", options: [
      { label: "Compact", value: "compact" },
      { label: "Default", value: "default" },
      { label: "Comfortable", value: "comfortable" },
    ] },
    { key: "headerColor", label: "Header color", type: "select", options: tableColorOptions, presentation: "semantic-color" },
    { key: "rowColor", label: "Rows color", type: "select", options: tableColorOptions, presentation: "semantic-color" },
    { key: "striped", label: "Striped", type: "toggle" },
    { key: "hover", label: "Row hover", type: "toggle" },
    { key: "gridlines", label: "Gridlines", type: "toggle" },
    { key: "stickyHeader", label: "Sticky header", type: "toggle" },
    { key: "loading", label: "Loading", type: "toggle" },
    { key: "empty", label: "Empty", type: "toggle" },
    { key: "rounded", label: "Rounded", type: "select", options: roundedOptions },
  ],
  source: (values) => componentSource(
    "Table",
    "@/components/ui/Table.vue",
    `<Table caption="Results placeholder" variant="${escapedAttribute(text(values, "variant"))}" density="${escapedAttribute(text(values, "density"))}"${optionalAttribute("header-color", text(values, "headerColor"), "neutral")}${optionalAttribute("row-color", text(values, "rowColor"), "neutral")} :column-count="3"${booleanAttribute("striped", bool(values, "striped"))}${bool(values, "hover") ? "" : ' :hover="false"'}${booleanAttribute("gridlines", bool(values, "gridlines"))}${booleanAttribute("sticky-header", bool(values, "stickyHeader"))}${booleanAttribute("loading", bool(values, "loading"))}${booleanAttribute("empty", bool(values, "empty"))}${optionalAttribute("rounded", text(values, "rounded"), "lg")}>\n    <template #header><thead><tr><th scope="col">Name placeholder</th><th scope="col">Status placeholder</th><th scope="col">Value placeholder</th></tr></thead></template>\n    <tbody><tr><th scope="row">Row placeholder</th><td>Ready placeholder</td><td>42</td></tr></tbody>\n  </Table>`,
  ),
};

const calendar: PlaygroundDefinition = {
  defaults: { mode: "single", locale: "en-US", weekStartsOn: 0, months: 1, outsideDays: true, fixedWeeks: true, disabled: false, rounded: "lg" },
  controls: [
    { key: "mode", label: "Selection", type: "select", options: [{ label: "Single", value: "single" }, { label: "Multiple", value: "multiple" }, { label: "Range", value: "range" }] },
    { key: "locale", label: "Locale", type: "text" },
    { key: "weekStartsOn", label: "Week starts on", type: "number", min: 0, max: 6, step: 1 },
    { key: "months", label: "Months", type: "number", min: 1, max: 2, step: 1 },
    { key: "outsideDays", label: "Outside days", type: "toggle" },
    { key: "fixedWeeks", label: "Fixed weeks", type: "toggle" },
    { key: "disabled", label: "Disabled", type: "toggle" },
    { key: "rounded", label: "Rounded", type: "select", options: roundedOptions },
  ],
  source: (values) => componentSource(
    "Calendar", "@/components/ui/Calendar.vue",
    `<Calendar id="calendar-placeholder" v-model="date" label="Date placeholder" mode="${escapedAttribute(text(values, "mode"))}" locale="${escapedAttribute(text(values, "locale"))}" :week-starts-on="${number(values, "weekStartsOn")}" :months="${number(values, "months")}"${bool(values, "outsideDays") ? "" : ' :outside-days="false"'}${bool(values, "fixedWeeks") ? "" : ' :fixed-weeks="false"'}${booleanAttribute("disabled", bool(values, "disabled"))}${optionalAttribute("rounded", text(values, "rounded"), "lg")} />`,
    `import { ref } from "vue";\nimport type { CalendarModelValue } from "@/components/ui/Calendar.vue";\n\nconst date = ref<CalendarModelValue>(new Date(2026, 6, 25));`,
  ),
};
const datePicker: PlaygroundDefinition = {
  defaults: { mode: "single", locale: "en-US", required: false, disabled: false, status: "default", clearable: true, rounded: "lg" },
  controls: [
    { key: "mode", label: "Selection", type: "select", options: [{ label: "Single", value: "single" }, { label: "Range", value: "range" }] },
    { key: "locale", label: "Locale", type: "text" },
    { key: "required", label: "Required", type: "toggle" },
    { key: "disabled", label: "Disabled", type: "toggle" },
    { key: "status", label: "Status", type: "select", options: [{ label: "Default", value: "default" }, { label: "Unvalidated", value: "unvalidated" }] },
    { key: "clearable", label: "Clearable", type: "toggle" },
    { key: "rounded", label: "Rounded", type: "select", options: roundedOptions },
  ],
  source: (values) => componentSource(
    "DatePicker", "@/components/ui/DatePicker.vue",
    `<DatePicker id="due-date-placeholder" v-model="date" label="Due date placeholder" mode="${escapedAttribute(text(values, "mode"))}" locale="${escapedAttribute(text(values, "locale"))}"${booleanAttribute("required", bool(values, "required"))}${booleanAttribute("disabled", bool(values, "disabled"))}${optionalAttribute("status", text(values, "status"), "default")}${bool(values, "clearable") ? "" : ' :clearable="false"'}${optionalAttribute("rounded", text(values, "rounded"), "lg")} />`,
    `import { ref } from "vue";\nimport type { CalendarModelValue } from "@/components/ui/Calendar.vue";\n\nconst date = ref<CalendarModelValue>(null);`,
  ),
};
const dataTable: PlaygroundDefinition = {
  defaults: {
    selection: "multiple",
    pageSize: 5,
    variant: "surface",
    density: "default",
    headerColor: "neutral",
    rowColor: "neutral",
    striped: true,
    gridlines: false,
    loading: false,
    rounded: "lg",
  },
  controls: [
    { key: "selection", label: "Selection", type: "select", options: [{ label: "None", value: "none" }, { label: "Single", value: "single" }, { label: "Multiple", value: "multiple" }] },
    { key: "pageSize", label: "Rows per page", type: "number", min: 1, max: 10, step: 1 },
    { key: "variant", label: "Variant", type: "select", options: formVariantOptions },
    { key: "density", label: "Density", type: "select", options: [{ label: "Compact", value: "compact" }, { label: "Default", value: "default" }, { label: "Comfortable", value: "comfortable" }] },
    { key: "headerColor", label: "Header color", type: "select", options: tableColorOptions, presentation: "semantic-color" },
    { key: "rowColor", label: "Rows color", type: "select", options: tableColorOptions, presentation: "semantic-color" },
    { key: "striped", label: "Striped", type: "toggle" },
    { key: "gridlines", label: "Gridlines", type: "toggle" },
    { key: "loading", label: "Loading", type: "toggle" },
    { key: "rounded", label: "Rounded", type: "select", options: roundedOptions },
  ],
  source: (values) => componentSource(
    "DataTable", "@/components/ui/DataTable.vue",
    `<DataTable id="results-placeholder" caption="Results placeholder" :columns="columns" :data="rows" row-key="id" selection="${escapedAttribute(text(values, "selection"))}" :page-size="${number(values, "pageSize")}" variant="${escapedAttribute(text(values, "variant"))}" density="${escapedAttribute(text(values, "density"))}"${optionalAttribute("header-color", text(values, "headerColor"), "neutral")}${optionalAttribute("row-color", text(values, "rowColor"), "neutral")}${booleanAttribute("striped", bool(values, "striped"))}${booleanAttribute("gridlines", bool(values, "gridlines"))}${booleanAttribute("loading", bool(values, "loading"))}${optionalAttribute("rounded", text(values, "rounded"), "lg")} />`,
    `const columns = [\n  { id: "name", label: "Name placeholder", sortable: true, filterable: true },\n  { id: "status", label: "Status placeholder", filterable: true },\n  { id: "value", label: "Value placeholder", sortable: true, align: "right" as const },\n];\nconst rows = Array.from({ length: 12 }, (_, index) => ({\n  id: \`row-\${index + 1}\`,\n  name: \`Row placeholder \${index + 1}\`,\n  status: index % 2 ? "Pending placeholder" : "Ready placeholder",\n  value: (index + 1) * 12,\n}));`,
  ),
};
const charts: PlaygroundDefinition = {
  defaults: {
    type: "bar",
    barMode: "grouped",
    color: "primary",
    secondaryColor: "secondary",
    loading: false,
    error: false,
    showLegend: true,
    showGrid: true,
    showTooltip: true,
    showTable: false,
    responsive: true,
    height: 320,
    rounded: "lg",
  },
  controls: [
    { key: "type", label: "Chart type", type: "select", options: [{ label: "Bar", value: "bar" }, { label: "Line", value: "line" }, { label: "Area", value: "area" }, { label: "Donut", value: "donut" }, { label: "Doughnut alias", value: "doughnut" }] },
    { key: "barMode", label: "Bar mode", type: "select", options: [{ label: "Grouped", value: "grouped" }, { label: "Stacked", value: "stacked" }] },
    { key: "color", label: "Color", type: "select", options: semanticColorOptions, presentation: "semantic-color" },
    { key: "secondaryColor", label: "Secondary color", type: "select", options: semanticColorOptions, presentation: "semantic-color" },
    { key: "loading", label: "Loading", type: "toggle" },
    { key: "error", label: "Error", type: "toggle" },
    { key: "showLegend", label: "Legend", type: "toggle" },
    { key: "showGrid", label: "Horizontal grid", type: "toggle" },
    { key: "showTooltip", label: "Tooltip", type: "toggle" },
    { key: "showTable", label: "Visible data table", type: "toggle" },
    { key: "responsive", label: "Responsive", type: "toggle" },
    { key: "height", label: "Height", type: "number", min: 160, max: 600, step: 20 },
    { key: "rounded", label: "Rounded", type: "select", options: roundedOptions },
  ],
  source: (values) => componentSource(
    "Charts", "@/components/ui/Charts.vue",
    `<Charts title="Metrics placeholder" type="${escapedAttribute(text(values, "type"))}" bar-mode="${escapedAttribute(text(values, "barMode"))}" :labels="labels" :series="series" :colors="colors"${booleanAttribute("loading", bool(values, "loading"))}${bool(values, "error") ? ' error="Chart error placeholder."' : ""}${bool(values, "showLegend") ? "" : ' :show-legend="false"'}${bool(values, "showGrid") ? "" : ' :show-grid="false"'}${bool(values, "showTooltip") ? "" : ' :show-tooltip="false"'}${booleanAttribute("show-table", bool(values, "showTable"))}${bool(values, "responsive") ? "" : ' :responsive="false"'} :height="${number(values, "height")}"${optionalAttribute("rounded", text(values, "rounded"), "lg")} />`,
    `const labels = ["Alpha placeholder", "Beta placeholder", "Gamma placeholder", "Delta placeholder"];\nconst colors = [${sourceString(text(values, "color"))}, ${sourceString(text(values, "secondaryColor"))}] as const;\nconst series = [\n  { label: "Primary series placeholder", data: [18, 32, 24, 41] },\n  { label: "Secondary series placeholder", data: [12, 22, 30, 28] },\n];`,
  ),
};

const separator: PlaygroundDefinition = {
  defaults: {
    label: "Section placeholder",
    orientation: "horizontal",
    variant: "solid",
    size: "sm",
    align: "center",
    decorative: true,
  },
  controls: [
    { key: "label", label: "Label", type: "text" },
    {
      key: "orientation",
      label: "Orientation",
      type: "select",
      options: [
        { label: "Horizontal", value: "horizontal" },
        { label: "Vertical", value: "vertical" },
      ],
    },
    {
      key: "variant",
      label: "Variant",
      type: "select",
      options: [
        { label: "Solid", value: "solid" },
        { label: "Dashed", value: "dashed" },
        { label: "Dotted", value: "dotted" },
      ],
    },
    { key: "size", label: "Thickness", type: "select", options: colorPickerSizeOptions },
    {
      key: "align",
      label: "Label alignment",
      type: "select",
      options: [
        { label: "Start", value: "start" },
        { label: "Center", value: "center" },
        { label: "End", value: "end" },
      ],
    },
    { key: "decorative", label: "Decorative", type: "toggle" },
  ],
  source: (values) => {
    const vertical = text(values, "orientation") === "vertical";
    const separatorMarkup = `<Separator orientation="${escapedAttribute(text(values, "orientation"))}"${optionalAttribute("variant", text(values, "variant"), "solid")}${optionalAttribute("size", text(values, "size"), "sm")}${optionalAttribute("align", text(values, "align"), "center")}${bool(values, "decorative") ? "" : ' :decorative="false" accessible-label="Section boundary placeholder"'}${vertical ? "" : ` label="${escapedAttribute(text(values, "label"))}"`} />`;
    return componentSource(
      "Separator",
      "@/components/ui/Separator.vue",
      vertical
        ? `<div class="flex h-20 items-center gap-balsa-lg">\n    <span>Before placeholder</span>\n    ${separatorMarkup}\n    <span>After placeholder</span>\n  </div>`
        : separatorMarkup,
    );
  },
};

const skeleton: PlaygroundDefinition = {
  defaults: {
    shape: "text",
    variant: "muted",
    size: "md",
    rounded: "lg",
    animation: "wave",
    lines: 3,
  },
  controls: [
    {
      key: "shape",
      label: "Shape",
      type: "select",
      options: [
        { label: "Text", value: "text" },
        { label: "Rectangle", value: "rect" },
        { label: "Circle", value: "circle" },
      ],
    },
    {
      key: "variant",
      label: "Variant",
      type: "select",
      options: [
        { label: "Muted", value: "muted" },
        { label: "Soft", value: "soft" },
        { label: "Glass", value: "glass" },
      ],
    },
    { key: "size", label: "Size", type: "select", options: colorPickerSizeOptions },
    { key: "rounded", label: "Rounded", type: "select", options: roundedOptions },
    {
      key: "animation",
      label: "Animation",
      type: "select",
      options: [
        { label: "Pulse", value: "pulse" },
        { label: "Wave", value: "wave" },
        { label: "None", value: "none" },
      ],
    },
    { key: "lines", label: "Text lines", type: "number", min: 1, max: 12, step: 1 },
  ],
  source: (values) =>
    componentSource(
      "Skeleton",
      "@/components/ui/Skeleton.vue",
      `<div aria-busy="true" aria-label="Loading content placeholder" class="w-full max-w-md">\n    <Skeleton shape="${escapedAttribute(text(values, "shape"))}"${optionalAttribute("variant", text(values, "variant"), "muted")}${optionalAttribute("size", text(values, "size"), "md")}${optionalAttribute("rounded", text(values, "rounded"), "lg")}${optionalAttribute("animation", text(values, "animation"), "pulse")} :lines="${number(values, "lines")}" />\n  </div>`,
    ),
};

const spinner: PlaygroundDefinition = {
  defaults: {
    label: "Loading placeholder",
    labelPosition: "right",
    color: "info",
    size: "md",
    speed: "normal",
  },
  controls: [
    { key: "label", label: "Label", type: "text" },
    {
      key: "labelPosition",
      label: "Label position",
      type: "select",
      options: [
        { label: "Hidden", value: "hidden" },
        { label: "Right", value: "right" },
        { label: "Bottom", value: "bottom" },
      ],
    },
    {
      key: "color",
      label: "Color",
      type: "select",
      options: semanticColorOptions,
      presentation: "semantic-color",
    },
    {
      key: "size",
      label: "Size",
      type: "select",
      options: [
        { label: "Extra small", value: "xs" },
        { label: "Small", value: "sm" },
        { label: "Medium", value: "md" },
        { label: "Large", value: "lg" },
        { label: "Extra large", value: "xl" },
      ],
    },
    {
      key: "speed",
      label: "Speed",
      type: "select",
      options: [
        { label: "Slow", value: "slow" },
        { label: "Normal", value: "normal" },
        { label: "Fast", value: "fast" },
      ],
    },
  ],
  source: (values) =>
    componentSource(
      "Spinner",
      "@/components/ui/Spinner.vue",
      `<Spinner label="${escapedAttribute(text(values, "label"))}"${optionalAttribute("label-position", text(values, "labelPosition"), "hidden")}${optionalAttribute("color", text(values, "color"), "info")}${optionalAttribute("size", text(values, "size"), "md")}${optionalAttribute("speed", text(values, "speed"), "normal")} />`,
    ),
};

const progress: PlaygroundDefinition = {
  defaults: {
    label: "Upload placeholder",
    value: 58,
    indeterminate: false,
    showValue: true,
    variant: "solid",
    color: "info",
    size: "md",
    rounded: "full",
  },
  controls: [
    { key: "label", label: "Label", type: "text" },
    { key: "value", label: "Value", type: "number", min: 0, max: 100, step: 1 },
    { key: "indeterminate", label: "Indeterminate", type: "toggle" },
    { key: "showValue", label: "Show value", type: "toggle" },
    {
      key: "variant",
      label: "Variant",
      type: "select",
      options: [
        { label: "Solid", value: "solid" },
        { label: "Soft", value: "soft" },
        { label: "Striped", value: "striped" },
      ],
    },
    {
      key: "color",
      label: "Color",
      type: "select",
      options: semanticColorOptions,
      presentation: "semantic-color",
    },
    { key: "size", label: "Size", type: "select", options: colorPickerSizeOptions },
    { key: "rounded", label: "Rounded", type: "select", options: roundedOptions },
  ],
  source: (values) =>
    componentSource(
      "Progress",
      "@/components/ui/Progress.vue",
      `<Progress label="${escapedAttribute(text(values, "label"))}" :value="${bool(values, "indeterminate") ? "null" : number(values, "value")}"${bool(values, "showValue") ? "" : ' :show-value="false"'}${optionalAttribute("variant", text(values, "variant"), "solid")}${optionalAttribute("color", text(values, "color"), "info")}${optionalAttribute("size", text(values, "size"), "md")}${optionalAttribute("rounded", text(values, "rounded"), "full")} />`,
    ),
};

const alert: PlaygroundDefinition = {
  defaults: {
    mode: "inline",
    title: "Alert heading placeholder",
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    color: "neutral",
    variant: "surface",
    size: "md",
    rounded: "lg",
    icon: "default",
    persistent: false,
    outsideDismiss: false,
    escapeDismiss: true,
  },
  controls: [
    {
      key: "mode",
      label: "Mode",
      type: "select",
      options: [
        { label: "Inline", value: "inline" },
        { label: "Dialog", value: "dialog" },
      ],
    },
    { key: "title", label: "Title", type: "text" },
    { key: "description", label: "Description", type: "text", wide: true },
    {
      key: "color",
      label: "Color",
      type: "select",
      options: [
        { label: "Neutral", value: "neutral" },
        { label: "Information", value: "info" },
        { label: "Success", value: "success" },
        { label: "Warning", value: "warning" },
        { label: "Destructive", value: "destructive" },
      ],
      presentation: "semantic-color",
    },
    {
      key: "icon",
      label: "Icon",
      type: "select",
      options: [
        { label: "Status default", value: "default" },
        { label: "Information", value: "info" },
        { label: "Check circle", value: "success" },
        { label: "Alert", value: "warning" },
        { label: "Alert circle", value: "destructive" },
        { label: "Bell", value: "bell" },
      ],
    },
    { key: "variant", label: "Variant", type: "select", options: modalVariantOptions },
    { key: "size", label: "Size", type: "select", options: colorPickerSizeOptions },
    { key: "rounded", label: "Rounded", type: "select", options: roundedOptions },
    { key: "persistent", label: "Persistent", type: "toggle" },
    { key: "outsideDismiss", label: "Outside dismissal", type: "toggle" },
    { key: "escapeDismiss", label: "Escape dismissal", type: "toggle" },
  ],
  source: (values) => {
    const color = text(values, "color");
    const iconName = lucideIconName(text(values, "icon"));
    const attributes = `id="feedback-alert" title="${escapedAttribute(text(values, "title"))}" description="${escapedAttribute(text(values, "description"))}"${optionalAttribute("mode", text(values, "mode"), "inline")}${optionalAttribute("color", color, "neutral")}${optionalAttribute("variant", text(values, "variant"), "surface")}${optionalAttribute("size", text(values, "size"), "md")}${optionalAttribute("rounded", text(values, "rounded"), "lg")}${iconName ? ` :icon="${iconName}"` : ""}${booleanAttribute("persistent", bool(values, "persistent"))}${booleanAttribute("outside-dismiss", bool(values, "outsideDismiss"))}${bool(values, "escapeDismiss") ? "" : ' :escape-dismiss="false"'}`;
    const actionClass = alertActionClass(color, text(values, "variant"));
    if (text(values, "mode") === "dialog") {
      return `<script setup lang="ts">\nimport { ref } from "vue";${iconName ? `\nimport { ${iconName} } from "@lucide/vue";` : ""}\nimport Alert from "@/components/ui/Alert.vue";\nimport Button from "@/components/ui/Button.vue";\n\nconst open = ref(false);\n</script>\n\n<template>\n  <Button @click="open = true">Open alert placeholder</Button>\n  <Alert v-model="open" ${attributes}>\n    <template #actions="{ close }">\n      <Button variant="outline" color="secondary" class="${actionClass}" @click="close">Cancel placeholder</Button>\n      <Button variant="outline" color="secondary" class="${actionClass}" @click="open = false">Confirm placeholder</Button>\n    </template>\n  </Alert>\n</template>`;
    }
    return componentSource(
      "Alert",
      "@/components/ui/Alert.vue",
      `<Alert ${attributes}>\n    <template #actions="{ close }">\n      <Button variant="outline" color="secondary" class="${actionClass}" @click="close">action</Button>\n    </template>\n  </Alert>`,
      `${iconName ? `import { ${iconName} } from "@lucide/vue";\n` : ""}import Button from "@/components/ui/Button.vue";`,
    );
  },
};

const toast: PlaygroundDefinition = {
  defaults: {
    title: "Notification heading placeholder",
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    color: "primary",
    variant: "surface",
    size: "md",
    rounded: "lg",
    icon: "default",
    position: "bottom-end",
    duration: 5000,
    sticky: true,
    dismissible: true,
    action: true,
  },
  controls: [
    { key: "title", label: "Title", type: "text" },
    { key: "description", label: "Description", type: "text", wide: true },
    {
      key: "color",
      label: "Color",
      type: "select",
      options: semanticColorOptions,
      presentation: "semantic-color",
    },
    {
      key: "icon",
      label: "Icon",
      type: "select",
      options: [
        { label: "Status default", value: "default" },
        { label: "Information", value: "info" },
        { label: "Check circle", value: "success" },
        { label: "Alert", value: "warning" },
        { label: "Alert circle", value: "destructive" },
        { label: "Bell", value: "bell" },
      ],
    },
    {
      key: "variant",
      label: "Variant",
      type: "select",
      options: [
        { label: "Surface", value: "surface" },
        { label: "Soft", value: "soft" },
        { label: "Outline", value: "outline" },
        { label: "Glass", value: "glass" },
      ],
    },
    { key: "size", label: "Size", type: "select", options: colorPickerSizeOptions },
    { key: "rounded", label: "Rounded", type: "select", options: roundedOptions },
    {
      key: "position",
      label: "Position",
      type: "select",
      options: [
        { label: "Top start", value: "top-start" },
        { label: "Top center", value: "top-center" },
        { label: "Top end", value: "top-end" },
        { label: "Bottom start", value: "bottom-start" },
        { label: "Bottom center", value: "bottom-center" },
        { label: "Bottom end", value: "bottom-end" },
      ],
    },
    { key: "duration", label: "Duration (ms)", type: "number", min: 1000, max: 20000, step: 500 },
    { key: "sticky", label: "Sticky", type: "toggle" },
    { key: "dismissible", label: "Close action", type: "toggle" },
    { key: "action", label: "Notification action", type: "toggle" },
  ],
  source: (values) => {
    const action = bool(values, "action");
    const icon = text(values, "icon");
    const iconName = lucideIconName(icon);
    const iconOption = icon === "default" || !iconName
      ? ""
      : `\n      icon: ${iconName},`;
    return `<script setup lang="ts">\nimport { ref } from "vue";${iconName ? `\nimport { ${iconName} } from "@lucide/vue";` : ""}\nimport Button from "@/components/ui/Button.vue";\nimport ToastViewport, { type ToastItem } from "@/components/ui/ToastViewport.vue";\n\nconst notifications = ref<readonly ToastItem[]>([]);\nlet sequence = 0;\n\nfunction notify(): void {\n  sequence += 1;\n  notifications.value = [\n    ...notifications.value,\n    {\n      id: \`notification-\${sequence}\`,\n      title: "${escapedAttribute(text(values, "title"))}",\n      description: "${escapedAttribute(text(values, "description"))}",\n      color: "${escapedAttribute(text(values, "color"))}",\n      variant: "${escapedAttribute(text(values, "variant"))}",\n      size: "${escapedAttribute(text(values, "size"))}",\n      rounded: "${escapedAttribute(text(values, "rounded"))}",${iconOption}\n      duration: ${number(values, "duration")},\n      sticky: ${bool(values, "sticky")},\n      dismissible: ${bool(values, "dismissible")},${action ? '\n      actionLabel: "Undo placeholder",' : ""}\n    },\n  ];\n}\n</script>\n\n<template>\n  <Button @click="notify">Show notification placeholder</Button>\n  <ToastViewport\n    v-model="notifications"\n    position="${escapedAttribute(text(values, "position"))}"\n    @action="(item) => console.info(item.id)"\n  />\n</template>`;
  },
};

const tabs: PlaygroundDefinition = {
  defaults: { label: "Tabs placeholder", active: "preview", icons: true, variant: "surface", type: "segmented", panelSurface: true, size: "md", rounded: "lg" },
  controls: [
    { key: "label", label: "Accessible label", type: "text" },
    {
      key: "type",
      label: "Type",
      type: "select",
      options: [
        { label: "Segmented", value: "segmented" },
        { label: "Underline", value: "underline" },
        { label: "Pills", value: "pills" },
        { label: "Tiles", value: "tiles" },
      ],
    },
    {
      key: "variant",
      label: "Variant",
      type: "select",
      options: [
        { label: "Surface", value: "surface" },
        { label: "Outline", value: "outline" },
        { label: "Soft", value: "soft" },
        { label: "Glass", value: "glass" },
      ],
    },
    { key: "icons", label: "Show icons", type: "toggle" },
    { key: "panelSurface", label: "Panel surface", type: "toggle" },
    { key: "size", label: "Size", type: "select", options: colorPickerSizeOptions },
    { key: "rounded", label: "Rounded", type: "select", options: roundedOptions },
  ],
  source: (values) => {
    const icons = bool(values, "icons");
    return componentSource(
      "Tabs",
      "@/components/ui/Tabs.vue",
      `<Tabs id="component-view" v-model="activeTab" :items="items" label="${escapedAttribute(text(values, "label"))}"${optionalAttribute("type", text(values, "type"), "segmented")}${optionalAttribute("variant", text(values, "variant"), "surface")}${bool(values, "panelSurface") ? "" : " :panel-surface=\"false\""}${optionalAttribute("size", text(values, "size"), "md")}${optionalAttribute("rounded", text(values, "rounded"), "lg")}>\n    <template #preview>Lorem ipsum dolor sit amet.</template>\n    <template #source>Consectetur adipiscing elit.</template>\n  </Tabs>`,
      `import { ref } from "vue";${icons ? '\nimport { Code2, Eye } from "@lucide/vue";' : ""}\n\nconst activeTab = ref("${text(values, "active")}");\nconst items = [\n  { id: "preview", label: "Tab placeholder 01"${icons ? ", icon: Eye" : ""} },\n  { id: "source", label: "Tab placeholder 02"${icons ? ", icon: Code2" : ""} },\n];`,
    );
  },
};

const modal: PlaygroundDefinition = {
  defaults: { title: "Modal heading placeholder", presentation: "dialog", variant: "surface", color: "primary", closeLabel: "Close placeholder", size: "md", rounded: "2xl" },
  controls: [
    { key: "title", label: "Title", type: "text" },
    {
      key: "presentation",
      label: "Presentation",
      type: "select",
      options: [
        { label: "Dialog", value: "dialog" },
        { label: "Sheet", value: "sheet" },
      ],
    },
    { key: "variant", label: "Variant", type: "select", options: modalVariantOptions },
    {
      key: "color",
      label: "Color",
      type: "select",
      options: actionColorOptions,
      presentation: "semantic-color",
    },
    { key: "closeLabel", label: "Close label", type: "text" },
    { key: "size", label: "Size", type: "select", options: colorPickerSizeOptions },
    { key: "rounded", label: "Rounded", type: "select", options: roundedOptions },
  ],
  source: (values) =>
    `<script setup lang="ts">\nimport { ref } from "vue";\nimport Button from "@/components/ui/Button.vue";\nimport Modal from "@/components/ui/Modal.vue";\n\nconst open = ref(false);\n</script>\n\n<template>\n  <Button @click="open = true">Open</Button>\n  <Modal id="placeholder-modal" v-model="open" title="${escapedAttribute(text(values, "title"))}" description="Description placeholder for the modal surface." presentation="${text(values, "presentation")}" variant="${text(values, "variant")}"${optionalAttribute("color", text(values, "color"), "primary")} close-label="${escapedAttribute(text(values, "closeLabel"))}"${optionalAttribute("size", text(values, "size"), "md")}${optionalAttribute("rounded", text(values, "rounded"), "2xl")}>\n    <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>\n    <template #footer="{ close }">\n      <Button variant="outline" @click="close">Secondary action</Button>\n      <Button @click="close">Primary action</Button>\n    </template>\n  </Modal>\n</template>`,
};

const codeBlock: PlaygroundDefinition = {
  defaults: { label: "Code placeholder", command: "echo \"Lorem ipsum placeholder\"", copyable: true, wrap: false, lineNumbers: false, collapsedLines: 0, size: "md", rounded: "lg" },
  controls: [
    { key: "label", label: "Label", type: "text" },
    { key: "command", label: "Code", type: "text" },
    { key: "copyable", label: "Copy action", type: "toggle" },
    { key: "wrap", label: "Wrap lines", type: "toggle" },
    { key: "lineNumbers", label: "Line numbers", type: "toggle" },
    { key: "collapsedLines", label: "Collapsed lines", type: "number", min: 0, max: 12, step: 1, hint: "Use 0 to show all lines." },
    { key: "size", label: "Size", type: "select", options: colorPickerSizeOptions },
    { key: "rounded", label: "Rounded", type: "select", options: roundedOptions },
  ],
  source: (values) =>
    componentSource(
      "CodeBlock",
      "@/components/ui/CodeBlock.vue",
      `<CodeBlock code="${escapedAttribute(text(values, "command"))}" label="${escapedAttribute(text(values, "label"))}" language="shell"${bool(values, "copyable") ? "" : " :copyable=\"false\""}${optionalAttribute("size", text(values, "size"), "md")}${booleanAttribute("wrap", bool(values, "wrap"))}${booleanAttribute("line-numbers", bool(values, "lineNumbers"))}${number(values, "collapsedLines") > 0 ? ` :collapsed-lines="${number(values, "collapsedLines")}"` : ""}${optionalAttribute("rounded", text(values, "rounded"), "lg")} />`,
    ),
};

const navbar: PlaygroundDefinition = {
  defaults: {
    behavior: "reveal",
    label: "Product",
    type: "auto",
    variant: "auto",
    color: "primary",
    floatingLayout: "inset",
    floatingMaxWidth: "",
    contentMaxWidth: "",
    itemsAlignment: "right",
  },
  controls: [
    { key: "label", label: "First item", type: "text" },
    {
      key: "type",
      label: "Type",
      type: "select",
      options: [
        { label: "Auto (theme)", value: "auto" },
        { label: "Bar", value: "bar" },
        { label: "Floating", value: "floating" },
        { label: "Minimal", value: "minimal" },
      ],
    },
    {
      key: "variant",
      label: "Variant",
      type: "select",
      options: [
        { label: "Auto (theme)", value: "auto" },
        { label: "Surface", value: "surface" },
        { label: "Outline", value: "outline" },
        { label: "Soft", value: "soft" },
        { label: "Glass", value: "glass" },
      ],
    },
    {
      key: "color",
      label: "Color",
      type: "select",
      options: actionColorOptions,
      presentation: "semantic-color",
    },
    {
      key: "behavior",
      label: "Behavior",
      type: "select",
      options: [
        { label: "Static", value: "static" },
        { label: "Fixed", value: "fixed" },
        { label: "Reveal on scroll", value: "reveal" },
      ],
    },
    {
      key: "floatingLayout",
      label: "Floating layout",
      type: "select",
      options: [
        { label: "Inset slab", value: "inset" },
        { label: "Route container", value: "container" },
      ],
    },
    {
      key: "floatingMaxWidth",
      label: "Floating max width",
      type: "text",
      hint: "Optional CSS length, for example 90rem.",
    },
    {
      key: "contentMaxWidth",
      label: "Content max width",
      type: "text",
      hint: "Optional CSS length for full-width bar or minimal content, for example 90rem.",
    },
    {
      key: "itemsAlignment",
      label: "Items alignment",
      type: "select",
      options: [
        { label: "Left", value: "left" },
        { label: "Center", value: "center" },
        { label: "Right", value: "right" },
      ],
    },
  ],
  source: (values) =>
    componentSource(
      "Navbar",
      "@/components/ui/Navbar.vue",
      `<Navbar :logo="logo" :items="items"${optionalAttribute("type", text(values, "type"), "auto")}${optionalAttribute("variant", text(values, "variant"), "auto")}${optionalAttribute("color", text(values, "color"), "primary")}${optionalAttribute("behavior", text(values, "behavior"), "reveal")}${optionalAttribute("floating-layout", text(values, "floatingLayout"), "inset")}${optionalAttribute("floating-max-width", text(values, "floatingMaxWidth"), "")}${optionalAttribute("content-max-width", text(values, "contentMaxWidth"), "")}${optionalAttribute("items-alignment", text(values, "itemsAlignment"), "right")}>
  <template #actions>
    <Link href="#sign-in" size="sm">Sign in</Link>
    <Link href="#get-started" variant="solid" size="sm">Get started</Link>
  </template>
</Navbar>`,
      `import Link from "@/components/ui/Link.vue";\n\n// Placeholder navigation data for this documentation example.\nconst logo = { title: "BALSA UI", alt: "Balsa UI placeholder", href: "#top" };\nconst items = [\n  {\n    title: "${escapedAttribute(text(values, "label"))}",\n    link: "#product",\n    links: [\n      { title: "Overview", link: "#overview", shortDescription: "A concise product introduction." },\n      { title: "Release notes", link: "#releases", shortDescription: "What changed in the latest version." },\n    ],\n  },\n  { title: "Solutions", link: "#solutions" },\n  { title: "Resources", link: "#resources" },\n];`,
    ),
};

const dropdown: PlaygroundDefinition = {
  defaults: {
    variant: "surface",
    color: "primary",
    align: "start",
    width: "md",
    rounded: "lg",
  },
  controls: [
    {
      key: "variant",
      label: "Variant",
      type: "select",
      options: formVariantOptions,
    },
    {
      key: "color",
      label: "Color",
      type: "select",
      options: actionColorOptions,
      presentation: "semantic-color",
    },
    {
      key: "align",
      label: "Alignment",
      type: "select",
      options: [
        { label: "Automatic", value: "auto" },
        { label: "Start", value: "start" },
        { label: "End", value: "end" },
        { label: "Center", value: "center" },
      ],
    },
    { key: "width", label: "Width", type: "select", options: dropdownWidthOptions },
    { key: "rounded", label: "Rounded", type: "select", options: roundedOptions },
  ],
  source: (values) =>
    componentSource(
      "Dropdown",
      "@/components/ui/Dropdown.vue",
      `<div class="relative w-fit">
  <Button type="button" @click="open = !open">Toggle placeholder</Button>
  <Dropdown :open="open" variant="${escapedAttribute(text(values, "variant"))}"${optionalAttribute("color", text(values, "color"), "primary")} align="${escapedAttribute(text(values, "align"))}"${optionalAttribute("width", text(values, "width"), "md")}${optionalAttribute("rounded", text(values, "rounded"), "lg")}>
    <a href="#placeholder" class="block rounded-lg px-balsa-md py-balsa-xs font-bold text-inherit no-underline hover:bg-balsa-muted">Menu item placeholder</a>
  </Dropdown>
</div>`,
      `import { ref } from "vue";\nimport Button from "@/components/ui/Button.vue";\n\nconst open = ref(true);`,
    ),
};

const defaultFooterSections: readonly PlaygroundFooterSection[] = [
  {
    id: "learn",
    title: "Section placeholder 01",
    items: [
      { id: "introduction", title: "Link placeholder 01" },
      { id: "components", title: "Link placeholder 02" },
    ],
  },
  {
    id: "build",
    title: "Section placeholder 02",
    items: [
      { id: "installation", title: "Link placeholder 03" },
      { id: "registry", title: "Link placeholder 04" },
    ],
  },
];

const footer: PlaygroundDefinition = {
  defaults: {
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    sections: defaultFooterSections,
  },
  controls: [
    { key: "description", label: "Description", type: "text", wide: true },
    {
      key: "sections",
      label: "Navigation sections",
      type: "footer-sections",
      wide: true,
      hint: "Add sections and item names. Preview links are generated from each item name.",
    },
  ],
  source: (values) => {
    const sections = footerSections(values).map((section) => ({
      title: section.title,
      links: section.items.map((item) => ({
        title: item.title,
        link: footerItemLink(item.title),
      })),
    }));
    return componentSource(
      "Footer",
      "@/components/ui/Footer.vue",
      `<Footer :legal-logo="logo" description="${escapedAttribute(text(values, "description"))}" :sections="sections" copyright="Placeholder copyright" legal-text="Legal text placeholder." />`,
      `const logo = { title: "BALSA UI", alt: "Balsa UI placeholder", href: "/" };\nconst sections = ${JSON.stringify(sections, null, 2)};`,
    );
  },
};

const textarea: PlaygroundDefinition = {
  defaults: {
    label: "Textarea placeholder",
    size: "md",
    variant: "surface",
    rounded: "lg",
    rows: 4,
    autoExpand: false,
    maxHeight: 280,
    resizable: "vertical",
    status: [],
    required: false,
  },
  controls: [
    { key: "label", label: "Label", type: "text" },
    {
      key: "size",
      label: "Size",
      type: "select",
      options: fieldSizeOptions,
    },
    { key: "variant", label: "Variant", type: "select", options: formVariantOptions },
    { key: "rounded", label: "Rounded", type: "select", options: roundedOptions },
    { key: "rows", label: "Rows", type: "number", min: 2, max: 12, step: 1 },
    { key: "autoExpand", label: "Auto-expand", type: "toggle" },
    { key: "maxHeight", label: "Max height", type: "number", min: 120, max: 640, step: 20 },
    {
      key: "resizable",
      label: "Resizable",
      type: "select",
      options: [
        { label: "None", value: "none" },
        { label: "Vertical", value: "vertical" },
        { label: "Both axes", value: "both" },
      ],
    },
    { key: "status", label: "Status", type: "multi-select", options: playgroundStatusOptions },
    { key: "required", label: "Required", type: "toggle" },
  ],
  source: (values) => componentSource(
    "Textarea",
    "@/components/ui/Textarea.vue",
    `<Textarea id="notes" v-model="notes" label="${escapedAttribute(text(values, "label"))}"${optionalAttribute("size", text(values, "size"), "md")}${optionalAttribute("variant", text(values, "variant"), "surface")}${optionalAttribute("rounded", text(values, "rounded"), "lg")} :rows="${number(values, "rows")}"${booleanAttribute("auto-expand", bool(values, "autoExpand"))} :max-height="${number(values, "maxHeight")}"${optionalAttribute("resizable", text(values, "resizable"), "vertical")}${optionalAttribute("status", fieldStatus(values), "default")}${booleanAttribute("required", bool(values, "required"))}${booleanAttribute("disabled", includes(values, "status", "disabled"))}${booleanAttribute("loading", includes(values, "status", "loading"))} hint="Helper text placeholder." />`,
    'import { ref } from "vue";\n\nconst notes = ref("");',
  ),
};

const breadcrumb: PlaygroundDefinition = {
  defaults: { separator: "chevron", size: "sm" },
  controls: [
    {
      key: "separator",
      label: "Separator",
      type: "select",
      options: [
        { label: "Chevron", value: "chevron" },
        { label: "Slash", value: "slash" },
        { label: "Dot", value: "dot" },
      ],
    },
    { key: "size", label: "Size", type: "select", options: fieldSizeOptions },
  ],
  source: (values) =>
    componentSource(
      "Breadcrumb",
      "@/components/ui/Breadcrumb.vue",
      `<Breadcrumb :items="items" separator="${text(values, "separator")}"${optionalAttribute("size", text(values, "size"), "sm")} />`,
      'const items = [\n  { label: "Section placeholder 01", href: "#section-placeholder-01" },\n  { label: "Section placeholder 02", href: "#section-placeholder-02" },\n  { label: "Current placeholder" },\n];',
    ),
};

const gradientBackground: PlaygroundDefinition = {
  defaults: {
    preset: "obsidian-fold",
    seed: 1847,
    colorMode: "custom",
    colorA: "#050506",
    colorB: "#D7D8DA",
    speed: 0.075,
    scale: 1.18,
    warp: 1.12,
    pattern: "ribbon",
    patternDensity: 2.35,
    effect: "none",
    effectScale: 10,
    fieldOctaves: 4,
    fieldFrequency: 0.78,
    noiseAmount: 0.05,
    noiseOctaves: 4,
    noiseFrequency: 1.1,
    grain: 0.06,
    quality: "auto",
    paused: false,
  },
  controls: [
    {
      key: "preset",
      label: "Preset",
      type: "select",
      options: [
        { label: "Obsidian Fold", value: "obsidian-fold" },
        { label: "Silver Dunes", value: "silver-dunes" },
        { label: "Cloud Dancer", value: "cloud-dancer" },
        { label: "Holographic Flow", value: "holographic-flow" },
        { label: "Liquid Metal", value: "liquid-metal" },
        { label: "Smoke Field", value: "smoke-field" },
        { label: "Iridescent Flow", value: "iridescent-flow" },
        { label: "Solar Bloom", value: "solar-bloom" },
        { label: "Mesh Drift", value: "mesh-drift" },
        { label: "Terminal Rain", value: "terminal-rain" },
        { label: "Newsprint", value: "newsprint" },
        { label: "Plotter", value: "plotter" },
        { label: "Aurora Veil", value: "aurora-veil" },
        { label: "Terracotta Dune", value: "terracotta-dune" },
        { label: "Neon Drift", value: "neon-drift" },
      ],
    },
    {
      key: "pattern",
      label: "Pattern",
      type: "select",
      options: [
        { label: "Ribbon", value: "ribbon" },
        { label: "Radial", value: "radial" },
        { label: "Conic", value: "conic" },
        { label: "Blobs", value: "blobs" },
        { label: "Contour", value: "contour" },
        { label: "Cellular", value: "cellular" },
      ],
    },
    {
      key: "effect",
      label: "Effect",
      type: "select",
      options: [
        { label: "No effect", value: "none" },
        { label: "ASCII", value: "ascii" },
        { label: "Halftone", value: "halftone" },
        { label: "Dots", value: "dots" },
        { label: "Lines", value: "lines" },
        { label: "Dither", value: "dither" },
        { label: "Crosshatch", value: "crosshatch" },
      ],
    },
    {
      key: "colorMode",
      label: "Color source",
      type: "select",
      options: [
        { label: "Custom colors", value: "custom" },
        { label: "Active palette", value: "palette" },
      ],
    },
    { key: "colorA", label: "Dark stop", type: "color" },
    { key: "colorB", label: "Light stop", type: "color" },
    { key: "seed", label: "Seed", type: "number", min: 0, max: 2147483647, step: 1 },
    { key: "speed", label: "Speed", type: "number", min: 0, max: 2, step: 0.005 },
    { key: "scale", label: "Scale", type: "number", min: 0.25, max: 4, step: 0.01 },
    { key: "warp", label: "Warp", type: "number", min: 0, max: 2, step: 0.01 },
    { key: "patternDensity", label: "Pattern density", type: "number", min: 0.5, max: 8, step: 0.05 },
    { key: "effectScale", label: "Effect cell size", type: "number", min: 2, max: 48, step: 0.5 },
    { key: "fieldOctaves", label: "Field layers", type: "number", min: 1, max: 4, step: 1 },
    { key: "fieldFrequency", label: "Field scale", type: "number", min: 0.2, max: 4, step: 0.01 },
    { key: "noiseAmount", label: "Noise amount", type: "number", min: 0, max: 0.5, step: 0.005 },
    { key: "noiseOctaves", label: "Noise layers", type: "number", min: 1, max: 6, step: 1 },
    { key: "noiseFrequency", label: "Noise scale", type: "number", min: 0.2, max: 4, step: 0.01 },
    { key: "grain", label: "Grain", type: "number", min: 0, max: 0.5, step: 0.005 },
    {
      key: "quality",
      label: "Quality",
      type: "select",
      options: [
        { label: "Automatic", value: "auto" },
        { label: "Low", value: "low" },
        { label: "Medium", value: "medium" },
        { label: "High", value: "high" },
      ],
    },
    { key: "paused", label: "Paused", type: "toggle" },
  ],
  source: (values) => componentSource(
    "GradientBackground",
    "@/components/ui/GradientBackground.vue",
    `<section class="relative isolate min-h-96 overflow-hidden">\n    <GradientBackground preset="${escapedAttribute(text(values, "preset"))}" :seed="${number(values, "seed")}" color-mode="${escapedAttribute(text(values, "colorMode"))}" :colors='["${escapedAttribute(text(values, "colorA"))}", "${escapedAttribute(text(values, "colorB"))}"]' :speed="${number(values, "speed")}" :scale="${number(values, "scale")}" :warp="${number(values, "warp")}" pattern="${escapedAttribute(text(values, "pattern"))}" :pattern-density="${number(values, "patternDensity")}" effect="${escapedAttribute(text(values, "effect"))}" :effect-scale="${number(values, "effectScale")}" :field-octaves="${number(values, "fieldOctaves")}" :field-frequency="${number(values, "fieldFrequency")}" :noise-amount="${number(values, "noiseAmount")}" :noise-octaves="${number(values, "noiseOctaves")}" :noise-frequency="${number(values, "noiseFrequency")}" :grain="${number(values, "grain")}" quality="${escapedAttribute(text(values, "quality"))}"${booleanAttribute("paused", bool(values, "paused"))} />\n    <div class="relative z-10 p-10">Content placeholder</div>\n  </section>`,
  ),
};

const productionCompositionPlaygroundMetadata = [
  ["image-compare-card","ImageCompareCard"],
  ["inbox-thread-card","InboxThreadCard"],
  ["filter-panel-card","FilterPanelCard"],
  ["incident-alert-card","IncidentAlertCard"],
  ["plan-comparison-card","PlanComparisonCard"],
  ["profile-form-card","ProfileFormCard"],
  ["usage-breakdown-card","UsageBreakdownCard"],
  ["environment-switcher-card","EnvironmentSwitcherCard"],
  ["api-key-card","ApiKeyCard"],
  ["integration-list-card","IntegrationListCard"],
  ["runbook-steps-card","RunbookStepsCard"],
  ["data-grid-card","DataGridCard"],
  ["schedule-planner-card","SchedulePlannerCard"],
  ["command-palette-card","CommandPaletteCard"],
  ["asset-carousel-card","AssetCarouselCard"],
  ["split-workspace-card","SplitWorkspaceCard"],
  ["release-notes-card","ReleaseNotesCard"],
  ["device-verification-card","DeviceVerificationCard"],
  ["service-health-card","ServiceHealthCard"],
  ["storage-usage-card","StorageUsageCard"],
  ["analytics-chart-card","AnalyticsChartCard"],
  ["metric-grid-card","MetricGridCard"],
  ["resource-table-card","ResourceTableCard"],
  ["settings-card","SettingsCard"],
  ["notification-preferences-card","NotificationPreferencesCard"],
  ["member-access-card","MemberAccessCard"],
  ["navigation-menu-card","NavigationMenuCard"],
  ["error-state-card","ErrorStateCard"],
  ["loading-state-card","LoadingStateCard"],
  ["media-preview-card","MediaPreviewCard"],
  ["payment-method-card","PaymentMethodCard"],
  ["subscription-card","SubscriptionCard"],
  ["order-summary-card","OrderSummaryCard"],
  ["onboarding-checklist-card","OnboardingChecklistCard"],
  ["form-progress-card","FormProgressCard"],
  ["activity-timeline-card","ActivityTimelineCard"],
  ["command-toolbar-card","CommandToolbarCard"],
] as const;

const productionCompositionPlaygrounds: Readonly<Record<string, PlaygroundDefinition>> =
  Object.fromEntries(productionCompositionPlaygroundMetadata.map(([slug, title]) => [
    slug,
    {
      defaults: {},
      controls: [],
      source: () => componentSource(
        title,
        `@/components/compositions/${title}.vue`,
        `<${title} title="Pattern placeholder" />`,
      ),
    },
  ]));

export const playgrounds: Readonly<Record<string, PlaygroundDefinition>> = {
  ...productionCompositionPlaygrounds,
  icon: iconPlayground,
  button,
  "button-group": buttonGroup,
  link,
  badge,
  card,
  "application-card": applicationCard,
  input,
  "input-group": inputGroup,
  "input-otp": inputOTP,
  "radio-group": radioGroup,
  slider,
  popup,
  "hover-card": hoverCard,
  tooltip,
  "dropdown-menu": dropdownMenu,
  "context-menu": contextMenu,
  menubar,
  "command-menu": commandMenu,
  drawer,
  "color-picker": colorPicker,
  select,
  autocomplete,
  checkbox,
  switch: switchComponent,
  toggle,
  "toggle-group": toggleGroup,
  collapsible,
  accordion,
  kbd,
  avatar,
  pagination,
  resizable,
  "scroll-area": scrollArea,
  preview,
  carousel,
  sidebar,
  attachment,
  table,
  calendar,
  "date-picker": datePicker,
  "data-table": dataTable,
  charts,
  separator,
  skeleton,
  spinner,
  progress,
  alert,
  toast,
  tabs,
  modal,
  "code-block": codeBlock,
  dropdown,
  navbar,
  footer,
  textarea,
  breadcrumb,
  "gradient-background": gradientBackground,
};

export function getPlayground(name: string): PlaygroundDefinition | undefined {
  return playgrounds[name];
}
