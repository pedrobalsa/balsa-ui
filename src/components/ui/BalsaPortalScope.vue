<script setup lang="ts">
/**
 * Forward a scoped Balsa design system across a teleport.
 *
 * Upstream components teleport their overlay to the document body, which sits
 * outside any wrapper carrying `data-balsa-adapt`, a scoped `data-theme` or a
 * scoped `data-palette`. A dialog opened from inside a scoped region therefore
 * renders with the root design system while the region behind it uses another
 * one -- the exact inconsistency the design system exists to prevent.
 *
 * Balsa's own teleporting components resolve their presentation on open and
 * stamp it onto the portal root. An upstream component cannot, and patching it
 * to do so would change behavior rather than styling. This provider closes the
 * gap from the outside: it watches the teleport target and copies the scope's
 * design-system attributes onto portal roots as they appear.
 *
 * Not needed when the scope lives on `<html>` or `<body>`, because teleported
 * content is already inside it. It exists for a scoped subtree.
 */
import { onBeforeUnmount, onMounted, ref } from "vue";

defineOptions({ name: "BalsaPortalScope", inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    /** Where upstream teleports. Matches the component's own teleport target. */
    to?: string;
    /**
     * Element owning the design system to forward. Defaults to this provider's
     * parent, so wrapping the scoped region is enough.
     */
    scope?: HTMLElement | null;
    /** Stop forwarding without unmounting the provider. */
    disabled?: boolean;
  }>(),
  { to: "body", scope: null, disabled: false },
);

/**
 * Everything that carries a scoped design system. Inline styles are included
 * because a scoped theme expresses its overrides as custom properties.
 */
const forwardedAttributes = [
  "data-balsa-adapt",
  "data-theme",
  "data-theme-base",
  "data-palette",
] as const;

const anchor = ref<HTMLElement>();
let observer: MutationObserver | undefined;

function scopeElement(): HTMLElement | undefined {
  if (props.scope) return props.scope;
  return anchor.value?.parentElement ?? undefined;
}

/**
 * Balsa custom properties set on the scope or any ancestor, closest first, so a
 * nested scope wins over the one containing it.
 */
function scopedCustomProperties(scope: HTMLElement): Map<string, string> {
  const properties = new Map<string, string>();
  for (
    let element: HTMLElement | null = scope;
    element;
    element = element.parentElement
  ) {
    for (let index = 0; index < element.style.length; index += 1) {
      const property = element.style.item(index);
      if (!property.startsWith("--balsa-") || properties.has(property)) continue;
      properties.set(property, element.style.getPropertyValue(property));
    }
  }
  return properties;
}

function forwardTo(element: HTMLElement, scope: HTMLElement): void {
  // Vue Test Utils (and other embedded Vue hosts) append application roots to
  // the same body used by teleports. They are independent scopes, not portal
  // roots, so forwarding into them would leak this provider's presentation.
  if (element.hasAttribute("data-v-app") || element.contains(scope)) return;

  // A Balsa layer resolves its own presentation on open; overwriting it would
  // replace a deliberate explicit theme with the ambient one.
  if (element.hasAttribute("data-balsa") || element.hasAttribute("data-theme")) return;
  if (element.dataset.balsaPortalScope === "applied") return;

  let forwarded = false;
  for (const attribute of forwardedAttributes) {
    const value = scope.closest<HTMLElement>(`[${attribute}]`)?.getAttribute(attribute);
    if (value === null || value === undefined) continue;
    element.setAttribute(attribute, value);
    forwarded = true;
  }

  // A scoped theme expresses its overrides as inline custom properties, set
  // property by property rather than as style text, so they are collected the
  // same way instead of copying a style attribute that may not carry them.
  for (const [property, value] of scopedCustomProperties(scope)) {
    element.style.setProperty(property, value);
    forwarded = true;
  }

  if (forwarded) element.dataset.balsaPortalScope = "applied";
}

function forwardAll(): void {
  const scope = scopeElement();
  const target = document.querySelector<HTMLElement>(props.to);
  if (!scope || !target) return;
  for (const child of target.children) {
    if (child instanceof HTMLElement) forwardTo(child, scope);
  }
}

// Client-only, so server rendering and hydration are unaffected: the provider
// renders nothing and only reacts once the DOM exists.
onMounted(() => {
  const target = document.querySelector<HTMLElement>(props.to);
  if (!target) return;

  observer = new MutationObserver((records) => {
    if (props.disabled) return;
    const scope = scopeElement();
    if (!scope) return;
    for (const record of records) {
      for (const node of record.addedNodes) {
        if (node instanceof HTMLElement) forwardTo(node, scope);
      }
    }
  });
  observer.observe(target, { childList: true });

  if (!props.disabled) forwardAll();
});

onBeforeUnmount(() => {
  observer?.disconnect();
  observer = undefined;
});

defineExpose({ forward: forwardAll });
</script>

<template>
  <span ref="anchor" data-balsa="portal-scope" hidden aria-hidden="true" />
</template>
