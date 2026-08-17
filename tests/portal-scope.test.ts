import { enableAutoUnmount, mount } from "@vue/test-utils";
import { afterEach, describe, expect, it } from "vitest";
import { nextTick } from "vue";
import BalsaPortalScope from "@/components/ui/BalsaPortalScope.vue";

/** Let the MutationObserver deliver its records. */
async function flushObserver() {
  await new Promise((resolve) => setTimeout(resolve, 0));
  await nextTick();
}

function scopedRegion(attributes: Record<string, string>) {
  const region = document.createElement("div");
  for (const [name, value] of Object.entries(attributes)) {
    region.setAttribute(name, value);
  }
  document.body.append(region);
  return region;
}

// Each provider keeps a MutationObserver on the body; leaving one mounted would
// let it act on the next test's portals.
enableAutoUnmount(afterEach);

afterEach(() => {
  document.body.innerHTML = "";
});

describe("BalsaPortalScope", () => {
  it("forwards a scoped design system onto content teleported to the body", async () => {
    const region = scopedRegion({
      "data-balsa-adapt": "",
      "data-theme": "studio",
      "data-palette": "midnight",
    });
    mount(BalsaPortalScope, { attachTo: region });
    await flushObserver();

    // An upstream overlay appearing outside the scoped region.
    const portal = document.createElement("div");
    document.body.append(portal);
    await flushObserver();

    expect(portal.getAttribute("data-theme")).toBe("studio");
    expect(portal.getAttribute("data-palette")).toBe("midnight");
    expect(portal.hasAttribute("data-balsa-adapt")).toBe(true);
  });

  it("leaves a Balsa layer alone, because it resolves its own presentation", async () => {
    const region = scopedRegion({ "data-theme": "studio" });
    mount(BalsaPortalScope, { attachTo: region });
    await flushObserver();

    const balsaLayer = document.createElement("div");
    balsaLayer.setAttribute("data-balsa", "modal-backdrop");
    balsaLayer.setAttribute("data-theme", "explicit-choice");
    document.body.append(balsaLayer);
    await flushObserver();

    // Overwriting would replace a deliberate explicit theme with the ambient one.
    expect(balsaLayer.getAttribute("data-theme")).toBe("explicit-choice");
  });

  it("forwards scoped custom properties, which is how a scoped theme overrides", async () => {
    const region = scopedRegion({ "data-theme": "studio" });
    region.style.setProperty("--balsa-radius-control", "0px");
    mount(BalsaPortalScope, { attachTo: region });
    await flushObserver();

    const portal = document.createElement("div");
    document.body.append(portal);
    await flushObserver();

    expect(portal.style.cssText).toContain("--balsa-radius-control");
  });

  it("does nothing while disabled", async () => {
    const region = scopedRegion({ "data-theme": "studio" });
    mount(BalsaPortalScope, { attachTo: region, props: { disabled: true } });
    await flushObserver();

    const portal = document.createElement("div");
    document.body.append(portal);
    await flushObserver();

    expect(portal.hasAttribute("data-theme")).toBe(false);
  });

  it("adopts content that was already present when it mounted", async () => {
    const region = scopedRegion({ "data-theme": "studio" });
    const portal = document.createElement("div");
    document.body.append(portal);

    mount(BalsaPortalScope, { attachTo: region });
    await flushObserver();

    expect(portal.getAttribute("data-theme")).toBe("studio");
  });

  it("renders nothing visible and stops observing when unmounted", async () => {
    const region = scopedRegion({ "data-theme": "studio" });
    const wrapper = mount(BalsaPortalScope, { attachTo: region });
    await flushObserver();
    expect(wrapper.element.hasAttribute("hidden")).toBe(true);

    wrapper.unmount();
    const portal = document.createElement("div");
    document.body.append(portal);
    await flushObserver();

    expect(portal.hasAttribute("data-theme")).toBe(false);
  });
});
