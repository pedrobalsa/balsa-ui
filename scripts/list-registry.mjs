import { loadRegistry } from "./registry-lib.mjs";

const registry = await loadRegistry();
for (const item of registry.items) {
  const category = item.type.replace("registry:", "");
  console.log(`${item.name.padEnd(16)} ${category.padEnd(10)} ${item.description}`);
}
