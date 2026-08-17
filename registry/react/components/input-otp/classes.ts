import { extendTailwindMerge, type ClassNameValue } from "tailwind-merge";

/**
 * Every custom scale has to be declared here, not only defined in CSS.
 *
 * tailwind-merge decides which of two classes wins by knowing they belong to
 * the same group. A scale it has not been told about is not a group, so a
 * component's own `gap-balsa-md` and a caller's `gap-3` both survive the merge
 * and whichever CSS rule happens to come last decides — the caller's override
 * silently stops working. That is what happened the moment the spacing scale
 * landed, and it is invisible in the source: the class list looks right.
 */
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      radius: ["balsa-control", "balsa-surface", "balsa-panel"],
      text: [
        "balsa-2xs",
        "balsa-xs",
        "balsa-sm",
        "balsa-base",
        "balsa-prose",
        "balsa-lg",
        "balsa-xl",
        "balsa-2xl",
        "balsa-3xl",
        "balsa-4xl",
        "balsa-5xl",
        "balsa-6xl",
      ],
      leading: ["balsa-tight", "balsa-snug", "balsa-normal", "balsa-relaxed", "balsa-prose"],
      tracking: ["balsa-title", "balsa-normal", "balsa-label"],
      shadow: [
        "balsa-control",
        "balsa-surface",
        "balsa-panel",
        "balsa-sm",
        "balsa-md",
        "balsa-lg",
        "balsa-detail",
      ],
      spacing: [
        "balsa-4xs",
        "balsa-3xs",
        "balsa-2xs",
        "balsa-xs",
        "balsa-sm",
        "balsa-md",
        "balsa-lg",
        "balsa-xl",
        "balsa-2xl",
        "balsa-3xl",
        "balsa-section-sm",
        "balsa-section-md",
        "balsa-section-lg",
        "balsa-control-inline",
        "balsa-density-compact",
        "balsa-density-default",
        "balsa-density-comfortable",
      ],
    },
    classGroups: {
      // `backdrop-balsa` is a custom utility rather than a value on a scale, so
      // it has to join the group it competes with by name. Without this a
      // caller's `backdrop-blur-none` and the component's `backdrop-balsa` both
      // survive the merge and CSS order decides which blur wins — the same
      // failure the spacing scale hit the moment it landed.
      "backdrop-blur": ["backdrop-balsa", "backdrop-balsa-overlay"],
    },
  },
});

export function mergeClasses(...inputs: unknown[]): string {
  return twMerge(...(inputs as ClassNameValue[]));
}

export function withoutClassAttribute(
  attrs: Readonly<Record<string, unknown>>,
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(attrs).filter(([name]) => name !== "class"),
  );
}
