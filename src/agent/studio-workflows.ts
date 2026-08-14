import type { SelectOption } from "../components/ui/Select.vue";

export type AgentProjectContext = "start-project" | "add-existing" | "replace-current";
export type AgentCreationSource = "description" | "image";

export const agentProjectContextOptions: readonly SelectOption[] = [
  { value: "start-project", label: "Start project" },
  { value: "add-existing", label: "Add to existing project" },
  { value: "replace-current", label: "Replace current design" },
];

export const agentCreationSourceOptions = [
  { id: "image", label: "From image" },
  { id: "description", label: "From description" },
] as const;

export function projectContextInstruction(
  context: AgentProjectContext,
  artifact: "design system" | "gradient background" | "3D text",
): string {
  if (context === "start-project") {
    return `Start a new Vue 3 project that uses this ${artifact} from its first screen. Inspect the workspace first; if no Vue project exists, create one with the project's preferred package manager, then run Balsa initialization before applying the artifact.`;
  }
  if (context === "replace-current") {
    return `Replace the currently active ${artifact} with this one. Inspect the existing Balsa configuration and generated targets first, show any differing-file diff before replacement, update the existing activation points, and preserve unrelated components and application code.`;
  }
  return `Add this ${artifact} to the existing Vue 3 project as an additional named option. Inspect the project before editing, preserve the active design until the new artifact is registered successfully, and do not overwrite customized source.`;
}

export function directionBlock(
  source: AgentCreationSource,
  direction: string,
  artifact: "design system" | "gradient background" | "3D text",
): string {
  if (source === "image") {
    return `Use the image attached to this conversation as the visual reference. If no image is attached, ask for it before continuing. Recreate the complete ${artifact} expressed by the image as closely as Balsa's schema allows.`;
  }
  const content = direction.trim()
    || `Describe the product, audience, mood, visual references, and constraints for the ${artifact}.`;
  return `Design direction:\n${content}`;
}
