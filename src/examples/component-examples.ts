import {
  getPlayground,
  type PlaygroundFooterSection,
  type PlaygroundValues,
} from "./playgrounds";

export interface ComponentExampleDefinition {
  id: string;
  title: string;
  description: string;
  config: PlaygroundValues;
  source: string;
}

interface ComponentExamplePreset {
  id: string;
  title: string;
  description: string;
  config?: PlaygroundValues;
  source?: string;
}

const compactFooterSections: readonly PlaygroundFooterSection[] = [
  {
    id: "resources",
    title: "Section placeholder",
    items: [
      { id: "item-01", title: "Link placeholder 01" },
      { id: "item-02", title: "Link placeholder 02" },
      { id: "item-03", title: "Link placeholder 03" },
    ],
  },
];

const productionCompositionNames = [
  "image-compare-card",
  "inbox-thread-card",
  "filter-panel-card",
  "incident-alert-card",
  "plan-comparison-card",
  "profile-form-card",
  "usage-breakdown-card",
  "environment-switcher-card",
  "api-key-card",
  "integration-list-card",
  "runbook-steps-card",
  "data-grid-card",
  "schedule-planner-card",
  "command-palette-card",
  "asset-carousel-card",
  "split-workspace-card",
  "release-notes-card",
  "device-verification-card",
  "service-health-card",
  "storage-usage-card",
  "analytics-chart-card",
  "metric-grid-card",
  "resource-table-card",
  "settings-card",
  "notification-preferences-card",
  "member-access-card",
  "navigation-menu-card",
  "error-state-card",
  "loading-state-card",
  "media-preview-card",
  "payment-method-card",
  "subscription-card",
  "order-summary-card",
  "onboarding-checklist-card",
  "form-progress-card",
  "activity-timeline-card",
  "command-toolbar-card",
] as const;

const productionCompositionExamplePresets: Readonly<Record<string, readonly ComponentExamplePreset[]>> =
  Object.fromEntries(productionCompositionNames.map((name) => [
    name,
    [
      {
        id: "default",
        title: "Default pattern",
        description: "Use the default typed pattern as a production-ready starting point.",
        config: {},
      },
      {
        id: "inherited-design",
        title: "Inherited design",
        description: "The same composition follows the nearest Balsa theme and palette without pinned presentation.",
        config: {},
      },
    ],
  ]));

const examplePresets: Readonly<Record<string, readonly ComponentExamplePreset[]>> = {
  ...productionCompositionExamplePresets,
  icon: [
    { id: "decorative", title: "Decorative", description: "An unlabelled symbol inherits color and stays hidden from assistive technology.", config: { icon: "search", size: "md", strokeWidth: "2", label: "" } },
    { id: "labelled", title: "Labelled image", description: "Add a label only when the standalone symbol itself conveys content.", config: { icon: "help", size: "lg", strokeWidth: "1.5", label: "Help" } },
  ],
  analytics: [
    {
      id: "ga4-provider",
      title: "GA4 provider configuration",
      description: "Forward structural and custom Balsa events to an existing Google tag after analytics consent is granted.",
      source: `<script setup lang="ts">
import { ref } from "vue";
import BalsaAnalyticsProvider from "@/components/ui/BalsaAnalyticsProvider.vue";
import Button from "@/components/ui/Button.vue";
import { createGoogleAnalyticsAdapter } from "@/components/ui/analytics";

const analyticsConsent = ref(false);
const adapters = [
  createGoogleAnalyticsAdapter({ sendTo: "G-XXXXXXXXXX" }),
];
</script>

<template>
  <BalsaAnalyticsProvider
    :adapters="adapters"
    :enabled="analyticsConsent"
  >
    <Button analytics-event="cta">
      Start free trial
    </Button>
  </BalsaAnalyticsProvider>
</template>`,
    },
    {
      id: "custom-adapter",
      title: "Application-owned adapter",
      description: "Send the normalized event contract to a reviewed first-party destination without adding a visual playground.",
      source: `<script setup lang="ts">
import BalsaAnalyticsProvider from "@/components/ui/BalsaAnalyticsProvider.vue";
import Button from "@/components/ui/Button.vue";
import { createAnalyticsAdapter } from "@/components/ui/analytics";

const firstParty = createAnalyticsAdapter("first-party", (event) => {
  navigator.sendBeacon("/analytics", JSON.stringify(event));
});
</script>

<template>
  <BalsaAnalyticsProvider :adapters="[firstParty]">
    <Button analytics-event="lead">
      Request a demo
    </Button>
  </BalsaAnalyticsProvider>
</template>`,
    },
  ],
  button: [
    {
      id: "soft",
      title: "Soft",
      description: "Use the soft variant for a low-emphasis action with a palette-tinted fill.",
      config: { variant: "soft", color: "primary", icon: "none" },
    },
    {
      id: "outline",
      title: "Outline",
      description: "Use the outline variant when the action needs a visible semantic boundary.",
      config: { variant: "outline", color: "secondary", icon: "none" },
    },
    {
      id: "glass",
      title: "Glass",
      description: "Use the glass variant for a translucent action with a restrained rim.",
      config: { variant: "glass", color: "primary", icon: "layers" },
    },
    {
      id: "large-pill",
      title: "Large pill",
      description: "Combine the large size, pill shape, and an optional icon.",
      config: { size: "lg", shape: "pill", icon: "arrow-right" },
    },
    {
      id: "fab",
      title: "2XL floating action button",
      description: "Use the 2XL FAB for a display-level 72px icon action with an accessible label.",
      config: { shape: "fab", size: "2xl", label: "Add placeholder", icon: "plus" },
    },
    {
      id: "loading",
      title: "Loading",
      description: "Loading preserves the action label while blocking interaction.",
      config: { loading: true, icon: "none" },
    },
    {
      id: "destructive",
      title: "Destructive",
      description: "Reserve the destructive color for consequential actions.",
      config: { color: "destructive", label: "Action placeholder", icon: "trash" },
    },
    {
      id: "analytics-event",
      title: "Custom analytics event",
      description: "Emit a deliberate business event in addition to the structural interaction when Analytics is installed.",
      config: { analyticsEvent: "cta", label: "Start now", icon: "none" },
    },
  ],
  "button-group": [
    {
      id: "solid",
      title: "Solid",
      description: "Use a solid group for the primary mode switch in a local workbench.",
      config: { variant: "solid", size: "md" },
    },
    {
      id: "outline",
      title: "Outline",
      description: "Use an outline group for secondary choices that should remain visibly connected.",
      config: { variant: "outline", color: "secondary" },
    },
    {
      id: "glass",
      title: "Glass",
      description: "Use glass for a low-rim connected choice over a translucent Glassmorphism surface.",
      config: { variant: "glass", color: "accent" },
    },
    {
      id: "extra-large",
      title: "Extra large",
      description: "Use extra large only when a mode switch needs to lead a spacious local area.",
      config: { size: "xl" },
    },
    {
      id: "pill",
      title: "Pill",
      description: "Use pill ends only when the surrounding layout calls for a fully rounded connected control.",
      config: { shape: "pill" },
    },
    {
      id: "text-only",
      title: "Text only",
      description: "Icons can be omitted when the option labels are already concise.",
      config: { icons: false, active: "code" },
    },
    {
      id: "collapsed",
      title: "Collapsed labels",
      description: "Collapse labels for constrained toolbars while retaining the accessible group label.",
      config: { collapseLabels: true },
    },
  ],
  link: [
    {
      id: "text",
      title: "Text",
      description: "The text variant fits links embedded alongside prose and metadata.",
      config: { variant: "text", icon: "none" },
    },
    {
      id: "outline",
      title: "Outline",
      description: "Outline links can present navigation as a secondary call to action.",
      config: { variant: "outline", color: "secondary" },
    },
    {
      id: "external",
      title: "External",
      description: "External links expose their destination behavior and matching icon.",
      config: { variant: "text", external: true, icon: "external" },
    },
  ],
  badge: [
    {
      id: "solid",
      title: "Solid",
      description: "A solid badge carries the strongest status emphasis.",
      config: { variant: "solid", color: "success" },
    },
    {
      id: "outline",
      title: "Outline",
      description: "Outline badges keep metadata visually light.",
      config: { variant: "outline", color: "warning" },
    },
    {
      id: "soft",
      title: "Soft",
      description: "Soft badges provide a quieter status treatment.",
      config: { variant: "soft", color: "info" },
    },
  ],
  card: [
    {
      id: "elevated",
      title: "Elevated",
      description: "Elevated cards separate focused content from the surrounding surface.",
      config: { variant: "elevated" },
    },
    {
      id: "outline",
      title: "Outline",
      description: "Outline cards group content without adding depth.",
      config: { variant: "outline" },
    },
    {
      id: "soft",
      title: "Soft",
      description: "Soft cards add a restrained semantic color wash.",
      config: { variant: "soft", color: "secondary" },
    },
    {
      id: "glass",
      title: "Glass",
      description: "Glass cards preserve background detail with a restrained semantic rim.",
      config: { variant: "glass", color: "accent" },
    },
  ],
  "application-card": [
    {
      id: "summary",
      title: "Dashboard summary",
      description: "A compact header and metadata footer establish the repeated application rhythm.",
      config: {},
    },
    {
      id: "elevated",
      title: "Elevated task",
      description: "Use elevation only when the panel is meaningfully stacked above its surroundings.",
      config: { variant: "elevated", size: "lg" },
    },
    {
      id: "outline",
      title: "Outlined grouping",
      description: "Outline preserves grouping without adding a filled application surface.",
      config: { variant: "outline", shadow: false },
    },
  ],
  input: [
    {
      id: "phone",
      title: "Phone",
      description: "The phone type applies a readable digit mask while retaining a native text field.",
      config: { type: "phone", label: "Phone placeholder" },
    },
    {
      id: "monetary",
      title: "Monetary",
      description: "The monetary type formats the visible amount and emits a numeric model value.",
      config: { type: "monetary", label: "Amount placeholder" },
    },
    {
      id: "percentage",
      title: "Percentage",
      description: "The percentage type keeps decimal entry natural with a persistent percent suffix and a numeric 0–100 model.",
      config: { type: "percentage", label: "Percentage placeholder" },
    },
    {
      id: "compact-email",
      title: "Compact email",
      description: "Native input types and the small size can be combined.",
      config: { type: "email", size: "sm", label: "Email placeholder" },
    },
    {
      id: "required",
      title: "Required",
      description: "Required state is communicated by the shared field framing.",
      config: { states: ["required"] },
    },
    {
      id: "invalid",
      title: "Invalid",
      description: "Unvalidated state applies destructive feedback to the complete field.",
      config: { status: "unvalidated" },
    },
    {
      id: "loading",
      title: "Loading",
      description: "Loading blocks editing and exposes progress semantics.",
      config: { states: ["loading"] },
    },
  ],
  "input-group": [
    {
      id: "url",
      title: "URL prefix",
      description: "Short semantic text can connect to the start of one labelled field.",
      config: { startText: "https://", endText: "", layout: "inline" },
    },
    {
      id: "currency",
      title: "Currency suffix",
      description: "A trailing unit remains visually connected without becoming a second input.",
      config: { startText: "$", endText: "USD", layout: "inline" },
    },
    {
      id: "stacked",
      title: "Stacked addons",
      description: "Block rows give longer contextual content enough room on narrow layouts.",
      config: { startText: "Address prefix placeholder", endText: "Address suffix placeholder", layout: "stacked" },
    },
    {
      id: "invalid",
      title: "Invalid grouped field",
      description: "One error boundary and explicit message cover the native control and addons.",
      config: { status: ["unvalidated"] },
    },
  ],
  "input-otp": [
    {
      id: "numeric",
      title: "Six-digit code",
      description: "One numeric field drives six accessible visual cells.",
      config: { length: 6, mode: "numeric", grouped: false },
    },
    {
      id: "grouped",
      title: "Accent grouped code",
      description: "An accent color and decorative separators improve scanning without creating extra form controls.",
      config: { length: 6, mode: "numeric", grouped: true, variant: "solid", color: "accent" },
    },
    {
      id: "masked",
      title: "Masked code",
      description: "Masking changes only the visual cells while the logical value stays editable.",
      config: { length: 6, mode: "numeric", mask: true },
    },
    {
      id: "recovery",
      title: "Recovery token",
      description: "Alphanumeric filtering supports short fixed-length recovery tokens.",
      config: { length: 8, mode: "alphanumeric", grouped: true },
    },
  ],
  "radio-group": [
    {
      id: "column",
      title: "Column choices",
      description: "A compact vertical group preserves native single-choice behavior.",
      config: { layout: "column", size: "md" },
    },
    {
      id: "row",
      title: "Inline choices",
      description: "Short labels can wrap naturally across one row.",
      config: { layout: "row", size: "sm" },
    },
    {
      id: "cards",
      title: "Accent descriptive cards",
      description: "Accent selected material and paired foreground identify one richer option.",
      config: { layout: "cards", color: "accent", rounded: "xl" },
    },
    {
      id: "invalid",
      title: "Required error",
      description: "One explicit unvalidated message names the complete group.",
      config: { layout: "column", status: ["unvalidated"], required: true },
    },
  ],
  slider: [
    {
      id: "single",
      title: "Single value",
      description: "One native thumb controls a bounded numeric setting.",
      config: { range: false, min: 0, max: 100, step: 1 },
    },
    {
      id: "range",
      title: "Bounded range",
      description: "Two native thumbs preserve an ordered lower and upper value.",
      config: { range: true, min: 0, max: 100, step: 5 },
    },
    {
      id: "large",
      title: "Large control",
      description: "The large preset increases the visual thumb and pointer target.",
      config: { range: false, size: "lg", step: 10 },
    },
    {
      id: "vertical",
      title: "Vertical orientation",
      description: "The same native range behavior can follow a vertical track.",
      config: { range: false, orientation: "vertical", showValue: true },
    },
  ],
  popup: [
    { id: "settings", title: "Settings popup", description: "Interactive content receives focus and restores the trigger.", config: { side: "bottom", align: "center" } },
    { id: "aligned", title: "Start aligned", description: "Alignment follows the trigger before collision correction.", config: { side: "bottom", align: "start" } },
    { id: "glass", title: "Glass material", description: "A low-rim translucent popup inherits its surrounding palette.", config: { variant: "glass" } },
    { id: "trigger", title: "Trigger width", description: "Content can adopt the measured trigger width.", config: { size: "trigger", label: "Wide trigger placeholder" } },
  ],
  "hover-card": [
    { id: "summary", title: "Summary preview", description: "Hover or keyboard focus reveals supplementary copy.", config: { side: "bottom" } },
    { id: "quick", title: "Quick preview", description: "Shorter delays remain cancellable across the pointer gap.", config: { openDelay: 100, closeDelay: 100 } },
    { id: "top", title: "Top placement", description: "Preferred placement flips when viewport space is insufficient.", config: { side: "top" } },
    { id: "glass", title: "Glass preview", description: "Glass material remains readable over the generated field.", config: { variant: "glass" } },
  ],
  tooltip: [
    { id: "details", title: "Supplementary detail", description: "Pointer hover and keyboard focus reveal a brief non-interactive description.", config: { side: "top" } },
    { id: "quick", title: "Quick tooltip", description: "Short delays provide faster contextual feedback.", config: { openDelay: 100, closeDelay: 100 } },
    { id: "bottom", title: "Bottom placement", description: "Preferred placement changes while preserving viewport collision correction.", config: { side: "bottom" } },
    { id: "glass", title: "Glass material", description: "A translucent tooltip keeps its compact supplementary treatment.", config: { variant: "glass" } },
  ],
  "dropdown-menu": [
    { id: "actions", title: "Actions", description: "Typed action and destructive rows emit immutable selections.", config: { variant: "surface" } },
    { id: "checks", title: "Checkable item", description: "Checkbox menu state exposes checked semantics.", config: { variant: "outline", color: "accent", rounded: "2xl" } },
    { id: "aligned", title: "End aligned", description: "The menu aligns to the safe trigger edge.", config: { align: "end" } },
    { id: "disabled", title: "Disabled trigger", description: "Disabled menus preserve a visible unavailable trigger.", config: { disabled: true } },
  ],
  "context-menu": [
    { id: "pointer", title: "Pointer request", description: "Right-click opens at the requested coordinates.", config: { variant: "surface" } },
    { id: "keyboard", title: "Keyboard request", description: "Shift+F10 and ContextMenu open against the target with an accent rim and softer corners.", config: { variant: "outline", color: "accent", rounded: "2xl" } },
    { id: "glass", title: "Glass menu", description: "Teleported material preserves theme and palette context.", config: { variant: "glass" } },
    { id: "disabled", title: "Native fallback", description: "Disabled mode leaves the browser context menu intact.", config: { disabled: true } },
  ],
  menubar: [
    { id: "editor", title: "Editor menus", description: "Top-level triggers use horizontal roving focus.", config: { variant: "surface" } },
    { id: "outline", title: "Outlined menus", description: "Menu material remains consistent across top-level owners.", config: { variant: "outline" } },
    { id: "soft", title: "Soft menus", description: "Soft material creates a quieter application command surface.", config: { variant: "soft" } },
    { id: "glass", title: "Glass menus", description: "Translucent menu panels retain selected foreground contrast.", config: { variant: "glass" } },
  ],
  "command-menu": [
    { id: "inline", title: "Inline commands", description: "The editable query opens a filtered dropdown of grouped commands.", config: { mode: "inline", size: "sm" } },
    { id: "dialog", title: "Dialog palette", description: "Modal mode opens on request and adds the platform command hotkey.", config: { mode: "dialog", size: "lg" } },
    { id: "loading", title: "Loading", description: "Loading keeps the query present with an announced status.", config: { loading: true } },
    { id: "glass", title: "Glass palette", description: "The command surface uses the same semantic selected material.", config: { variant: "glass" } },
  ],
  drawer: [
    { id: "bottom", title: "Bottom task", description: "A modal task surface enters from the lower edge.", config: { side: "bottom", size: "md" } },
    { id: "right", title: "Right filters", description: "Side placement supports longer scrollable settings.", config: { side: "right", size: "md" } },
    { id: "large", title: "Large drawer", description: "The largest extent remains viewport-capped.", config: { side: "bottom", size: "lg" } },
    { id: "fixed", title: "Fixed decision", description: "A non-dismissible panel keeps its explicit close workflow.", config: { dismissible: false, showHandle: false } },
  ],
  "color-picker": [
    {
      id: "field",
      title: "Outside label",
      description: "The default concise label sits above the filled square.",
      config: { type: "field", labelPosition: "outside", color: "#7c3aed" },
    },
    {
      id: "inside-label",
      title: "Inside label",
      description: "Use an inside tag when the color square itself is the compact label.",
      config: { type: "field", labelPosition: "inside", color: "#7c3aed" },
    },
    {
      id: "large",
      title: "Large field",
      description: "A larger square gives a color setting more visual emphasis.",
      config: { type: "field", size: "lg", color: "#7c3aed" },
    },
    {
      id: "palette",
      title: "Palette",
      description: "Palette type composes several color triggers into one compact row.",
      config: { type: "palette", color: "#0f766e" },
    },
    {
      id: "disabled",
      title: "Disabled",
      description: "Disabled color controls remain legible while blocking the editor.",
      config: { disabled: true },
    },
  ],
  select: [
    {
      id: "multiple",
      title: "Multiple",
      description: "Keep the list open while users toggle several selected options.",
      config: { multiple: true },
    },
    {
      id: "compact",
      title: "Compact",
      description: "The small size fits dense property and filter panels.",
      config: { size: "sm" },
    },
    {
      id: "required",
      title: "Required",
      description: "Required selection uses the same field contract as other inputs.",
      config: { required: true },
    },
    {
      id: "invalid",
      title: "Invalid",
      description: "Unvalidated state keeps feedback attached to the control.",
      config: { status: "unvalidated" },
    },
    {
      id: "loading",
      title: "Loading",
      description: "Loading communicates that options are not ready yet.",
      config: { loading: true },
    },
  ],
  autocomplete: [
    {
      id: "medium",
      title: "Medium",
      description: "Use medium sizing when search-assisted entry is a primary field.",
      config: { size: "md" },
    },
    {
      id: "required",
      title: "Required",
      description: "Required state is exposed through the shared field presentation.",
      config: { required: true },
    },
    {
      id: "invalid",
      title: "Invalid",
      description: "Unvalidated state communicates an unacceptable value.",
      config: { status: "unvalidated" },
    },
    {
      id: "loading",
      title: "Loading",
      description: "Loading blocks input while suggestions are prepared.",
      config: { loading: true },
    },
  ],
  checkbox: [
    {
      id: "unchecked",
      title: "Unchecked",
      description: "The model controls the independent checked state.",
      config: { checked: false },
    },
    {
      id: "required",
      title: "Required",
      description: "Required checkboxes expose their requirement alongside the label.",
      config: { checked: false, required: true },
    },
    {
      id: "disabled",
      title: "Disabled",
      description: "Disabled state prevents interaction without hiding the current value.",
      config: { disabled: true },
    },
  ],
  switch: [
    {
      id: "off",
      title: "Off",
      description: "The model controls the immediate on or off state.",
      config: { enabled: false },
    },
    {
      id: "on",
      title: "On",
      description: "The selected treatment clearly communicates an enabled setting.",
      config: { enabled: true },
    },
    {
      id: "disabled",
      title: "Disabled",
      description: "Disabled state keeps the current value visible and immutable.",
      config: { disabled: true },
    },
  ],
  toggle: [
    {
      id: "pressed",
      title: "Pressed",
      description: "The semantic pressed state communicates that the action remains active.",
      config: { pressed: true, color: "primary" },
    },
    {
      id: "outline",
      title: "Outline",
      description: "Outline keeps a released formatting action visibly bounded.",
      config: { pressed: false, variant: "outline", color: "secondary" },
    },
    {
      id: "glass",
      title: "Glass",
      description: "Glass provides a restrained translucent idle action while pressed state stays explicit.",
      config: { pressed: false, variant: "glass", color: "accent" },
    },
    {
      id: "disabled",
      title: "Disabled",
      description: "Disabled state preserves the current pressed value without allowing activation.",
      config: { disabled: true },
    },
  ],
  "toggle-group": [
    {
      id: "single",
      title: "Single selection",
      description: "Use single mode for one active alignment or view choice.",
      config: { type: "single", selection: ["left"] },
    },
    {
      id: "multiple",
      title: "Multiple selection",
      description: "Multiple mode keeps independent formatting actions pressed together.",
      config: { type: "multiple", selection: ["left", "center"] },
    },
    {
      id: "vertical",
      title: "Vertical",
      description: "Vertical orientation changes both layout and arrow-key direction.",
      config: { orientation: "vertical", selection: ["right"] },
    },
    {
      id: "required-selection",
      title: "Persistent single selection",
      description: "Disable empty selection when the surrounding task always requires one active mode.",
      config: { allowEmpty: false, selection: ["center"] },
    },
  ],
  collapsible: [
    {
      id: "open",
      title: "Underline details",
      description: "The default underline keeps optional supporting information compact in context.",
      config: { open: true, variant: "underline" },
    },
    {
      id: "soft",
      title: "Soft disclosure",
      description: "A soft material gives the retained detail a quieter hierarchy.",
      config: { open: true, variant: "soft", rounded: "xl" },
    },
    {
      id: "disabled",
      title: "Disabled",
      description: "Disabled state preserves the current disclosure state and blocks activation.",
      config: { open: false, disabled: true },
    },
  ],
  accordion: [
    {
      id: "single",
      title: "Single disclosure",
      description: "Single mode keeps one related answer open at a time.",
      config: { type: "single", collapsible: true },
    },
    {
      id: "multiple",
      title: "Multiple disclosures",
      description: "Multiple mode lets readers retain several answers for comparison.",
      config: { type: "multiple", collapsible: true },
    },
    {
      id: "glass",
      title: "Glass collection",
      description: "Glass keeps the connected surface translucent over an expressive background.",
      config: { variant: "glass", rounded: "2xl" },
    },
  ],
  kbd: [
    {
      id: "chord",
      title: "Modifier chord",
      description: "Render every key in a shortcut as a distinct semantic cap.",
      config: { keys: "Ctrl,Shift,P", accessibleLabel: "Control plus Shift plus P" },
    },
    {
      id: "outline",
      title: "Outline keys",
      description: "Outline keeps shortcut guidance quiet inside dense surfaces.",
      config: { keys: "Alt,Enter", accessibleLabel: "Alt plus Enter", variant: "outline" },
    },
    {
      id: "soft",
      title: "Soft key",
      description: "A soft key cap works naturally inside supporting prose.",
      config: { keys: "Esc", accessibleLabel: "Escape", variant: "soft", size: "sm" },
    },
  ],
  avatar: [
    {
      id: "fallback",
      title: "Initials fallback",
      description: "A deterministic text fallback keeps identity visible without an image source.",
      config: { label: "Person placeholder", fallback: "PP", size: "lg", shape: "circle" },
    },
    {
      id: "rounded",
      title: "Rounded entity",
      description: "Rounded geometry works for organization or workspace identity.",
      config: { label: "Organization placeholder", fallback: "OP", size: "xl", shape: "rounded" },
    },
    {
      id: "error",
      title: "Image error fallback",
      description: "A failed source returns immediately to the accessible fallback.",
      config: { label: "Person placeholder", fallback: "PP", brokenImage: true },
    },
  ],
  pagination: [
    {
      id: "default",
      title: "Bounded result pages",
      description: "Sibling pages and semantic ellipses keep a large result set compact.",
      config: { total: 248, pageSize: 20, siblingCount: 1 },
    },
    {
      id: "compact",
      title: "Compact navigation",
      description: "Small icon-forward controls fit dense result surfaces.",
      config: { total: 96, pageSize: 12, presentation: "icons", size: "sm" },
    },
    {
      id: "action-labels",
      title: "Adjacent actions",
      description: "Previous and next labels provide document-style navigation without a page range.",
      config: { total: 72, pageSize: 10, presentation: "action-labels" },
    },
    {
      id: "without-edges",
      title: "Previous and next",
      description: "Edge controls can be omitted while bounded page context remains.",
      config: { total: 72, pageSize: 10, showEdges: false },
    },
  ],
  resizable: [
    {
      id: "horizontal",
      title: "Horizontal workspace",
      description: "A direct separator allocates width, while its second pane demonstrates a nested vertical split.",
      config: { value: 42, orientation: "horizontal", variant: "surface" },
    },
    {
      id: "vertical",
      title: "Vertical workspace",
      description: "Vertical orientation allocates height with the same keyboard contract.",
      config: { value: 58, orientation: "vertical", variant: "outline" },
    },
    {
      id: "glass",
      title: "Glass split",
      description: "Glass material inherits an expressive background without changing resize behavior.",
      config: { value: 35, orientation: "horizontal", variant: "glass", rounded: "2xl" },
    },
  ],
  "scroll-area": [
    {
      id: "vertical",
      title: "Vertical list",
      description: "A labelled native viewport contains a long stacked collection.",
      config: { orientation: "vertical", visibility: "auto" },
    },
    {
      id: "horizontal",
      title: "Horizontal row",
      description: "Horizontal overflow preserves fixed-width item cards and native gestures.",
      config: { orientation: "horizontal", visibility: "always", size: "thin" },
    },
    {
      id: "fade",
      title: "Edge cue",
      description: "An optional fade indicates additional offscreen content without replacing the scrollbar.",
      config: { orientation: "both", visibility: "hover", edgeFade: true },
    },
  ],
  preview: [
    { id: "mobile", title: "Mobile viewport", description: "Exact logical mobile dimensions evaluate responsive CSS before scaling.", config: { viewport: "fixed", width: 390, height: 844 } },
    { id: "desktop", title: "Desktop viewport", description: "A wide logical canvas scales into the bounded documentation workbench.", config: { viewport: "fixed", width: 1366, height: 768 } },
    { id: "responsive", title: "Responsive canvas", description: "Natural mode follows the available consumer width.", config: { viewport: "responsive", width: 900, height: 520 } },
  ],
  carousel: [
    { id: "cards", title: "Card collection", description: "Two visible slides keep adjacent content discoverable.", config: { itemCount: 5, slidesPerView: 2 } },
    { id: "single", title: "Focused slide", description: "One slide per view gives each item the full content width.", config: { itemCount: 4, slidesPerView: 1, align: "center" } },
    { id: "loop", title: "Looping autoplay", description: "Opt-in autoplay loops and pauses for pointer or focus interaction.", config: { itemCount: 5, slidesPerView: 2, loop: true, autoplay: 4000 } },
    { id: "empty", title: "Empty collection", description: "An explicit empty state replaces navigation and indicators.", config: { itemCount: 0 } },
  ],
  sidebar: [
    { id: "expanded", title: "Expanded workspace", description: "Grouped destinations retain labels, icons, and concise counts.", config: { collapsed: false, variant: "surface" } },
    { id: "rail", title: "Compact rail", description: "Rail mode preserves accessible names and title cues.", config: { collapsed: true, collapsible: "rail" } },
    { id: "glass", title: "Glass navigation", description: "Glass material remains a local visual choice over the same navigation model.", config: { collapsed: false, variant: "glass", rounded: "2xl" } },
  ],
  attachment: [
    { id: "multiple", title: "Multiple documents", description: "Count, type, and size validation run before files enter the model.", config: { multiple: true, maxFiles: 4 } },
    { id: "single", title: "Single image", description: "Single mode replaces the prior local selection.", config: { multiple: false, accept: "image/*" } },
    { id: "invalid", title: "Validation feedback", description: "Explicit error copy accompanies the destructive field state.", config: { status: "unvalidated" } },
  ],
  table: [
    { id: "semantic", title: "Semantic results", description: "Caption, scoped headers, and native row groups remain consumer-authored.", config: { striped: true } },
    { id: "grid", title: "Compact grid", description: "Compact density and gridlines support dense comparison.", config: { density: "compact", gridlines: true } },
    { id: "loading", title: "Loading rows", description: "One valid spanning row announces pending table content.", config: { loading: true } },
    { id: "empty", title: "Empty results", description: "Empty copy remains within the native table structure.", config: { empty: true } },
  ],
  calendar: [
    { id: "single", title: "Single date", description: "One roving-focus grid selects one normalized local day.", config: { mode: "single" } },
    { id: "range", title: "Date range", description: "Range mode retains a start while the user chooses its end.", config: { mode: "range" } },
    { id: "multiple", title: "Multiple dates", description: "Immutable multiple selection toggles independent days.", config: { mode: "multiple" } },
    { id: "two-months", title: "Two months", description: "A paired grid supports wider range comparison.", config: { mode: "range", months: 2 } },
  ],
  "date-picker": [
    { id: "single", title: "Single date field", description: "A labelled field opens the complete Calendar interaction.", config: { mode: "single" } },
    { id: "range", title: "Date range field", description: "The popup remains open until both range boundaries exist.", config: { mode: "range" } },
    { id: "invalid", title: "Invalid date field", description: "Explicit feedback accompanies the destructive trigger state.", config: { status: "unvalidated", required: true } },
  ],
  "data-table": [
    { id: "sortable", title: "Sortable results", description: "Header actions update typed sort state.", config: { selection: "none" } },
    { id: "selectable", title: "Selectable rows", description: "Multiple selection emits immutable row keys.", config: { selection: "multiple", striped: true } },
    { id: "compact", title: "Compact grid", description: "Compact density and gridlines support dense records.", config: { density: "compact", gridlines: true } },
    { id: "loading", title: "Loading results", description: "Loading remains inside the semantic table.", config: { loading: true } },
  ],
  charts: [
    { id: "bar", title: "Bar comparison", description: "Semantic series colors compare categories.", config: { type: "bar" } },
    { id: "line", title: "Line trend", description: "Line geometry communicates change over ordered labels.", config: { type: "line" } },
    { id: "doughnut", title: "Doughnut summary", description: "A finite part-to-whole form shares the same data table.", config: { type: "doughnut" } },
    { id: "table", title: "Visible data", description: "The semantic alternative can remain visibly available.", config: { type: "bar", showTable: true } },
  ],
  separator: [
    {
      id: "labelled",
      title: "Labelled boundary",
      description: "A centred label gives a visible section transition without becoming a badge.",
      config: { label: "Section placeholder", orientation: "horizontal", align: "center" },
    },
    {
      id: "dashed",
      title: "Dashed rule",
      description: "Dashed treatment communicates a softer visual division.",
      config: { label: "", variant: "dashed", size: "md" },
    },
    {
      id: "vertical",
      title: "Vertical division",
      description: "Vertical orientation separates compact inline groups within a known height.",
      config: { orientation: "vertical", variant: "solid", size: "sm" },
    },
  ],
  skeleton: [
    {
      id: "text",
      title: "Text placeholder",
      description: "Several lines reserve the rhythm of pending copy.",
      config: { shape: "text", lines: 4, animation: "wave" },
    },
    {
      id: "media",
      title: "Media placeholder",
      description: "A rounded rectangle reserves a pending visual region.",
      config: { shape: "rect", size: "lg", animation: "pulse" },
    },
    {
      id: "avatar",
      title: "Avatar placeholder",
      description: "Circle shape and size presets match common identity geometry.",
      config: { shape: "circle", size: "lg", animation: "pulse" },
    },
    {
      id: "glass",
      title: "Glass placeholder",
      description: "A translucent wave stays legible over expressive palette fields.",
      config: { shape: "rect", variant: "glass", animation: "wave" },
    },
  ],
  spinner: [
    {
      id: "hidden-label",
      title: "Compact status",
      description: "Keep the loading name accessible when visual space is tight.",
      config: { labelPosition: "hidden", size: "sm" },
    },
    {
      id: "inline",
      title: "Inline label",
      description: "A visible right-hand label provides immediate process context.",
      config: { labelPosition: "right", color: "info", size: "md" },
    },
    {
      id: "stacked",
      title: "Stacked label",
      description: "Bottom placement supports centered loading regions.",
      config: { labelPosition: "bottom", color: "primary", size: "lg" },
    },
    {
      id: "fast",
      title: "Fast compact action",
      description: "Fast motion can indicate a short inline operation.",
      config: { labelPosition: "right", speed: "fast", size: "sm" },
    },
  ],
  progress: [
    {
      id: "determinate",
      title: "Determinate upload",
      description: "A finite value communicates measurable completion.",
      config: { value: 58, color: "info", variant: "solid" },
    },
    {
      id: "complete",
      title: "Completed task",
      description: "Success color and a full value communicate completion.",
      config: { value: 100, color: "success", variant: "solid" },
    },
    {
      id: "indeterminate",
      title: "Indeterminate process",
      description: "Null value removes aria-valuenow and animates an incomplete indicator.",
      config: { indeterminate: true, color: "info", variant: "soft" },
    },
    {
      id: "striped",
      title: "Striped progress",
      description: "Striped motion gives a long-running active transfer extra movement.",
      config: { value: 72, color: "accent", variant: "striped", size: "lg" },
    },
  ],
  alert: [
    {
      id: "information",
      title: "Inline information",
      description: "A surfaced information callout keeps supporting feedback in normal flow.",
      config: { color: "info", variant: "surface", mode: "inline" },
    },
    {
      id: "success",
      title: "Success feedback",
      description: "Success color is reserved for a completed outcome.",
      config: { color: "success", variant: "soft", mode: "inline" },
    },
    {
      id: "warning",
      title: "Dismissible warning",
      description: "A visible close action lets users remove warning feedback that is not persistent.",
      config: { color: "warning", variant: "outline", mode: "inline" },
    },
    {
      id: "decision",
      title: "Destructive alert dialog",
      description: "Dialog mode moves a consequential decision into the native top layer.",
      config: { color: "destructive", variant: "surface", mode: "dialog" },
    },
  ],
  toast: [
    {
      id: "success",
      title: "Success notification",
      description: "A polite success item confirms a completed background action.",
      config: { color: "success", variant: "surface", position: "bottom-end", sticky: true },
    },
    {
      id: "action",
      title: "Actionable information",
      description: "One concise action remains reachable while the timer is paused by focus.",
      config: { color: "info", variant: "soft", position: "bottom-start", sticky: true, action: true },
    },
    {
      id: "destructive",
      title: "Sticky destructive feedback",
      description: "Assertive destructive feedback stays until explicitly dismissed.",
      config: { color: "destructive", variant: "outline", position: "top-end", sticky: true, action: false },
    },
    {
      id: "center",
      title: "Top-center notification",
      description: "Centered placement remains viewport-safe at narrow widths.",
      config: { color: "accent", variant: "glass", position: "top-center", sticky: true },
    },
  ],
  tabs: [
    {
      id: "underline",
      title: "Underline navigation",
      description: "Use an understated active indicator; long tab lists scroll at narrow widths.",
      config: { type: "underline", variant: "surface", icons: true, active: "preview" },
    },
    {
      id: "segmented",
      title: "Connected choices",
      description: "A shared surface gives related modes a compact, connected hierarchy.",
      config: { type: "segmented", variant: "outline", icons: true, active: "source" },
    },
    {
      id: "pills",
      title: "Pill choices",
      description: "Separated choice buttons make the selected view more prominent.",
      config: { type: "pills", variant: "soft", icons: false, active: "preview" },
    },
    {
      id: "tiles",
      title: "Icon tiles",
      description: "Spacious icon-forward tabs suit a small set of visual categories.",
      config: { type: "tiles", variant: "glass", icons: true, active: "source" },
    },
  ],
  modal: [
    {
      id: "dialog",
      title: "Dialog",
      description: "Dialog presentation centers a short, focused task.",
      config: { presentation: "dialog" },
    },
    {
      id: "sheet",
      title: "Sheet",
      description: "Sheet presentation provides more vertical room from the viewport edge.",
      config: { presentation: "sheet" },
    },
  ],
  "code-block": [
    {
      id: "collapsed-preview",
      title: "Collapsed preview",
      description: "Long source can start compact and expand over a bottom fade.",
      config: {
        label: "Configuration",
        command: "const background = '#101114';\nconst foreground = '#f4f4f5';\nconst surface = '#18191d';\nconst primary = '#f5f5f4';\nconst secondary = '#a1a1aa';\nconst accent = '#93c5fd';",
        collapsedLines: 5,
      },
    },
    {
      id: "line-numbers",
      title: "Line numbers",
      description: "Visual line numbers can support longer reference examples.",
      config: {
        label: "Vue",
        command: "const placeholder = true;\nconst value = placeholder ? 1 : 0;",
        lineNumbers: true,
      },
    },
    {
      id: "wrapped",
      title: "Wrapped",
      description: "Wrapped code keeps long commands within narrow layouts.",
      config: {
        command: "echo \"Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor\"",
        wrap: true,
      },
    },
    {
      id: "read-only",
      title: "Without copy",
      description: "Hide the copy action when the snippet is illustrative rather than reusable.",
      config: { copyable: false },
    },
  ],
  navbar: [
    {
      id: "floating-glass",
      title: "Floating glass",
      description: "An inset translucent slab keeps surrounding background detail visible.",
      config: { type: "floating", variant: "glass", behavior: "fixed" },
    },
    {
      id: "reveal",
      title: "Reveal on scroll",
      description: "The header steps away while reading down and returns when the reader moves up.",
      config: { type: "bar", variant: "surface", behavior: "reveal" },
    },
  ],
  dropdown: [
    {
      id: "surface-start",
      title: "Surface menu",
      description: "Anchor a compact surface menu below its placeholder trigger.",
      config: { variant: "surface", align: "start" },
    },
    {
      id: "glass-end",
      title: "Rounded glass menu",
      description: "Align a translucent compact menu to the end of its placeholder trigger.",
      config: { variant: "glass", align: "end", width: "lg", rounded: "2xl" },
    },
  ],
  footer: [
    {
      id: "multiple-sections",
      title: "Multiple sections",
      description: "Footer navigation expands to the number of typed sections provided.",
      config: {},
    },
    {
      id: "compact",
      title: "Compact navigation",
      description: "A single navigation section works for smaller product surfaces.",
      config: {
        description: "Lorem ipsum dolor sit amet.",
        sections: compactFooterSections,
      },
    },
  ],
  textarea: [
    {
      id: "auto-expand",
      title: "Auto-expanding notes",
      description: "Grow with content while keeping a practical height cap.",
      config: { autoExpand: true, maxHeight: 220, resizable: "none" },
    },
    {
      id: "resizable",
      title: "Manual resize",
      description: "Allow vertical resizing for an open-ended response.",
      config: { rows: 6, resizable: "vertical" },
    },
    {
      id: "invalid",
      title: "Validation feedback",
      description: "Use the shared unvalidated state for an actionable error.",
      config: { status: ["unvalidated"], required: true },
    },
  ],
  breadcrumb: [
    {
      id: "slash",
      title: "Slash path",
      description: "Use a slash separator when the hierarchy should read like a compact path.",
      config: { separator: "slash", size: "md" },
    },
    {
      id: "dot",
      title: "Dot path",
      description: "Use a dot separator for a quiet compact location trail.",
      config: { separator: "dot", size: "sm" },
    },
  ],
  "gradient-background": [
    {
      id: "silver-dunes",
      title: "Silver Dunes",
      description: "A restrained monochrome preset supports foreground surfaces.",
      config: { preset: "silver-dunes", seed: 2411, speed: 0.05 },
    },
    {
      id: "palette-mode",
      title: "Palette mode",
      description: "Palette mode derives its colors from the nearest palette boundary.",
      config: { colorMode: "palette", seed: 8031, paused: true },
    },
  ],
};

export function getComponentExamples(name: string): readonly ComponentExampleDefinition[] {
  const playground = getPlayground(name);
  return (examplePresets[name] ?? []).flatMap((example) => {
    const config = { ...playground?.defaults, ...example.config };
    const source = example.source ?? playground?.source(config);
    if (!source) return [];
    return [{
      id: example.id,
      title: example.title,
      description: example.description,
      config,
      source,
    }];
  });
}

export const componentExampleNames = Object.keys(examplePresets);
