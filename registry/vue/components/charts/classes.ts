import { extendTailwindMerge, type ClassNameValue } from "tailwind-merge";

const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      radius: ["balsa-control", "balsa-surface", "balsa-panel"],
      shadow: [
        "balsa-control",
        "balsa-surface",
        "balsa-panel",
        "balsa-sm",
        "balsa-md",
        "balsa-lg",
        "balsa-detail",
      ],
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
