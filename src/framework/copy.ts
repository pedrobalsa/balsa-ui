import {
  isConsumerFramework,
  registryTargetConfigurations,
} from "../../bin/registry-targets.mjs";
import { publicSiteUrl } from "../config/public-site";

export interface FrameworkProjectCopy {
  displayName: string | undefined;
  project: string;
  yourProject: string;
  existingProject: string;
  projectRoot: string;
}

export interface ItemInstallationPromptOptions {
  itemName: string;
  docsPath?: string;
}

export interface FrameworkSampleCopy {
  displayName: string;
  exampleLabel: string;
  generatedSourceLabel: string;
  playgroundIntro: string;
  examplesIntro: string;
  undocumentedExample: string;
  undocumentedPlayground: string;
}

const targetConfigurations = registryTargetConfigurations();

function frameworkDisplayName(frameworkId: string): string {
  const displayName = targetConfigurations[frameworkId]?.displayName;
  if (
    !isConsumerFramework(frameworkId)
    || typeof displayName !== "string"
    || displayName.length === 0
  ) {
    throw new Error(`Missing displayName for consumer framework: ${frameworkId}`);
  }
  return displayName;
}

/**
 * Central framework-facing project nouns. Omitting a framework is deliberate:
 * callers without a real user selection get neutral copy rather than the
 * default registry target's name.
 */
export function frameworkProjectCopy(frameworkId?: string): FrameworkProjectCopy {
  const displayName = frameworkId ? frameworkDisplayName(frameworkId) : undefined;
  const project = displayName ? `${displayName} project` : "project";

  return {
    displayName,
    project,
    yourProject: `your ${project}`,
    existingProject: `an existing ${project}`,
    projectRoot: `the ${project} root`,
  };
}

/**
 * Sample-surface labels and fallback sentences. Driven by the target table's
 * displayName so a new consumer does not require a second hardcoded phrase.
 */
export function frameworkSampleCopy(frameworkId: string): FrameworkSampleCopy {
  const displayName = frameworkDisplayName(frameworkId);
  return {
    displayName,
    exampleLabel: `${displayName} template`,
    generatedSourceLabel: `Generated ${displayName} source`,
    playgroundIntro:
      `Change the public properties, compare responsive and simulated device viewports, and copy the ${displayName} source generated from your configuration.`,
    examplesIntro:
      `Compare common configurations, then copy the complete ${displayName} example for the one that fits.`,
    undocumentedExample:
      `A ${displayName} example for this item is not documented yet.`,
    undocumentedPlayground:
      `Generated ${displayName} source for this configuration is not documented yet.`,
  };
}

/**
 * Shared by the live InstallationPanel and its documentation example.
 *
 * Deliberately framework-neutral. `balsa add` already resolves the consumer
 * framework itself and errors rather than guessing, so naming a framework here
 * would be redundant — and worse, a prompt carrying `--framework vue` breaks the
 * moment it is pasted into a React project, which is exactly what a copyable
 * prompt invites. For the same reason it links the docs rather than embedding a
 * usage snippet: the snippet is the one genuinely framework-specific part, and
 * inlining it would fork this into one prompt per framework.
 */
export function buildItemInstallationPrompt(
  options: ItemInstallationPromptOptions,
): string {
  const docsUrl = `${publicSiteUrl}${options.docsPath ?? `/docs/components/${options.itemName}`}`;

  return [
    `Add the Balsa UI ${options.itemName} item to this project.`,
    "",
    "Install it with:",
    `npx balsa-ui@latest add ${options.itemName}`,
    "",
    "Balsa detects this project's framework and installs the matching implementation. It reports an error rather than guessing when the project is ambiguous.",
    "",
    `Read the authoritative usage instructions at ${docsUrl}. Follow its Usage, Examples, and API reference sections for the framework Balsa installed before integrating the component.`,
    "",
    "Review the installed source and its dependencies. Preserve existing project customizations, and do not overwrite differing files without showing me the diff first.",
  ].join("\n");
}
