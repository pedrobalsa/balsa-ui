import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import Button from "../src/components/ui/Button.vue";

describe("Button", () => {
  it("blocks interaction while loading", () => {
    const wrapper = mount(Button, {
      props: { loading: true },
      slots: { default: "Save" },
    });
    expect(wrapper.get("button").attributes("aria-busy")).toBe("true");
    expect(wrapper.get("button").attributes("disabled")).toBeDefined();
  });
});
