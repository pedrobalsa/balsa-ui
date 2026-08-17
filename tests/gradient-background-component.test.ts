import { mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const rendererState = vi.hoisted(() => ({
  instances: [] as Array<{
    update: ReturnType<typeof vi.fn>;
    resize: ReturnType<typeof vi.fn>;
    render: ReturnType<typeof vi.fn>;
    capturePng: ReturnType<typeof vi.fn>;
    dispose: ReturnType<typeof vi.fn>;
    framesPerSecond: number;
  }>,
  throwOnCreate: false,
}));

const glyphState = vi.hoisted(() => ({
  created: [] as string[],
  disposed: 0,
}));

/**
 * jsdom has no 2D context, so the real atlas would always decline to build.
 * Standing in for it is what makes the component's build-and-dispose lifecycle
 * observable at all.
 */
vi.mock("@/components/ui/gradient-background-glyphs", () => ({
  GRADIENT_BACKGROUND_GLYPH_ASPECT: 1.8,
  createGradientBackgroundGlyphAtlas: vi.fn((characters: string) => {
    glyphState.created.push(characters);
    return {
      texture: {},
      columns: [...characters].length,
      aspect: 1.8,
      characters,
      dispose: () => {
        glyphState.disposed += 1;
      },
    };
  }),
}));

vi.mock("@/components/ui/gradient-background-renderer", () => ({
  GradientBackgroundRenderer: class {
    update = vi.fn();
    resize = vi.fn();
    render = vi.fn();
    capturePng = vi.fn().mockResolvedValue(new Blob(["png"], { type: "image/png" }));
    dispose = vi.fn();
    framesPerSecond = 30;
    config: Record<string, unknown>;
    glyphs: unknown;

    constructor(...args: unknown[]) {
      if (rendererState.throwOnCreate) throw new Error("WebGL unavailable");
      this.config = args[1] as Record<string, unknown>;
      this.glyphs = args[3];
      rendererState.instances.push(this);
    }
  },
}));

import GradientBackground from "@/components/ui/GradientBackground.vue";

class ResizeObserverMock {
  static instances: ResizeObserverMock[] = [];
  callback: ResizeObserverCallback;
  observe = vi.fn();
  disconnect = vi.fn();

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
    ResizeObserverMock.instances.push(this);
  }

  emit(width: number, height: number): void {
    this.callback([
      { contentRect: { width, height } } as ResizeObserverEntry,
    ], this as unknown as ResizeObserver);
  }
}

class IntersectionObserverMock {
  static instances: IntersectionObserverMock[] = [];
  callback: IntersectionObserverCallback;
  observe = vi.fn();
  disconnect = vi.fn();

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
    IntersectionObserverMock.instances.push(this);
  }

  emit(isIntersecting: boolean): void {
    this.callback([
      { isIntersecting } as IntersectionObserverEntry,
    ], this as unknown as IntersectionObserver);
  }
}

describe("GradientBackground lifecycle", () => {
  let rafCallbacks: Map<number, FrameRequestCallback>;
  let nextRaf: number;
  let cancelAnimationFrameMock: ReturnType<typeof vi.fn>;
  let reducedMotion = false;

  beforeEach(() => {
    rendererState.instances.length = 0;
    rendererState.throwOnCreate = false;
    glyphState.created.length = 0;
    glyphState.disposed = 0;
    ResizeObserverMock.instances.length = 0;
    IntersectionObserverMock.instances.length = 0;
    rafCallbacks = new Map();
    nextRaf = 1;
    cancelAnimationFrameMock = vi.fn((id: number) => rafCallbacks.delete(id));
    vi.stubGlobal("ResizeObserver", ResizeObserverMock);
    vi.stubGlobal("IntersectionObserver", IntersectionObserverMock);
    vi.stubGlobal("requestAnimationFrame", vi.fn((callback: FrameRequestCallback) => {
      const id = nextRaf++;
      rafCallbacks.set(id, callback);
      return id;
    }));
    vi.stubGlobal("cancelAnimationFrame", cancelAnimationFrameMock);
    vi.stubGlobal("matchMedia", vi.fn(() => ({
      matches: reducedMotion,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })));
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "visible",
    });
  });

  afterEach(() => {
    reducedMotion = false;
    vi.unstubAllGlobals();
  });

  it("renders decoratively, resizes, and updates the existing renderer", async () => {
    const wrapper = mount(GradientBackground, {
      attachTo: document.body,
      props: { preset: "obsidian-fold", seed: 12, theme: "glassmorphism" },
    });
    expect(wrapper.attributes("aria-hidden")).toBe("true");
    expect(wrapper.attributes("data-theme")).toBe("glassmorphism");
    expect(wrapper.classes()).toContain("pointer-events-none");
    expect(rendererState.instances).toHaveLength(1);
    const instance = rendererState.instances[0]!;
    ResizeObserverMock.instances[0]!.emit(960, 540);
    expect(instance.resize).toHaveBeenCalledWith(960, 540);
    await wrapper.setProps({
      seed: 99,
      warp: 1.8,
      fieldFrequency: 0.9,
      noiseAmount: 0.12,
      noiseOctaves: 6,
      noiseFrequency: 2.1,
    });
    expect(rendererState.instances).toHaveLength(1);
    expect(instance.update).toHaveBeenCalled();
    expect(instance.update.mock.calls.at(-1)?.[0]).toMatchObject({
      seed: 99,
      warp: 1.8,
      fieldFrequency: 0.9,
      noiseAmount: 0.12,
      noiseOctaves: 6,
      noiseFrequency: 2.1,
    });
    wrapper.unmount();
  });

  it("keeps reduced-motion output static and pauses offscreen or hidden", () => {
    reducedMotion = true;
    const wrapper = mount(GradientBackground);
    expect(rendererState.instances[0]!.render).toHaveBeenCalled();
    expect(rafCallbacks.size).toBe(0);
    wrapper.unmount();

    reducedMotion = false;
    const animated = mount(GradientBackground);
    expect(rafCallbacks.size).toBeGreaterThan(0);
    IntersectionObserverMock.instances.at(-1)!.emit(false);
    expect(cancelAnimationFrameMock).toHaveBeenCalled();
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "hidden",
    });
    document.dispatchEvent(new Event("visibilitychange"));
    expect(rafCallbacks.size).toBe(0);
    animated.unmount();
  });

  it("renders a scrim only when asked, at a controllable opacity", () => {
    const off = mount(GradientBackground);
    expect(off.find("[data-balsa-gradient-scrim]").exists()).toBe(false);
    off.unmount();

    // `true` is a plain default; how much scrim a field needs is a caller decision.
    const defaulted = mount(GradientBackground, { props: { scrim: true } });
    const layer = defaulted.get("[data-balsa-gradient-scrim]");
    expect(layer.attributes("style")).toContain("opacity: 0.65");
    expect(layer.attributes("style")).toContain("var(--color-balsa-background)");
    defaulted.unmount();

    const custom = mount(GradientBackground, {
      props: { scrim: 0.25, scrimColor: "#102030" },
    });
    const customLayer = custom.get("[data-balsa-gradient-scrim]");
    expect(customLayer.attributes("style")).toContain("opacity: 0.25");
    // jsdom normalizes hex to rgb() when it round-trips through the style attribute.
    expect(customLayer.attributes("style")).toContain("rgb(16, 32, 48)");
    custom.unmount();

    // Out-of-range and non-finite values clamp instead of emitting bad CSS.
    const clamped = mount(GradientBackground, { props: { scrim: 4 } });
    expect(clamped.get("[data-balsa-gradient-scrim]").attributes("style")).toContain("opacity: 1");
    clamped.unmount();

    const zeroed = mount(GradientBackground, { props: { scrim: 0 } });
    expect(zeroed.find("[data-balsa-gradient-scrim]").exists()).toBe(false);
    zeroed.unmount();
  });

  it("shows the fallback on WebGL failure and context loss", () => {
    rendererState.throwOnCreate = true;
    const failed = mount(GradientBackground);
    expect(failed.find('[data-balsa="gradient-background"] > div').classes()).toContain("opacity-100");
    failed.unmount();

    rendererState.throwOnCreate = false;
    const wrapper = mount(GradientBackground);
    const event = new Event("webglcontextlost", { cancelable: true });
    wrapper.get("canvas").element.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(wrapper.find('[data-balsa="gradient-background"] > div').classes()).toContain("opacity-100");
    wrapper.get("canvas").element.dispatchEvent(new Event("webglcontextrestored"));
    expect(rendererState.instances[0]!.render).toHaveBeenCalled();
    wrapper.unmount();
  });

  it("builds the glyph atlas only for ASCII and releases it on every exit", async () => {
    const wrapper = mount(GradientBackground, { attachTo: document.body });
    const instance = rendererState.instances[0]!;
    // Nothing but ASCII needs glyphs, so nothing else pays to build them.
    expect(glyphState.created).toEqual([]);
    expect(instance.glyphs).toBeUndefined();

    await wrapper.setProps({ effect: "halftone" });
    expect(glyphState.created).toEqual([]);
    expect(instance.update.mock.calls.at(-1)?.[2]).toBeUndefined();

    await wrapper.setProps({ effect: "ascii" });
    expect(glyphState.created).toEqual([" .:-=+*#%@"]);
    expect(instance.update.mock.calls.at(-1)?.[2]).toMatchObject({
      characters: " .:-=+*#%@",
      columns: 10,
    });

    // An unrelated edit must not rebuild an atlas that would come out identical.
    await wrapper.setProps({ warp: 1.4 });
    expect(glyphState.created).toHaveLength(1);
    expect(glyphState.disposed).toBe(0);

    await wrapper.setProps({ effectCharacters: "01" });
    expect(glyphState.created).toEqual([" .:-=+*#%@", "01"]);
    expect(glyphState.disposed).toBe(1);

    await wrapper.setProps({ effect: "none" });
    expect(glyphState.disposed).toBe(2);
    expect(instance.update.mock.calls.at(-1)?.[2]).toBeUndefined();

    await wrapper.setProps({ effect: "ascii" });
    wrapper.unmount();
    expect(glyphState.disposed).toBe(3);
  });

  it("repairs the duotone pair against the content color, and leaves it alone otherwise", async () => {
    const wrapper = mount(GradientBackground, {
      attachTo: document.body,
      props: {
        effect: "ascii",
        effectColorMode: "duotone",
        effectInk: "#FFFFFF",
        effectPaper: "#FEFEFE",
      },
    });
    const instance = rendererState.instances[0]!;
    // Without a declared content color there is nothing to repair against, so
    // the authored pair is passed through untouched.
    expect(instance.glyphs).toBeDefined();
    expect(instance.config).toMatchObject({
      effectInk: "#FFFFFF",
      effectPaper: "#FEFEFE",
    });

    await wrapper.setProps({ contentColor: "#FFFFFF" });
    const repaired = instance.update.mock.calls.at(-1)?.[0];
    expect(repaired.effectInk).not.toBe("#FFFFFF");
    expect(repaired.effectPaper).not.toBe("#FEFEFE");

    await wrapper.setProps({ effectColorMode: "gradient" });
    expect(instance.update.mock.calls.at(-1)?.[0]).toMatchObject({
      effectInk: "#FFFFFF",
      effectPaper: "#FEFEFE",
    });
    wrapper.unmount();
  });

  it("captures PNG output and fully cleans up observers and frames", async () => {
    const wrapper = mount(GradientBackground);
    const exposed = wrapper.vm as unknown as {
      capturePng: (options: { width: number; height: number }) => Promise<Blob>;
    };
    const blob = await exposed.capturePng({ width: 1920, height: 1080 });
    expect(blob.type).toBe("image/png");
    expect(rendererState.instances[0]!.capturePng).toHaveBeenCalledWith({
      width: 1920,
      height: 1080,
    });
    const resize = ResizeObserverMock.instances[0]!;
    const intersection = IntersectionObserverMock.instances[0]!;
    wrapper.unmount();
    expect(resize.disconnect).toHaveBeenCalledOnce();
    expect(intersection.disconnect).toHaveBeenCalledOnce();
    expect(rendererState.instances[0]!.dispose).toHaveBeenCalledOnce();
    expect(rafCallbacks.size).toBe(0);
  });
});
