import { access, readFile, rm, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { installRegistryItems } from "./install-registry.mjs";
import { rootDir } from "./registry-lib.mjs";

const fixtureDir = path.join(rootDir, "tests", "fixtures", "registry-vue");
const legacyIconPackage = ["@", "mdi", "/font"].join("");
const legacyIconStylesheet = ["balsa", "-icons.css"].join("");
const fixtureMainPath = path.join(fixtureDir, "src", "main.ts");
const fixtureMain = await readFile(fixtureMainPath, "utf8");
await writeFile(
  fixtureMainPath,
  fixtureMain.replace(`import "${legacyIconPackage}/css/materialdesignicons.css";\n`, ""),
  "utf8",
);
await rm(path.join(fixtureDir, "src", "styles", legacyIconStylesheet), { force: true });

const rootPackage = JSON.parse(await readFile(path.join(rootDir, "package.json"), "utf8"));
const availableDependencies = {
  ...rootPackage.devDependencies,
  ...rootPackage.dependencies,
};
const fixturePackagePath = path.join(fixtureDir, "package.json");
const fixturePackage = JSON.parse(await readFile(fixturePackagePath, "utf8"));
delete fixturePackage.dependencies[legacyIconPackage];
for (const dependency of ["@lucide/vue", "@unovis/ts", "@unovis/vue"]) {
  const version = availableDependencies[dependency];
  if (typeof version !== "string") {
    throw new Error(`Missing registry smoke dependency: ${dependency}.`);
  }
  fixturePackage.dependencies[dependency] = version;
}
fixturePackage.dependencies = Object.fromEntries(Object.entries(fixturePackage.dependencies).sort(([first], [second]) => first.localeCompare(second)));
await writeFile(fixturePackagePath, `${JSON.stringify(fixturePackage, null, 2)}\n`, "utf8");
const packageLock = spawnSync("npm", ["install", "--package-lock-only", "--ignore-scripts", "--no-audit", "--no-fund"], {
  cwd: fixtureDir,
  encoding: "utf8",
  stdio: "pipe",
  shell: process.platform === "win32",
});
if (packageLock.status !== 0) {
  throw new Error(`Smoke fixture dependency sync failed:\n${packageLock.stdout}\n${packageLock.stderr}\n${packageLock.error ?? ""}`);
}

await rm(path.join(fixtureDir, "src", "styles", "balsa.css"), { force: true });
await rm(path.join(fixtureDir, "src", "styles", "balsa-palette.css"), { force: true });
await rm(path.join(fixtureDir, "src", "components", "blocks", "PageHeader.vue"), {
  force: true,
});
await rm(path.join(fixtureDir, "src", "components", "ui", "CollapsibleGroup.vue"), {
  force: true,
});
const manifestPath = path.join(fixtureDir, ".balsa", "installed.json");
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
delete manifest.components["collapsible-group"];
delete manifest.components["balsa-palette"];
await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
const compositionItems = [
  ["account-security-card","AccountSecurityCard"],
  ["payout-method-card","PayoutMethodCard"],
  ["transfer-funds-card","TransferFundsCard"],
  ["savings-goal-card","SavingsGoalCard"],
  ["transaction-list-card","TransactionListCard"],
  ["balance-summary-card","BalanceSummaryCard"],
  ["usage-summary-card","UsageSummaryCard"],
  ["analytics-chart-card","AnalyticsChartCard"],
  ["metric-grid-card","MetricGridCard"],
  ["resource-table-card","ResourceTableCard"],
  ["settings-card","SettingsCard"],
  ["notification-preferences-card","NotificationPreferencesCard"],
  ["invite-members-card","InviteMembersCard"],
  ["member-access-card","MemberAccessCard"],
  ["action-list-card","ActionListCard"],
  ["navigation-menu-card","NavigationMenuCard"],
  ["empty-state-card","EmptyStateCard"],
  ["error-state-card","ErrorStateCard"],
  ["loading-state-card","LoadingStateCard"],
  ["file-upload-card","FileUploadCard"],
  ["media-preview-card","MediaPreviewCard"],
  ["schedule-card","ScheduleCard"],
  ["appointment-card","AppointmentCard"],
  ["payment-method-card","PaymentMethodCard"],
  ["subscription-card","SubscriptionCard"],
  ["order-summary-card","OrderSummaryCard"],
  ["onboarding-checklist-card","OnboardingChecklistCard"],
  ["form-progress-card","FormProgressCard"],
  ["activity-timeline-card","ActivityTimelineCard"],
  ["command-toolbar-card","CommandToolbarCard"],
];
const installed = await installRegistryItems({
  names: [
    "button-group",
    "breadcrumb",
    "input",
    "input-group",
    "input-otp",
    "radio-group",
    "slider",
    "popup",
    "hover-card",
    "dropdown-menu",
    "context-menu",
    "menubar",
    "command-menu",
    "drawer",
    "textarea",
    "gradient-background",
    "switch",
    "toggle",
    "toggle-group",
    "collapsible",
    "accordion",
    "kbd",
    "avatar",
    "pagination",
    "resizable",
    "scroll-area",
    "preview",
    "carousel",
    "sidebar",
    "attachment",
    "table",
    "calendar",
    "date-picker",
    "data-table",
    "charts",
    "separator",
    "skeleton",
    "spinner",
    "progress",
    "alert",
    "toast",
    ...compositionItems.map(([name]) => name),
  ],
  cwd: fixtureDir,
  force: true,
  agentContext: false,
});

const fixtureCssPath = path.join(fixtureDir, "src", "index.css");
const fixtureCss = await readFile(fixtureCssPath, "utf8");
await writeFile(
  fixtureCssPath,
  fixtureCss.includes('balsa-foundation.css')
    ? fixtureCss
    : fixtureCss.replace(
        '@import "./styles/balsa-palette.css";',
        '@import "./styles/balsa-foundation.css";',
      ),
  "utf8",
);

await access(path.join(fixtureDir, "src", "components", "ui", "Breadcrumb.vue"));
await access(path.join(fixtureDir, "src", "components", "ui", "Button.vue"));
await access(path.join(fixtureDir, "src", "components", "ui", "ButtonGroup.vue"));
await access(path.join(fixtureDir, "src", "components", "ui", "Input.vue"));
await access(path.join(fixtureDir, "src", "components", "ui", "InputGroup.vue"));
await access(path.join(fixtureDir, "src", "components", "ui", "InputOTP.vue"));
await access(path.join(fixtureDir, "src", "components", "ui", "RadioGroup.vue"));
await access(path.join(fixtureDir, "src", "components", "ui", "Slider.vue"));
await access(path.join(fixtureDir, "src", "components", "ui", "Popup.vue"));
await access(path.join(fixtureDir, "src", "components", "ui", "HoverCard.vue"));
await access(path.join(fixtureDir, "src", "components", "ui", "DropdownMenu.vue"));
await access(path.join(fixtureDir, "src", "components", "ui", "ContextMenu.vue"));
await access(path.join(fixtureDir, "src", "components", "ui", "Menubar.vue"));
await access(path.join(fixtureDir, "src", "components", "ui", "CommandMenu.vue"));
await access(path.join(fixtureDir, "src", "components", "ui", "Drawer.vue"));
await access(path.join(fixtureDir, "src", "components", "ui", "Textarea.vue"));
await access(path.join(fixtureDir, "src", "components", "ui", "GradientBackground.vue"));
await access(path.join(fixtureDir, "src", "components", "ui", "Switch.vue"));
await access(path.join(fixtureDir, "src", "components", "ui", "Toggle.vue"));
await access(path.join(fixtureDir, "src", "components", "ui", "ToggleGroup.vue"));
await access(path.join(fixtureDir, "src", "components", "ui", "Collapsible.vue"));
await access(path.join(fixtureDir, "src", "components", "ui", "Accordion.vue"));
await access(path.join(fixtureDir, "src", "components", "ui", "Kbd.vue"));
await access(path.join(fixtureDir, "src", "components", "ui", "Avatar.vue"));
await access(path.join(fixtureDir, "src", "components", "ui", "Pagination.vue"));
await access(path.join(fixtureDir, "src", "components", "ui", "Resizable.vue"));
await access(path.join(fixtureDir, "src", "components", "ui", "ScrollArea.vue"));
await access(path.join(fixtureDir, "src", "components", "ui", "Preview.vue"));
await access(path.join(fixtureDir, "src", "components", "ui", "Carousel.vue"));
await access(path.join(fixtureDir, "src", "components", "ui", "Sidebar.vue"));
await access(path.join(fixtureDir, "src", "components", "ui", "Attachment.vue"));
await access(path.join(fixtureDir, "src", "components", "ui", "Table.vue"));
await access(path.join(fixtureDir, "src", "components", "ui", "Calendar.vue"));
await access(path.join(fixtureDir, "src", "components", "ui", "DatePicker.vue"));
await access(path.join(fixtureDir, "src", "components", "ui", "DataTable.vue"));
await access(path.join(fixtureDir, "src", "components", "ui", "Charts.vue"));
await access(path.join(fixtureDir, "src", "components", "ui", "ChartContainer.vue"));
await access(path.join(fixtureDir, "src", "components", "ui", "ChartTooltip.vue"));
await access(path.join(fixtureDir, "src", "components", "ui", "ChartTooltipContent.vue"));
await access(path.join(fixtureDir, "src", "components", "ui", "ChartCrosshair.vue"));
await access(path.join(fixtureDir, "src", "components", "ui", "ChartLegendContent.vue"));
await access(path.join(fixtureDir, "src", "components", "ui", "chart.ts"));
await access(path.join(fixtureDir, "src", "components", "ui", "Icon.vue"));
await access(path.join(fixtureDir, "src", "components", "ui", "Separator.vue"));
await access(path.join(fixtureDir, "src", "components", "ui", "Skeleton.vue"));
await access(path.join(fixtureDir, "src", "components", "ui", "Spinner.vue"));
await access(path.join(fixtureDir, "src", "components", "ui", "Progress.vue"));
await access(path.join(fixtureDir, "src", "components", "ui", "Alert.vue"));
await access(path.join(fixtureDir, "src", "components", "ui", "Toast.vue"));
await access(path.join(fixtureDir, "src", "components", "ui", "ToastViewport.vue"));
await access(path.join(fixtureDir, "src", "components", "ui", "gradient-background.ts"));
await access(path.join(fixtureDir, "src", "components", "ui", "gradient-background-renderer.ts"));
await access(path.join(fixtureDir, "src", "components", "ui", "gradient-background-shader.ts"));
await access(path.join(fixtureDir, "src", "components", "ui", "gradient-background-presets.json"));
await access(path.join(fixtureDir, "src", "styles", "balsa-theme.css"));
await access(path.join(fixtureDir, "src", "styles", "balsa-foundation.css"));
await access(path.join(fixtureDir, "src", "components", "ui", "theme.ts"));
for (const [, title] of compositionItems) {
  await access(path.join(fixtureDir, "src", "components", "compositions", `${title}.vue`));
}
await access(path.join(fixtureDir, "src", "components", "compositions", "ApplicationCard.vue"));
await access(path.join(fixtureDir, "src", "components", "compositions", "_CompositionRoot.vue"));
await access(path.join(fixtureDir, "src", "components", "compositions", "composition.ts"));

function runNodeScript(relativeScript, args) {
  const result = spawnSync(process.execPath, [path.join(rootDir, relativeScript), ...args], {
    cwd: fixtureDir,
    encoding: "utf8",
    stdio: "pipe",
  });
  if (result.status !== 0) {
    throw new Error(`${relativeScript} failed:\n${result.stdout}\n${result.stderr}`);
  }
}

runNodeScript("node_modules/vue-tsc/bin/vue-tsc.js", ["-p", "tsconfig.json", "--noEmit"]);
runNodeScript("node_modules/vite/bin/vite.js", ["build"]);
console.log(`Registry smoke fixture built after installing ${installed.map((item) => item.name).join(", ")}.`);
