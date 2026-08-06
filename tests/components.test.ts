import { h, ref } from "vue";
import { flushPromises, mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import { Bell, Bold, ChevronDown, Eye, Home, Plus, Search, Shapes } from "@lucide/vue";

import Autocomplete from "../src/components/ui/Autocomplete.vue";
import Accordion from "../src/components/ui/Accordion.vue";
import Alert from "../src/components/ui/Alert.vue";
import Attachment from "../src/components/ui/Attachment.vue";
import Avatar from "../src/components/ui/Avatar.vue";
import Badge from "../src/components/ui/Badge.vue";
import Breadcrumb from "../src/components/ui/Breadcrumb.vue";
import Button from "../src/components/ui/Button.vue";
import Card from "../src/components/ui/Card.vue";
import ApplicationCard from "../src/components/compositions/ApplicationCard.vue";
import Calendar from "../src/components/ui/Calendar.vue";
import Carousel from "../src/components/ui/Carousel.vue";
import Charts from "../src/components/ui/Charts.vue";
import Checkbox from "../src/components/ui/Checkbox.vue";
import CodeBlock from "../src/components/ui/CodeBlock.vue";
import Collapsible from "../src/components/ui/Collapsible.vue";
import ColorPicker from "../src/components/ui/ColorPicker.vue";
import CommandMenu from "../src/components/ui/CommandMenu.vue";
import ContextMenu from "../src/components/ui/ContextMenu.vue";
import DataTable from "../src/components/ui/DataTable.vue";
import DatePicker from "../src/components/ui/DatePicker.vue";
import Drawer from "../src/components/ui/Drawer.vue";
import Dropdown from "../src/components/ui/Dropdown.vue";
import DropdownMenu from "../src/components/ui/DropdownMenu.vue";
import PropertySelect from "../src/components/ui/PropertySelect.vue";
import HoverCard from "../src/components/ui/HoverCard.vue";
import Input from "../src/components/ui/Input.vue";
import InputGroup from "../src/components/ui/InputGroup.vue";
import InputOTP from "../src/components/ui/InputOTP.vue";
import Icon from "../src/components/ui/Icon.vue";
import Kbd from "../src/components/ui/Kbd.vue";
import Link from "../src/components/ui/Link.vue";
import Modal from "../src/components/ui/Modal.vue";
import Menubar from "../src/components/ui/Menubar.vue";
import Footer from "../src/components/ui/Footer.vue";
import Navbar from "../src/components/ui/Navbar.vue";
import Progress from "../src/components/ui/Progress.vue";
import Popup from "../src/components/ui/Popup.vue";
import Pagination from "../src/components/ui/Pagination.vue";
import Preview from "../src/components/ui/Preview.vue";
import RadioGroup from "../src/components/ui/RadioGroup.vue";
import Resizable from "../src/components/ui/Resizable.vue";
import ScrollArea from "../src/components/ui/ScrollArea.vue";
import Sidebar from "../src/components/ui/Sidebar.vue";
import Select from "../src/components/ui/Select.vue";
import Separator from "../src/components/ui/Separator.vue";
import Skeleton from "../src/components/ui/Skeleton.vue";
import Spinner from "../src/components/ui/Spinner.vue";
import Slider from "../src/components/ui/Slider.vue";
import Switch from "../src/components/ui/Switch.vue";
import Tabs from "../src/components/ui/Tabs.vue";
import Table from "../src/components/ui/Table.vue";
import Toggle from "../src/components/ui/Toggle.vue";
import ToggleGroup from "../src/components/ui/ToggleGroup.vue";
import Toast from "../src/components/ui/Toast.vue";
import ToastViewport, {
  type ToastItem,
} from "../src/components/ui/ToastViewport.vue";
import Tooltip from "../src/components/ui/Tooltip.vue";
import Textarea from "../src/components/ui/Textarea.vue";

function dispatchPointer(
  element: Element,
  type: string,
  init: { pointerId: number; clientX: number; clientY?: number; pointerType?: string; button?: number },
): void {
  const event = new MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    clientX: init.clientX,
    clientY: init.clientY ?? 0,
    button: init.button ?? 0,
  });
  Object.defineProperties(event, {
    pointerId: { value: init.pointerId },
    pointerType: { value: init.pointerType ?? "touch" },
  });
  element.dispatchEvent(event);
}

describe("Balsa public components", () => {
  it("standardizes Lucide size, stroke, color, and decorative semantics", () => {
    const icon = mount(Icon, { props: { icon: Search, size: "lg", strokeWidth: 1.5 } }).get("svg");
    expect(icon.attributes()).toMatchObject({
      width: "24",
      height: "24",
      stroke: "currentColor",
      "stroke-width": "1.5",
      "aria-hidden": "true",
      focusable: "false",
    });
  });

  it("promotes a labelled Icon to a named image", () => {
    const icon = mount(Icon, { props: { icon: Search, label: "Search", size: "xs", strokeWidth: 2.5 } }).get("svg");
    expect(icon.attributes()).toMatchObject({ role: "img", "aria-label": "Search", width: "12", "stroke-width": "5" });
    expect(icon.attributes("aria-hidden")).toBeUndefined();
  });

  it.each([
    ["modern-flat", "dark"],
    ["modern-flat", "light"],
    ["brutalism", "dark"],
    ["brutalism", "light"],
    ["glassmorphism", "dark"],
    ["glassmorphism", "light"],
  ] as const)(
    "lets consumer classes replace defaults in %s with the %s palette",
    (theme, palette) => {
      const button = mount(Button, {
        props: { theme },
        attrs: {
          class: "h-7 w-full rounded-none px-2 text-xs",
          "data-palette": palette,
          style: "margin-inline: 1rem",
        },
        slots: { default: "Action" },
      }).get("button");

      expect(button.attributes("data-theme")).toBe(theme);
      expect(button.attributes("data-palette")).toBe(palette);
      expect(button.attributes("style")).toContain("margin-inline: 1rem");
      expect(button.classes()).toEqual(expect.arrayContaining([
        "h-7",
        "w-full",
        "rounded-none",
        "px-2",
        "text-xs",
      ]));
      expect(button.classes()).not.toEqual(expect.arrayContaining([
        "h-8",
        "w-fit",
        "rounded-lg",
        "px-3",
        "text-sm",
      ]));

      const card = mount(Card, {
        props: { theme, padding: "none", shadow: false },
        attrs: {
          class: "rounded-balsa-panel p-3",
          "data-palette": palette,
        },
        slots: { default: "Content" },
      }).get('[data-balsa="card"]');

      expect(card.attributes("data-shadow")).toBe("none");
      expect(card.classes()).toEqual(expect.arrayContaining([
        "rounded-balsa-panel",
        "p-3",
      ]));
      expect(card.classes()).not.toEqual(expect.arrayContaining([
        "rounded-balsa-surface",
        "p-0",
        "shadow-balsa-surface",
        "shadow-balsa-panel",
      ]));
    },
  );

  it("disables a loading button and announces busy state", () => {
    const wrapper = mount(Button, {
      props: { loading: true },
      slots: { default: "Save" },
    });
    const button = wrapper.get("button");
    expect(button.attributes("disabled")).toBeDefined();
    expect(button.attributes("aria-busy")).toBe("true");
    expect(wrapper.get('[data-balsa="icon"]').classes()).toContain("lucide-loader-circle");
  });

  it("renders leading and trailing Lucide components with both-icon padding", () => {
    const button = mount(Button, {
      props: {
        prefixIcon: Plus,
        suffixIcon: ChevronDown,
      },
      slots: { default: "Button" },
    }).get("button");

    const icons = button.findAll('[data-balsa="icon"]');
    expect(icons).toHaveLength(2);
    expect(icons[0]?.classes()).toContain("lucide-plus");
    expect(icons[1]?.classes()).toContain("lucide-chevron-down");
    expect(button.classes()).toContain("px-2.5");
  });

  it("renders the typed glass button with a restrained semantic rim hook", () => {
    const button = mount(Button, {
      props: { variant: "glass", color: "accent" },
      slots: { default: "Glass action" },
    }).get("button");

    expect(button.attributes("data-variant")).toBe("glass");
    expect(button.attributes("data-color")).toBe("accent");
    expect(button.classes()).toEqual(expect.arrayContaining([
      "border",
      "text-balsa-accent",
    ]));
    expect(button.classes()).not.toContain("border-balsa-accent");
  });

  it("renders the typed soft button with palette-owned interaction states", () => {
    const button = mount(Button, {
      props: { variant: "soft", color: "secondary" },
      slots: { default: "Soft action" },
    }).get("button");

    expect(button.attributes("data-variant")).toBe("soft");
    expect(button.classes()).toEqual(expect.arrayContaining([
      "bg-balsa-secondary/15",
      "text-balsa-secondary",
      "hover:bg-balsa-secondary/20",
      "active:bg-balsa-secondary/25",
    ]));
    expect(button.classes()).not.toContain("border-balsa-secondary");
  });

  it("uses square default Button geometry in Brutalism while retaining consumer overrides", () => {
    const defaultButton = mount(Button, {
      props: { theme: "brutalism" },
      slots: { default: "Action" },
    }).get("button");
    const overriddenButton = mount(Button, {
      props: { theme: "brutalism" },
      attrs: { class: "rounded-lg" },
      slots: { default: "Action" },
    }).get("button");

    expect(defaultButton.classes()).toContain("rounded-balsa-control");
    expect(defaultButton.classes()).not.toContain("rounded-lg");
    expect(overriddenButton.classes()).toContain("rounded-lg");
    expect(overriddenButton.classes()).not.toContain("rounded-balsa-control");
  });

  it("makes the FAB shape square, circular, padding-free, and accessible", () => {
    const button = mount(Button, {
      props: {
        shape: "fab",
        size: "md",
        prefixIcon: Plus,
      },
      attrs: { "aria-label": "Add placeholder" },
    }).get("button");

    expect(button.attributes("data-shape")).toBe("fab");
    expect(button.attributes("aria-label")).toBe("Add placeholder");
    expect(button.classes()).toEqual(expect.arrayContaining([
      "h-9",
      "w-9",
      "rounded-balsa-pill",
      "p-0",
    ]));
    expect(button.get('[data-balsa="icon"]').attributes("width")).toBe("20");
    expect(button.classes()).not.toContain("w-fit");
    expect(button.classes()).not.toContain("pl-3");
    expect(button.classes()).not.toContain("pr-4");
  });

  it.each([
    ["sm", "h-8", "w-8", "16"],
    ["md", "h-9", "w-9", "20"],
    ["lg", "h-10", "w-10", "20"],
    ["xl", "h-12", "w-12", "24"],
    ["2xl", "h-18", "w-18", "32"],
  ] as const)(
    "uses the distinct %s FAB control and icon scale",
    (size, heightClass, widthClass, iconWidth) => {
      const button = mount(Button, {
        props: {
          shape: "fab",
          size,
          prefixIcon: Plus,
        },
        attrs: { "aria-label": "Add placeholder" },
      }).get("button");

      expect(button.classes()).toEqual(expect.arrayContaining([
        heightClass,
        widthClass,
      ]));
      expect(button.get('[data-balsa="icon"]').attributes("width")).toBe(iconWidth);
    },
  );

  it("associates input label, hint, and invalid feedback", () => {
    const wrapper = mount(Input, {
      props: {
        id: "email",
        label: "Email",
        hint: "Work address",
        status: "unvalidated",
        statusMessage: "Enter a valid address.",
      },
    });
    expect(wrapper.get("label").attributes("for")).toBe("email");
    expect(wrapper.get("input").attributes("aria-invalid")).toBe("true");
    expect(wrapper.get("input").attributes("aria-describedby")).toBe("email-hint email-status");
    expect(wrapper.get('[role="alert"]').text()).toBe("Enter a valid address.");

    const password = mount(Input, {
      props: { id: "password", label: "Password", type: "password", autocomplete: "current-password" },
    });
    expect(password.get("input").attributes("type")).toBe("password");
    expect(password.get("input").attributes("autocomplete")).toBe("current-password");
  });

  it("formats phone, monetary, and custom masked Input values", async () => {
    const phone = mount(Input, {
      props: { id: "phone", label: "Phone", type: "phone" },
    });
    const monetary = mount(Input, {
      props: {
        id: "amount",
        label: "Amount",
        type: "monetary",
        currency: "USD",
        locale: "en-US",
      },
    });
    const custom = mount(Input, {
      props: { id: "code", label: "Code", mask: "##-##" },
    });
    const percentage = mount(Input, {
      props: { id: "percentage", label: "Percentage", type: "percentage" },
    });

    await phone.get("input").setValue("11987654321");
    await monetary.get("input").setValue("123456");
    await custom.get("input").setValue("1234");
    await percentage.get("input").setValue("12.5");

    expect(phone.get("input").attributes("type")).toBe("text");
    expect(phone.get("input").attributes("inputmode")).toBe("tel");
    expect((phone.get("input").element as HTMLInputElement).value).toBe("(11) 98765-4321");
    expect(phone.emitted("update:modelValue")?.at(-1)).toEqual(["(11) 98765-4321"]);
    expect(monetary.get("input").attributes("inputmode")).toBe("decimal");
    expect((monetary.get("input").element as HTMLInputElement).value).toBe("$1,234.56");
    expect(monetary.emitted("update:modelValue")?.at(-1)).toEqual([1234.56]);
    expect((custom.get("input").element as HTMLInputElement).value).toBe("12-34");
    expect(percentage.get("input").attributes("inputmode")).toBe("decimal");
    expect((percentage.get("input").element as HTMLInputElement).value).toBe("12.5");
    expect(percentage.text()).toContain("%");
    expect(percentage.emitted("update:modelValue")?.at(-1)).toEqual([12.5]);

    await percentage.get("input").setValue("125");
    expect((percentage.get("input").element as HTMLInputElement).value).toBe("100");
    expect(percentage.emitted("update:modelValue")?.at(-1)).toEqual([100]);
  });

  it("applies one compact size contract across text-like controls", async () => {
    const input = mount(Input, {
      props: { id: "compact-name", label: "Name", size: "sm" },
      attrs: { class: "custom-control", style: "width: 12rem" },
    });
    expect(input.get("input").classes()).toContain("h-8");
    expect(input.get("input").classes()).toContain("text-sm");
    expect(input.get("input").classes()).not.toContain("h-9");
    expect(input.get("input").classes()).toContain("custom-control");
    expect(input.get("input").attributes("style")).toContain("width: 12rem");

    const select = mount(Select, {
      props: {
        id: "compact-role",
        label: "Role",
        size: "sm",
        options: [
          { label: "Designer", value: "designer" },
          { label: "Developer", value: "developer" },
        ],
      },
      attrs: { class: "custom-control" },
    });
    const trigger = select.get('[role="combobox"]');
    expect(trigger.classes()).toContain("h-8");
    expect(trigger.classes()).toContain("custom-control");
    await trigger.trigger("click");
    expect(select.get('[role="listbox"]').attributes("popover")).toBe("auto");
    expect(select.get('[role="listbox"]').classes()).toContain("visible");

    const autocomplete = mount(Autocomplete, {
      props: {
        id: "compact-framework",
        label: "Framework",
        size: "sm",
        suggestions: ["Vue", "Nuxt"],
      },
      attrs: { class: "custom-control" },
    });
    const autocompleteInput = autocomplete.get('[role="combobox"]');
    expect(autocompleteInput.classes()).toContain("h-8");
    expect(autocompleteInput.classes()).toContain("text-sm");
    expect(autocompleteInput.classes()).toContain("custom-control");
    await autocompleteInput.trigger("focus");
    await autocompleteInput.trigger("click");
    expect(autocomplete.get('[role="listbox"]').attributes("popover")).toBe(
      "manual",
    );
    expect(autocomplete.get('[role="listbox"]').classes()).toContain(
      "visible",
    );
  });

  it("supports rich selected and option content without replacing selection semantics", async () => {
    const wrapper = mount(Select, {
      props: {
        id: "rich-palette",
        label: "Palette",
        modelValue: "ember",
        options: [
          { label: "Ember", value: "ember" },
          { label: "Lagoon", value: "lagoon" },
        ],
      },
      slots: {
        selected: ({ option }: { option?: { label: string } }) =>
          h("span", { class: "rich-selected" }, `Selected ${option?.label}`),
        option: ({ option }: { option: { label: string } }) =>
          h("span", { class: "rich-option" }, `Palette ${option.label}`),
      },
    });

    const trigger = wrapper.get('[role="combobox"]');
    expect(trigger.text()).toBe("Selected Ember");
    expect(trigger.attributes("aria-expanded")).toBe("false");

    await trigger.trigger("click");
    const listbox = wrapper.get('[role="listbox"]');
    const options = wrapper.findAll('[role="option"]');
    expect(listbox.classes()).toContain("space-y-1");
    expect(options[0].classes()).toContain("min-h-8");
    expect(options[1].classes()).toContain("min-h-8");
    expect(options[0].classes()).toContain("bg-balsa-selected/80");
    expect(options[0].text()).toContain("Palette Ember");
    expect(options[0].attributes("aria-selected")).toBe("true");

    await options[1].trigger("click");
    expect(wrapper.emitted("update:modelValue")?.at(-1)).toEqual(["lagoon"]);
    expect(trigger.attributes("aria-expanded")).toBe("false");
  });

  it("toggles multiple Select values without closing the listbox", async () => {
    const wrapper = mount(Select, {
      props: {
        id: "field-status",
        label: "Status",
        multiple: true,
        modelValue: ["required"],
        options: [
          { label: "Required", value: "required" },
          { label: "Disabled", value: "disabled" },
          { label: "Loading", value: "loading" },
        ],
      },
    });

    const trigger = wrapper.get('[role="combobox"]');
    expect(trigger.text()).toContain("Required");
    await trigger.trigger("click");

    const listbox = wrapper.get('[role="listbox"]');
    expect(listbox.attributes("aria-multiselectable")).toBe("true");
    const options = wrapper.findAll('[role="option"]');
    expect(options[0].attributes("aria-selected")).toBe("true");

    await options[1].trigger("click");
    expect(wrapper.emitted("update:modelValue")?.at(-1)).toEqual([
      ["required", "disabled"],
    ]);
    expect(trigger.attributes("aria-expanded")).toBe("true");

    await wrapper.setProps({ modelValue: ["required", "disabled"] });
    await options[0].trigger("click");
    expect(wrapper.emitted("update:modelValue")?.at(-1)).toEqual([
      ["disabled"],
    ]);
  });

  it("supports multiple Autocomplete values with removable selected suggestions", async () => {
    const wrapper = mount(Autocomplete, {
      props: {
        id: "frameworks",
        label: "Frameworks",
        multiple: true,
        modelValue: ["Vue"],
        suggestions: ["Vue", "Nuxt", "Vite"],
      },
    });
    const input = wrapper.get('[role="combobox"]');

    expect((input.element as HTMLInputElement).value).toBe("");
    expect(wrapper.get('[aria-label="Remove Vue"]')).toBeTruthy();
    await input.trigger("focus");
    const listbox = wrapper.get('[role="listbox"]');
    expect(listbox.attributes("aria-multiselectable")).toBe("true");
    expect(wrapper.get("#frameworks-suggestion-0").attributes("aria-selected")).toBe("true");

    await wrapper.get("#frameworks-suggestion-1").trigger("click");
    expect(wrapper.emitted("update:modelValue")?.at(-1)).toEqual([["Vue", "Nuxt"]]);
    expect(input.attributes("aria-expanded")).toBe("true");

    await wrapper.setProps({ modelValue: ["Vue", "Nuxt"] });
    await wrapper.get('[aria-label="Remove Vue"]').trigger("click");
    expect(wrapper.emitted("update:modelValue")?.at(-1)).toEqual([["Nuxt"]]);

    await wrapper.setProps({ modelValue: ["Nuxt"] });
    await input.trigger("keydown", { key: "Backspace" });
    expect(wrapper.emitted("update:modelValue")?.at(-1)).toEqual([[]]);
  });

  it("opens a custom multi-format color picker from a single swatch trigger", async () => {
    const wrapper = mount(ColorPicker, {
      attachTo: document.body,
      props: {
        id: "brand-color",
        label: "Brand",
        accessibleLabel: "Primary brand color",
        description: "Used for primary actions.",
        modelValue: "#0f766e",
      },
    });
    const trigger = wrapper.get("#brand-color");
    expect(trigger.attributes("aria-label")).toBe("Primary brand color: #0F766E");
    expect(trigger.attributes("aria-describedby")).toBe("brand-color-description");
    expect(wrapper.get("#brand-color-label").text()).toBe("Brand");
    expect(wrapper.get("#brand-color-label").classes()).toContain(
      "text-balsa-muted-foreground",
    );
    expect(wrapper.get("#brand-color-label").classes()).toContain("text-left");
    expect(wrapper.get("#brand-color-label").classes()).toContain(
      "whitespace-nowrap",
    );
    expect(wrapper.get("#brand-color-label").classes()).not.toContain("truncate");
    expect(trigger.find("#brand-color-label").exists()).toBe(false);
    expect(trigger.classes()).toContain("size-8");
    expect(trigger.attributes("style")).toContain("background-color: rgb(15, 118, 110)");
    expect(wrapper.find('input[type="color"]').exists()).toBe(false);
    expect(wrapper.get("output").text()).toBe("#0F766E");

    await trigger.trigger("click");
    await flushPromises();
    const dialog = wrapper.get('[role="dialog"]');
    expect(trigger.attributes("aria-expanded")).toBe("true");
    expect(dialog.classes()).not.toContain("hidden");
    const colorCode = wrapper.get("#brand-color-color-code");
    expect(colorCode.element).toBe(document.activeElement);
    expect((colorCode.element as HTMLInputElement).value).toBe("#0F766E");
    const saturationField = wrapper.get('[aria-label="Saturation and brightness"]');
    const hueInput = wrapper.get('[aria-label="Hue"]');
    expect(saturationField).toBeTruthy();
    expect(hueInput).toBeTruthy();

    Object.defineProperty(saturationField.element, "getBoundingClientRect", {
      configurable: true,
      value: () => ({
        bottom: 160,
        height: 160,
        left: 0,
        right: 160,
        top: 0,
        width: 160,
      }),
    });
    const initialHue = (hueInput.element as HTMLInputElement).value;
    const dispatchPointer = (type: string, clientX = 0, clientY = 160) => {
      const event = new MouseEvent(type, {
        bubbles: true,
        button: 0,
        cancelable: true,
        clientX,
        clientY,
      });
      Object.defineProperty(event, "pointerId", { value: 1 });
      saturationField.element.dispatchEvent(event);
    };
    dispatchPointer("pointerdown");
    await flushPromises();
    dispatchPointer("pointermove");
    await flushPromises();
    dispatchPointer("pointerup");
    await flushPromises();
    expect((hueInput.element as HTMLInputElement).value).toBe(initialHue);

    await colorCode.setValue("#");
    expect((colorCode.element as HTMLInputElement).value).toBe("#");
    expect(colorCode.attributes("aria-invalid")).toBe("true");
    expect(wrapper.get("output").text()).toBe("#000000");
    await colorCode.trigger("blur");
    expect((colorCode.element as HTMLInputElement).value).toBe("#000000");

    await colorCode.setValue("#aabbcc");
    expect(wrapper.emitted("update:modelValue")?.at(-1)).toEqual(["#aabbcc"]);
    await wrapper.setProps({ modelValue: "#aabbcc" });

    const format = wrapper.get("#brand-color-color-code-format");
    expect(format.attributes("aria-label")).toBe("Color code format");
    await format.trigger("click");
    await flushPromises();
    await wrapper.get("#brand-color-color-code-format-option-1").trigger("click");
    expect((colorCode.element as HTMLInputElement).value).toBe("rgb(170, 187, 204)");
    await colorCode.setValue("rgb(15, 118, 110)");
    expect(wrapper.emitted("update:modelValue")?.at(-1)).toEqual(["#0f766e"]);

    await format.trigger("click");
    await flushPromises();
    await wrapper.get("#brand-color-color-code-format-option-2").trigger("click");
    expect((colorCode.element as HTMLInputElement).value).toBe("hsl(175.34, 77.44%, 26.08%)");
    await colorCode.setValue("hsl(0, 100%, 50%)");
    expect(wrapper.emitted("update:modelValue")?.at(-1)).toEqual(["#ff0000"]);

    await wrapper.setProps({
      label: "A longer color label",
      labelPosition: "inside",
      modelValue: "#000000",
      size: "lg",
    });
    expect(trigger.classes()).toContain("size-14");
    expect(trigger.classes()).not.toContain("size-10");
    expect((trigger.get("#brand-color-label").element as HTMLElement).style.color)
      .toBe("rgb(255, 255, 255)");
    await wrapper.setProps({ modelValue: "#ffffff" });
    expect((trigger.get("#brand-color-label").element as HTMLElement).style.color)
      .toBe("rgb(0, 0, 0)");
    await dialog.trigger("keydown", { key: "Escape" });
    expect(trigger.attributes("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(trigger.element);
    wrapper.unmount();
  });

  it("supports a palette trigger with contextual editor actions", async () => {
    const wrapper = mount(ColorPicker, {
      attachTo: document.body,
      props: {
        id: "segmented-color",
        label: "Stop 1",
        accessibleLabel: "Color stop 1",
        modelValue: "#123456",
        type: "palette",
      },
      slots: {
        actions: ({ close }: { close: () => Promise<void> }) =>
          h("button", {
            type: "button",
            class: "remove-color",
            onClick: close,
          }, "Remove"),
      },
    });

    const trigger = wrapper.get("#segmented-color");
    expect(wrapper.get("#segmented-color-label").classes()).toContain("sr-only");
    expect(trigger.classes()).toContain("w-full");
    expect(trigger.classes()).toContain("h-full");
    expect(trigger.classes()).toContain("rounded-none");
    expect(trigger.attributes("aria-label")).toBe("Color stop 1: #123456");

    await trigger.trigger("click");
    const popover = wrapper.get("#segmented-color-popover");
    const remove = popover.get(".remove-color");
    const close = popover.get('button[aria-label="Close color picker"]');
    expect(remove.element.nextElementSibling).toBe(close.element);

    await remove.trigger("click");
    expect(trigger.attributes("aria-expanded")).toBe("false");
    wrapper.unmount();
  });

  it("supports capped auto-expanding textarea geometry and validation feedback", async () => {
    const wrapper = mount(Textarea, {
      props: {
        id: "bio",
        label: "Biography",
        hint: "Short",
        status: "unvalidated",
        rounded: "xl",
        autoExpand: true,
        maxHeight: 120,
        resizable: "none",
      },
    });
    const textarea = wrapper.get("textarea");
    Object.defineProperty(textarea.element, "scrollHeight", { configurable: true, value: 240 });
    await textarea.setValue("Longer biography placeholder.");
    await flushPromises();

    expect(textarea.attributes("aria-describedby")).toBe("bio-hint bio-status");
    expect(textarea.attributes("aria-invalid")).toBe("true");
    expect(textarea.classes()).toEqual(expect.arrayContaining(["rounded-xl", "resize-none"]));
    expect((textarea.element as HTMLTextAreaElement).style.height).toBe("120px");
    expect((textarea.element as HTMLTextAreaElement).style.overflowY).toBe("auto");
    expect(wrapper.get('[role="alert"]').text()).toBe("Check this information and try again.");

    await wrapper.setProps({ autoExpand: false });
    await flushPromises();
    expect((textarea.element as HTMLTextAreaElement).style.height).toBe("");
    expect((textarea.element as HTMLTextAreaElement).style.overflowY).toBe("");
  });

  it("applies the shared form variants across every form primitive", async () => {
    const input = mount(Input, {
      props: { id: "variant-input", label: "Input", variant: "outline" },
    });
    expect(input.get("[data-balsa=input]").attributes("data-variant")).toBe("outline");
    expect(input.get("input").classes()).toContain("bg-balsa-background");

    const textarea = mount(Textarea, {
      props: { id: "variant-textarea", label: "Textarea", variant: "soft" },
    });
    expect(textarea.get("[data-balsa=textarea]").attributes("data-variant")).toBe("soft");
    expect(textarea.get("textarea").classes()).toContain("bg-balsa-muted");

    const select = mount(Select, {
      props: {
        id: "variant-select",
        label: "Select",
        variant: "glass",
        options: [{ label: "One", value: "one" }],
      },
    });
    await select.get('[role="combobox"]').trigger("click");
    expect(select.get('[data-balsa="select"]').attributes("data-variant")).toBe("glass");
    expect(select.get('[role="listbox"]').classes()).toContain("backdrop-blur-md");

    const autocomplete = mount(Autocomplete, {
      props: {
        id: "variant-autocomplete",
        label: "Autocomplete",
        variant: "glass",
        suggestions: ["One"],
      },
    });
    await autocomplete.get('[role="combobox"]').trigger("focus");
    expect(autocomplete.get('[data-balsa="autocomplete"]').attributes("data-variant")).toBe("glass");
    expect(autocomplete.get('[role="listbox"]').classes()).toContain("backdrop-blur-md");

    const checkbox = mount(Checkbox, {
      props: { id: "variant-checkbox", label: "Checkbox", variant: "soft" },
    });
    expect(checkbox.get("input").classes()).toContain("bg-balsa-muted");

    const switchControl = mount(Switch, {
      props: { id: "variant-switch", label: "Switch", variant: "outline" },
    });
    expect(switchControl.get('[data-balsa="switch-control"]').classes()).toContain("bg-balsa-background");

    const colorPicker = mount(ColorPicker, {
      props: { id: "variant-color", label: "Color", variant: "glass" },
    });
    expect(colorPicker.get("#variant-color").classes()).toContain("backdrop-blur-md");
  });

  it("renders navigable Breadcrumb ancestors and a labelled current page", () => {
    const wrapper = mount(Breadcrumb, {
      props: {
        items: [
          { label: "Docs", href: "/docs" },
          { label: "Components", href: "/docs/components" },
          { label: "Button" },
        ],
        separator: "slash",
        size: "md",
      },
    });
    expect(wrapper.get("nav").attributes("aria-label")).toBe("Breadcrumb");
    expect(wrapper.findAll("a").map((link) => link.attributes("href"))).toEqual([
      "/docs",
      "/docs/components",
    ]);
    expect(wrapper.get('[aria-current="page"]').text()).toBe("Button");
    expect(wrapper.get('[aria-hidden="true"]').text()).toBe("/");
    expect(wrapper.get('[data-balsa="breadcrumb"]').attributes("data-size")).toBe("md");
  });

  it("protects external links opened in a new browsing context", () => {
    const wrapper = mount(Link, {
      props: { href: "https://example.com", external: true },
      slots: { default: "External reference" },
    });
    expect(wrapper.get("a").attributes("target")).toBe("_blank");
    expect(wrapper.get("a").attributes("rel")).toBe("noreferrer");
  });

  it("exposes typed size and square-geometry controls across visual primitives", () => {
    const badge = mount(Badge, {
      props: { size: "lg", rounded: "none" },
      slots: { default: "Status" },
    }).get('[data-balsa="badge"]');
    expect(badge.attributes("data-size")).toBe("lg");
    expect(badge.classes()).toContain("rounded-none");

    const roundedBadge = mount(Badge, {
      props: { rounded: "xl" },
      slots: { default: "Status" },
    }).get('[data-balsa="badge"]');
    expect(roundedBadge.classes()).toContain("rounded-xl");

    const glassBadge = mount(Badge, {
      props: { variant: "glass", color: "primary" },
      slots: { default: "Status" },
    }).get('[data-balsa="badge"]');
    expect(glassBadge.attributes("data-variant")).toBe("glass");
    expect(glassBadge.classes()).toEqual(expect.arrayContaining([
      "border",
      "border-balsa-primary/40",
      "bg-balsa-primary/10",
      "backdrop-blur-md",
    ]));

    const card = mount(Card, { props: { size: "sm", rounded: "none" } })
      .get('[data-balsa="card"]');
   expect(card.classes()).toEqual(expect.arrayContaining(["p-4", "rounded-none"]));
    expect(card.attributes("data-color")).toBe("neutral");
    expect(card.classes()).toContain("border-balsa-border");
    expect(card.classes()).not.toContain("border");
    expect(card.classes()).not.toContain("border-balsa-primary/30");

    const glassCard = mount(Card, {
      props: { variant: "glass", color: "accent" },
      slots: { default: "Content" },
    }).get('[data-balsa="card"]');
    expect(glassCard.attributes("data-color")).toBe("accent");
    expect(glassCard.classes()).toEqual(expect.arrayContaining([
      "border-balsa-accent/40",
    ]));
    // The themed recipe owns the backdrop through --balsa-backdrop-blur; a
    // utility here would outrank it from Tailwind's utilities layer.
    expect(glassCard.attributes("data-variant")).toBe("glass");
    expect(glassCard.classes().join(" ")).not.toMatch(/backdrop-blur-/);
    expect(glassCard.classes()).not.toContain("bg-balsa-accent/10");

    const defaultCard = mount(Card, { slots: { default: "Content" } })
      .get('[data-balsa="card"]');
    expect(defaultCard.attributes("data-rounded")).toBe("2xl");
    expect(defaultCard.classes()).not.toContain("rounded-2xl");

    const input = mount(Input, {
      props: { id: "compact-input", label: "Input", rounded: "none" },
    });
    expect(input.get("input").classes()).toContain("rounded-none");

    const link = mount(Link, {
      props: { href: "/docs", rounded: "none" },
      slots: { default: "Docs" },
    }).get("a");
    expect(link.classes()).toContain("rounded-none");

    const colorPicker = mount(ColorPicker, {
      props: { id: "compact-color", label: "Color", rounded: "none" },
    });
    expect(colorPicker.get("button").classes()).toContain("rounded-none");

    const select = mount(Select, {
      props: {
        id: "compact-select",
        label: "Select",
        options: [{ label: "Option", value: "option" }],
        rounded: "none",
      },
    });
    expect(select.get('[data-balsa-control]').classes()).toContain("rounded-none");

    const autocomplete = mount(Autocomplete, {
      props: {
        id: "compact-autocomplete",
        label: "Autocomplete",
        suggestions: ["Option"],
        rounded: "none",
      },
    });
    expect(autocomplete.get("input").classes()).toContain("rounded-none");

    const checkbox = mount(Checkbox, {
      props: { id: "compact-checkbox", label: "Checkbox", size: "lg", rounded: "none" },
    });
    expect(checkbox.get("input").classes()).toEqual(expect.arrayContaining(["h-6", "rounded-none"]));

    const switchControl = mount(Switch, {
      props: { id: "compact-switch", label: "Switch", size: "sm", rounded: "none" },
    });
    expect(switchControl.get('[data-balsa="switch-control"]').classes()).toEqual(expect.arrayContaining(["h-5", "rounded-none"]));

    const tabs = mount(Tabs, {
      props: {
        id: "compact-tabs",
        modelValue: "one",
        items: [{ id: "one", label: "One" }],
        size: "lg",
        rounded: "none",
      },
    });
    expect(tabs.get('[data-balsa="tabs-list"]').classes()).toContain("rounded-none");
    expect(tabs.get('[data-balsa="tabs-panel"]').classes()).toEqual(expect.arrayContaining(["rounded-none", "p-6"]));
    expect(tabs.get('[data-balsa="tabs-panel"]').attributes("data-surface")).toBe("true");

    const barePanelTabs = mount(Tabs, {
      props: {
        id: "bare-tabs",
        modelValue: "one",
        items: [{ id: "one", label: "One" }],
        panelSurface: false,
      },
    }).get('[data-balsa="tabs-panel"]');
    expect(barePanelTabs.attributes("data-surface")).toBe("false");
    expect(barePanelTabs.classes()).not.toEqual(expect.arrayContaining([
      "border",
      "bg-balsa-surface",
      "p-5",
    ]));

    const underlineTabs = mount(Tabs, {
      props: {
        id: "underline-tabs",
        modelValue: "one",
        variant: "glass",
        type: "underline",
        items: [{ id: "one", label: "One", icon: Eye }],
      },
    });
    expect(underlineTabs.get('[data-balsa="tabs"]').attributes("data-variant")).toBe("glass");
    expect(underlineTabs.get('[data-balsa="tabs"]').attributes("data-type")).toBe("underline");
    expect(underlineTabs.get('[data-balsa="tabs"]').attributes("data-rounded")).toBe("none");
    expect(underlineTabs.get('[data-balsa="tabs-list"]').classes()).toEqual(expect.arrayContaining(["border-b", "backdrop-blur-md", "rounded-none"]));
    expect(underlineTabs.get('[role="tab"]').classes()).toEqual(expect.arrayContaining(["border-balsa-primary", "rounded-none"]));

    const customRoundedUnderline = mount(Tabs, {
      props: {
        id: "custom-rounded-underline-tabs",
        modelValue: "one",
        type: "underline",
        rounded: "lg",
        items: [{ id: "one", label: "One" }],
      },
    });
    expect(customRoundedUnderline.get('[data-balsa="tabs"]').attributes("data-rounded")).toBe("lg");
    expect(customRoundedUnderline.get('[data-balsa="tabs-list"]').classes()).toContain("rounded-none");

    const tileTabs = mount(Tabs, {
      props: {
        id: "tile-tabs",
        modelValue: "one",
        variant: "soft",
        type: "tiles",
        items: [{ id: "one", label: "One", icon: Shapes }],
      },
    });
    expect(tileTabs.get('[data-balsa="tabs-list"]').classes()).toContain("grid");
    expect(tileTabs.get('[role="tab"]').classes()).toEqual(expect.arrayContaining(["flex-col", "bg-balsa-primary/20"]));

    const codeBlock = mount(CodeBlock, {
      props: { code: "const value = true;", size: "lg", rounded: "none" },
    }).get('[data-balsa="code-block"]');
    expect(codeBlock.classes()).toContain("rounded-none");
    expect(codeBlock.attributes("data-size")).toBe("lg");
  });

  it("composes application Card regions without freezing the Card theme contract", () => {
    const wrapper = mount(ApplicationCard, {
      props: {
        title: "Workspace health",
        description: "Readiness for the next release.",
        headingLevel: 3,
      },
      slots: {
        action: "Inspect",
        default: "92%",
        footer: "Updated just now",
      },
    });
    const card = wrapper.get('[data-application-card]');

    expect(card.attributes("data-variant")).toBe("surface");
    expect(card.attributes("data-color")).toBe("neutral");
    expect(card.attributes("data-shadow")).toBe("auto");
    expect(card.classes()).not.toContain("rounded-2xl");
    expect(card.classes()).not.toContain("border");
    expect(wrapper.get("h3").text()).toBe("Workspace health");
    expect(wrapper.get("header").text()).toContain("Inspect");
    expect(wrapper.get("[data-application-card-body]").text()).toBe("92%");
    expect(wrapper.get("[data-application-card-footer]").classes()).not.toContain("border-t");
    expect(wrapper.get("[data-application-card-footer]").classes()).toContain("[border-top-width:var(--balsa-border-width)]");

    const overridden = mount(ApplicationCard, {
      props: {
        title: "Explicit task",
        variant: "elevated",
        size: "lg",
        rounded: "3xl",
        shadow: "lg",
        theme: "brutalism",
      },
    }).get('[data-application-card]');
    expect(overridden.attributes("data-theme")).toBe("brutalism");
    expect(overridden.attributes("data-variant")).toBe("elevated");
    expect(overridden.attributes("data-size")).toBe("lg");
    expect(overridden.attributes("data-shadow")).toBe("lg");
    expect(overridden.classes()).toContain("rounded-3xl");
  });

  it("supports Navbar materials, layouts, actions, and scroll behavior", async () => {
    const items = [{
      title: "Docs",
      link: "/docs",
      links: [{ title: "Introduction", link: "/docs/introduction" }],
    }] as const;
    const navbar = mount(Navbar, {
      props: {
        logo: { src: "/logo.svg", alt: "Placeholder logo", href: "/" },
        items,
        theme: "glassmorphism",
        color: "accent",
        behavior: "reveal",
        floatingLayout: "container",
        floatingMaxWidth: "90rem",
        contentMaxWidth: "90rem",
      },
      slots: { actions: "<button type=\"button\">Action placeholder</button>" },
    });
    const root = navbar.get('[data-balsa="navbar"]');
    expect(root.attributes("data-variant")).toBe("glass");
    expect(root.attributes("data-type")).toBe("floating");
    expect(root.attributes("data-behavior")).toBe("reveal");
    expect(root.attributes("data-floating-layout")).toBe("container");
    expect(root.attributes("data-items-alignment")).toBe("right");
    expect(root.attributes("style")).toContain("max-width: 90rem");
    expect(root.classes()).toEqual(expect.arrayContaining([
      "text-balsa-surface-elevated-foreground",
      "mt-4",
      "max-w-7xl",
      "-translate-x-1/2",
      "w-full",
    ]));
    expect(navbar.get('[data-balsa="navbar-surface"]').classes()).toEqual(expect.arrayContaining([
      "rounded-xl",
      "border-balsa-accent/30",
      "backdrop-blur-md",
      "shadow-balsa-control",
    ]));
    expect(navbar.get("nav").classes()).toEqual(expect.arrayContaining([
      "h-14",
      "px-4",
      "sm:px-6",
      "lg:px-8",
    ]));
    expect(navbar.get("nav ul").classes()).toContain("justify-end");
    expect(navbar.get("nav").attributes("style")).toContain("max-width: 90rem");
    await navbar.get("li").trigger("mouseenter");
    expect(navbar.get('[data-balsa="dropdown"]').classes()).toEqual(
      expect.arrayContaining([
        "left-0",
        "mt-2",
        "w-[min(22rem,calc(100vw-2rem))]",
        "border-balsa-accent/30",
        "backdrop-blur-md",
        "transition-[opacity,transform,visibility]",
        "opacity-100",
      ]),
    );
    expect(navbar.get('[data-balsa="dropdown"]').attributes("data-color")).toBe("accent");
    expect(navbar.text()).toContain("Action placeholder");

    Object.defineProperty(window, "scrollY", { configurable: true, value: 128 });
    window.dispatchEvent(new Event("scroll"));
    await flushPromises();
    expect(root.attributes("data-scroll-hidden")).toBe("true");

    Object.defineProperty(window, "scrollY", { configurable: true, value: 48 });
    window.dispatchEvent(new Event("scroll"));
    await flushPromises();
    expect(root.attributes("data-scroll-hidden")).toBe("false");

    const compatibilityNavbar = mount(Navbar, {
      props: {
        logo: { src: "/logo.svg", alt: "Placeholder logo", href: "/" },
        items,
        fixed: true,
      },
    }).get('[data-balsa="navbar"]');
    expect(compatibilityNavbar.attributes("data-behavior")).toBe("fixed");

    const defaultNavbar = mount(Navbar, {
      props: {
        logo: { src: "/logo.svg", alt: "Placeholder logo", href: "/" },
        items,
      },
    }).get('[data-balsa="navbar"]');
    expect(defaultNavbar.attributes("data-behavior")).toBe("reveal");

    const alignedBar = mount(Navbar, {
      props: {
        logo: { src: "/logo.svg", alt: "Placeholder logo", href: "/" },
        items,
        type: "bar",
        contentMaxWidth: "90rem",
      },
    });
    expect(alignedBar.get('[data-balsa="navbar"]').classes()).toEqual(
      expect.arrayContaining(["w-full", "inset-x-0"]),
    );
    expect(alignedBar.get("nav").attributes("style")).toContain("max-width: 90rem");

    const centeredItems = mount(Navbar, {
      props: {
        logo: { src: "/logo.svg", alt: "Placeholder logo", href: "/" },
        items,
        itemsAlignment: "center",
      },
    });
    expect(centeredItems.get('[data-balsa="navbar"]').attributes("data-items-alignment")).toBe("center");
    expect(centeredItems.get("nav ul").classes()).toContain("justify-center");

    const noActions = mount(Navbar, {
      props: {
        logo: { src: "/logo.svg", alt: "Placeholder logo", href: "/" },
        items,
      },
    });
    expect(noActions.find("nav > div.hidden.min-w-40").exists()).toBe(false);
    expect(noActions.get("nav ul").classes()).toContain("justify-end");
  });

  it("renders a compact anchored Dropdown in every supported material", () => {
    const dropdown = mount(Dropdown, {
      props: { open: true, variant: "glass", color: "accent", align: "center", width: "lg", rounded: "2xl", theme: "glassmorphism" },
      slots: { default: "Dropdown content placeholder" },
    }).get('[data-balsa="dropdown"]');

    expect(dropdown.attributes("data-state")).toBe("open");
    expect(dropdown.attributes("data-theme")).toBe("glassmorphism");
    expect(dropdown.attributes("data-color")).toBe("accent");
    expect(dropdown.attributes("data-align")).toBe("center");
    expect(dropdown.attributes("data-width")).toBe("lg");
    expect(dropdown.attributes("data-rounded")).toBe("2xl");
    expect(dropdown.classes()).toEqual(expect.arrayContaining([
      "left-1/2",
      "-translate-x-1/2",
      "rounded-2xl",
      "w-[min(28rem,calc(100vw-2rem))]",
      "border-balsa-accent/30",
      "backdrop-blur-md",
      "opacity-100",
    ]));
    expect(dropdown.classes()).not.toContain("shadow-balsa-panel");

    const closed = mount(Dropdown, {
      props: { open: false, variant: "outline", align: "end" },
    }).get('[data-balsa="dropdown"]');
    expect(closed.attributes("aria-hidden")).toBe("true");
    expect(closed.classes()).toEqual(expect.arrayContaining([
      "right-0",
      "pointer-events-none",
      "opacity-0",
      "bg-balsa-background/80",
    ]));

    const automatic = mount(Dropdown, {
      props: { open: true, align: "auto" },
    }).get('[data-balsa="dropdown"]');
    expect(automatic.attributes("data-align")).toBe("start");
    expect(automatic.classes()).toContain("left-0");
  });

  it("renders flexible footer navigation and configurable legal content", () => {
    const wrapper = mount(Footer, {
      props: {
        legalLogo: { title: "BALSA UI", alt: "Example UI", href: "/home" },
        leadTitle: "Example UI",
        description: "Open components for product teams.",
        navigationLabel: "Secondary navigation",
        sections: [
          { title: "Product", links: [{ title: "Components", link: "/components" }] },
          { title: "Company", links: [{ title: "About", link: "/about" }] },
        ],
        copyright: "© Example UI",
        legalText: "Built in the open.",
      },
    });

    const brand = wrapper.get('a[href="/home"]');
    expect(brand.attributes("aria-label")).toBe("Example UI");
    expect(brand.text()).toContain("BALSA UI");
    expect(brand.find("img").exists()).toBe(false);
    expect(wrapper.get('nav[aria-label="Secondary navigation"]')).toBeTruthy();
    expect(wrapper.text()).toContain("Product");
    expect(wrapper.text()).toContain("Company");
    expect(wrapper.text()).toContain("Built in the open.");
  });

  it("copies code and announces completion", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    const wrapper = mount(CodeBlock, {
      props: { code: "npm run build", language: "shell" },
    });
    const copyAction = wrapper.get('button[aria-label="Copy code"]');
    expect(copyAction.text()).toBe("");
    expect(copyAction.classes()).toEqual(expect.arrayContaining(["border-transparent", "bg-transparent"]));
    await copyAction.trigger("click");
    await Promise.resolve();
    expect(writeText).toHaveBeenCalledWith("npm run build");
    expect(wrapper.get('[aria-live="polite"]').text()).toBe(
      "Code copied to clipboard.",
    );
  });

  it("keeps code dark and renders highlighted source with optional visual line numbers", () => {
    const wrapper = mount(CodeBlock, {
      props: {
        code: 'import Button from "./Button.vue";\nconst count = 3;\nButton;',
        language: "typescript",
        lineNumbers: true,
      },
    });

    const block = wrapper.get('[data-balsa="code-block"]');
    expect(block.classes()).toContain("bg-balsa-code");
    expect(block.classes()).not.toContain("bg-balsa-inverse");
    expect(
      block.get("button").classes().some((className) => className.includes("!")),
    ).toBe(false);
    expect(block.get("[data-balsa-code-label]").text()).toBe("typescript");
    expect(block.findAll('[aria-hidden="true"]').slice(-3).map((line) =>
      line.text()
    )).toEqual(["1", "2", "3"]);
    expect(block.get(".hljs-keyword").text()).toBe("import");
    expect(block.get(".hljs-string").text()).toBe('"./Button.vue"');
    expect(block.get(".hljs-number").text()).toBe("3");
    expect(block.text()).toContain("const count");
  });

  it("collapses long code to the requested line count with an expandable fade", async () => {
    const wrapper = mount(CodeBlock, {
      props: {
        code: ["one", "two", "three", "four", "five", "six"].join("\n"),
        collapsedLines: 5,
        size: "sm",
      },
    });

    const preview = wrapper.get("pre");
    expect(preview.attributes("style")).toContain("max-height: 124px");
    expect(preview.attributes("style")).toContain("overflow-y: hidden");
    const expand = wrapper.get("[data-balsa-code-expand]");
    expect(expand.text()).toBe("See more");
    expect(expand.element.parentElement?.className).toContain("bg-gradient-to-t");

    await expand.trigger("click");
    expect(wrapper.get("pre").attributes("style")).toBeUndefined();
    expect(wrapper.find("[data-balsa-code-expand]").exists()).toBe(false);
    const collapse = wrapper.get("[data-balsa-code-collapse]");
    expect(collapse.text()).toBe("Show less");
    expect(collapse.classes()).toEqual(expect.arrayContaining(["border-transparent", "hover:underline"]));
    const headerActions = wrapper.get("[data-balsa-code-actions]").findAll("button");
    expect(headerActions.map((action) => action.attributes("data-balsa-code-collapse"))).toEqual(["", undefined]);

    await collapse.trigger("click");
    expect(wrapper.get("[data-balsa-code-expand]").text()).toBe("See more");

    await wrapper.setProps({ code: "one\ntwo" });
    expect(wrapper.find("[data-balsa-code-expand]").exists()).toBe(false);
  });

  it("closes a contained modal with Escape", async () => {
    const open = ref(true);
    const wrapper = mount(Modal, {
      props: {
        id: "confirm",
        title: "Confirm action",
        contained: true,
        modelValue: open.value,
        "onUpdate:modelValue": (value: boolean) => {
          open.value = value;
        },
      },
      slots: { default: "Continue?" },
    });
    expect(wrapper.get('[role="dialog"]').attributes("aria-labelledby")).toBe("confirm-title");
    await wrapper.get('[role="dialog"]').trigger("keydown", { key: "Escape" });
    expect(open.value).toBe(false);
  });

  it("renders Modal materials and leaves sheets without a bottom border", () => {
    const sheet = mount(Modal, {
      props: {
        id: "sheet-modal",
        title: "Sheet placeholder",
        modelValue: true,
        contained: true,
        presentation: "sheet",
        variant: "glass",
      },
    });
    const panel = sheet.get('[data-balsa="modal-panel"]');

    expect(panel.attributes("data-variant")).toBe("glass");
    expect(panel.classes()).toEqual(expect.arrayContaining([
      "bg-balsa-primary/10",
      "border-b-0",
    ]));

    const solid = mount(Modal, {
      props: {
        id: "solid-modal",
        title: "Solid placeholder",
        description: "Contrast placeholder",
        modelValue: true,
        contained: true,
        variant: "solid",
        color: "secondary",
      },
    });
    const solidPanel = solid.get('[data-balsa="modal-panel"]');
    expect(solidPanel.classes()).toEqual(expect.arrayContaining([
      "border-balsa-secondary",
      "bg-balsa-secondary",
      "text-balsa-secondary-foreground",
    ]));
    expect(solid.get("#solid-modal-title").classes()).toEqual(
      expect.arrayContaining(["font-balsa-title", "text-lg", "leading-none"]),
    );
    expect(solid.get("#solid-modal-description").classes()).toContain("text-current/80");

    const soft = mount(Modal, {
      props: {
        id: "soft-modal",
        title: "Soft placeholder",
        modelValue: true,
        contained: true,
        variant: "soft",
        color: "accent",
      },
    });
    const softPanel = soft.get('[data-balsa="modal-panel"]');
    expect(softPanel.classes()).toEqual(expect.arrayContaining([
      "bg-balsa-accent/15",
      "text-balsa-foreground",
    ]));
    expect(softPanel.classes()).not.toContain("backdrop-blur-md");
  });

  it("keeps Switch as the native boolean form control", async () => {
    const wrapper = mount(Switch, {
      props: {
        id: "setting-placeholder",
        label: "Setting placeholder",
        hint: "Helper placeholder.",
        name: "setting",
        required: true,
        modelValue: true,
      },
    });
    const input = wrapper.get('input[role="switch"]');

    expect(input.attributes("name")).toBe("setting");
    expect(input.attributes("required")).toBeDefined();
    expect(input.attributes("aria-describedby")).toBe("setting-placeholder-hint");
    expect(wrapper.get("label").attributes("data-balsa")).toBe("switch");
    await input.setValue(false);
    expect(wrapper.emitted("update:modelValue")?.at(-1)).toEqual([false]);
  });

  it("uses Toggle for native pressed-state actions", async () => {
    const wrapper = mount(Toggle, {
      props: {
        modelValue: true,
        variant: "glass",
        color: "accent",
        size: "lg",
        rounded: "full",
        prefixIcon: Bold,
        theme: "glassmorphism",
      },
      slots: { default: "Bold placeholder" },
    });
    const button = wrapper.get("button");

    expect(button.attributes("aria-pressed")).toBe("true");
    expect(button.attributes("data-state")).toBe("on");
    expect(button.attributes("data-theme")).toBe("glassmorphism");
    expect(button.classes()).toEqual(expect.arrayContaining([
      "bg-balsa-accent",
      "text-balsa-accent-foreground",
      "h-10",
      "rounded-full",
      "cursor-pointer",
    ]));
    expect(button.get('[data-balsa="icon"]').classes()).toContain("lucide-bold");
    await button.trigger("click");
    expect(wrapper.emitted("update:modelValue")?.at(-1)).toEqual([false]);
  });

  it("uses a stable paired Lucide icon in icon mode", async () => {
    const wrapper = mount(Toggle, {
      props: {
        modelValue: false,
        type: "icon",
        icon: "bookmark",
      },
      attrs: { "aria-label": "Save bookmark" },
    });
    const button = wrapper.get("button");

    expect(button.attributes("type")).toBe("button");
    expect(button.attributes("aria-label")).toBe("Save bookmark");
    expect(button.classes()).toEqual(expect.arrayContaining([
      "cursor-pointer",
      "bg-transparent",
      "h-8",
      "w-8",
    ]));
    expect(button.get('[data-balsa="icon"]').classes()).toContain("lucide-bookmark");

    await wrapper.setProps({ modelValue: true });

    expect(button.get('[data-balsa="icon"]').classes()).toContain("lucide-bookmark");
    expect(button.classes()).not.toContain("bg-balsa-primary");
  });

  it("supports single and multiple ToggleGroup models", async () => {
    const options = [
      { id: "left", label: "Left" },
      { id: "center", label: "Center" },
      { id: "right", label: "Right" },
    ];
    const single = mount(ToggleGroup, {
      props: {
        label: "Alignment",
        options,
        modelValue: "center",
      },
    });
    expect(single.get('[role="group"]').attributes("aria-label")).toBe("Alignment");
    expect(single.get('[role="group"]').classes()).toContain("cursor-pointer");
    expect(single.findAll("button")[1]?.attributes("aria-pressed")).toBe("true");
    await single.findAll("button")[0]?.trigger("click");
    expect(single.emitted("update:modelValue")?.at(-1)).toEqual(["left"]);

    const multiple = mount(ToggleGroup, {
      props: {
        label: "Formatting",
        options,
        type: "multiple",
        modelValue: ["center"],
      },
    });
    await multiple.findAll("button")[0]?.trigger("click");
    expect(multiple.emitted("update:modelValue")?.at(-1)).toEqual([
      ["center", "left"],
    ]);
  });

  it("moves ToggleGroup focus along its orientation and skips disabled items", async () => {
    const wrapper = mount(ToggleGroup, {
      attachTo: document.body,
      props: {
        label: "Alignment",
        modelValue: "left",
        options: [
          { id: "left", label: "Left" },
          { id: "center", label: "Center", disabled: true },
          { id: "right", label: "Right" },
        ],
      },
    });
    const buttons = wrapper.findAll("button");
    buttons[0]?.element.focus();
    await buttons[0]?.trigger("keydown", { key: "ArrowRight" });
    expect(document.activeElement).toBe(buttons[2]?.element);
    await buttons[2]?.trigger("keydown", { key: "Home" });
    expect(document.activeElement).toBe(buttons[0]?.element);
    wrapper.unmount();
  });

  it("links Collapsible disclosure semantics and fully retracts inert closed content", async () => {
    const wrapper = mount(Collapsible, {
      props: {
        id: "details-placeholder",
        title: "Details placeholder",
        modelValue: false,
        headingLevel: 4,
      },
      slots: { default: "<a href=\"#more\">More placeholder</a>" },
    });
    const trigger = wrapper.get('[data-balsa="collapsible-trigger"]');
    const content = wrapper.get('[data-balsa="collapsible-content"]');
    const presence = wrapper.get('[data-balsa="collapsible-presence"]');

    expect(wrapper.get("h4").exists()).toBe(true);
    expect(trigger.attributes()).toMatchObject({
      "aria-expanded": "false",
      "aria-controls": "details-placeholder-content",
    });
    expect(content.attributes()).toMatchObject({
      role: "region",
      "aria-labelledby": "details-placeholder-trigger",
    });
    expect(presence.attributes("aria-hidden")).toBe("true");
    expect(presence.attributes("inert")).toBeDefined();
    expect(wrapper.get("a").exists()).toBe(true);
    expect(wrapper.get('[data-balsa="collapsible"]').attributes("data-variant")).toBe("underline");
    expect(wrapper.get('[data-balsa="collapsible"]').classes()).toEqual(
      expect.not.arrayContaining(["overflow-hidden", "rounded-lg"]),
    );
    expect(content.classes()).toEqual(expect.not.arrayContaining(["border-t", "py-2.5"]));

    await trigger.trigger("click");
    expect(wrapper.emitted("update:modelValue")?.at(-1)).toEqual([true]);
    await wrapper.setProps({ modelValue: true });
    expect(content.classes()).toEqual(expect.arrayContaining(["py-2.5"]));
    expect(content.classes()).toEqual(expect.not.arrayContaining(["border-t"]));
  });

  it("coordinates Accordion single and multiple models", async () => {
    const items = [
      { id: "first", title: "First", content: "First content" },
      { id: "second", title: "Second", content: "Second content" },
    ];
    const single = mount(Accordion, {
      props: {
        id: "single-accordion",
        items,
        modelValue: "first",
        collapsible: false,
      },
    });
    expect(single.findAll('[data-balsa="collapsible"]')).toHaveLength(2);
    await single.findAll('[data-balsa="collapsible-trigger"]')[0]?.trigger("click");
    expect(single.emitted("update:modelValue")).toBeUndefined();

    await single.findAll('[data-balsa="collapsible-trigger"]')[1]?.trigger("click");
    expect(single.emitted("update:modelValue")?.at(-1)).toEqual(["second"]);

    const multiple = mount(Accordion, {
      props: {
        id: "multiple-accordion",
        items,
        type: "multiple",
        modelValue: ["first"],
      },
    });
    await multiple.findAll('[data-balsa="collapsible-trigger"]')[1]?.trigger("click");
    expect(multiple.emitted("update:modelValue")?.at(-1)).toEqual([
      ["first", "second"],
    ]);
  });

  it("renders Accordion underline items without a rounded or bordered collection surface", () => {
    const wrapper = mount(Accordion, {
      props: {
        id: "underline-accordion",
        items: [{ id: "first", title: "First", content: "First content" }],
        modelValue: "first",
        variant: "underline",
      },
    });
    const accordion = wrapper.get('[data-balsa="accordion"]');
    expect(accordion.attributes("data-variant")).toBe("underline");
    expect(accordion.classes()).toEqual(
      expect.not.arrayContaining(["overflow-hidden", "rounded-lg"]),
    );
    expect(wrapper.get('[data-balsa="collapsible-trigger"]').classes())
      .toEqual(expect.arrayContaining(["border-b"]));
  });

  it("moves Accordion focus with arrows and skips disabled triggers", async () => {
    const wrapper = mount(Accordion, {
      attachTo: document.body,
      props: {
        id: "keyboard-accordion",
        label: "Questions",
        modelValue: "",
        items: [
          { id: "first", title: "First" },
          { id: "second", title: "Second", disabled: true },
          { id: "third", title: "Third" },
        ],
      },
    });
    const triggers = wrapper.findAll('[data-balsa="collapsible-trigger"]');
    triggers[0]?.element.focus();
    await triggers[0]?.trigger("keydown", { key: "ArrowDown" });
    expect(document.activeElement).toBe(triggers[2]?.element);
    await triggers[2]?.trigger("keydown", { key: "Home" });
    expect(document.activeElement).toBe(triggers[0]?.element);
    await triggers[0]?.trigger("keydown", { key: "End" });
    expect(document.activeElement).toBe(triggers[2]?.element);
    wrapper.unmount();
  });

  it.each([
    ["modern-flat", "dark"],
    ["modern-flat", "light"],
    ["brutalism", "dark"],
    ["brutalism", "light"],
    ["glassmorphism", "dark"],
    ["glassmorphism", "light"],
  ] as const)("renders the Switch/Toggle family in %s with %s", (theme, palette) => {
    const switchControl = mount(Switch, {
      props: {
        id: `switch-${theme}-${palette}`,
        label: "Setting placeholder",
        theme,
      },
      attrs: { "data-palette": palette },
    });
    const toggle = mount(Toggle, {
      props: { modelValue: true, theme },
      attrs: { "data-palette": palette },
      slots: { default: "Action placeholder" },
    });
    const group = mount(ToggleGroup, {
      props: {
        label: "Group placeholder",
        options: [{ id: "one", label: "One" }],
        modelValue: "one",
        theme,
      },
      attrs: { "data-palette": palette },
    });

    expect(switchControl.get('[data-balsa="switch"]').attributes()).toMatchObject({
      "data-theme": theme,
      "data-palette": palette,
    });
    expect(toggle.get('[data-balsa="toggle"]').attributes()).toMatchObject({
      "data-theme": theme,
      "data-palette": palette,
    });
    expect(group.get('[data-balsa="toggle-group"]').attributes()).toMatchObject({
      "data-theme": theme,
      "data-palette": palette,
    });
    expect(group.get('[data-balsa="toggle"]').attributes("data-theme")).toBe(theme);
  });

  it.each([
    ["modern-flat", "dark"],
    ["modern-flat", "light"],
    ["brutalism", "dark"],
    ["brutalism", "light"],
    ["glassmorphism", "dark"],
    ["glassmorphism", "light"],
  ] as const)("renders the disclosure family in %s with %s", (theme, palette) => {
    const collapsible = mount(Collapsible, {
      props: {
        id: `collapsible-${theme}-${palette}`,
        title: "Details placeholder",
        modelValue: true,
        theme,
      },
      attrs: { "data-palette": palette },
      slots: { default: "Content placeholder" },
    });
    const accordion = mount(Accordion, {
      props: {
        id: `accordion-${theme}-${palette}`,
        label: "Questions placeholder",
        items: [{ id: "one", title: "One", content: "Content" }],
        modelValue: "one",
        theme,
      },
      attrs: { "data-palette": palette },
    });

    expect(collapsible.get('[data-balsa="collapsible"]').attributes()).toMatchObject({
      "data-theme": theme,
      "data-palette": palette,
      "data-state": "open",
    });
    expect(accordion.get('[data-balsa="accordion"]').attributes()).toMatchObject({
      "data-theme": theme,
      "data-palette": palette,
      "data-type": "single",
    });
    expect(
      accordion.get('[data-balsa="collapsible"]').attributes("data-theme"),
    ).toBe(theme);
  });

  it("renders Kbd chords as semantic key caps with one accessible name", () => {
    const defaultKbd = mount(Kbd, { slots: { default: "K" } });
    expect(defaultKbd.get("kbd").attributes("data-variant")).toBe("soft");
    expect(defaultKbd.get("kbd").classes()).toEqual(
      expect.arrayContaining(["bg-balsa-muted", "text-balsa-muted-foreground"]),
    );

    const wrapper = mount(Kbd, {
      props: {
        keys: ["Ctrl", "Shift", "P"],
        separator: "+",
        accessibleLabel: "Control plus Shift plus P",
        variant: "outline",
        size: "lg",
        rounded: "sm",
      },
    });
    const root = wrapper.get("kbd");

    expect(root.attributes("aria-label")).toBe("Control plus Shift plus P");
    expect(root.attributes("data-group")).toBe("true");
    expect(wrapper.findAll('[data-balsa="kbd-key"]').map((key) => key.text()))
      .toEqual(["Ctrl", "Shift", "P"]);
    expect(wrapper.findAll('[data-balsa="kbd-separator"]')).toHaveLength(2);
    expect(wrapper.findAll('[data-balsa="kbd-separator"]')[0]?.attributes("aria-hidden"))
      .toBe("true");
    expect(wrapper.get('[data-balsa="kbd-key"]').classes()).toEqual(
      expect.arrayContaining(["border-balsa-border-strong", "min-h-8", "rounded-sm"]),
    );
  });

  it("distinguishes decorative and semantic Separator output", () => {
    const decorative = mount(Separator, {
      props: { label: "Section placeholder" },
    });
    expect(decorative.get('[data-balsa="separator"]').attributes()).toMatchObject({
      role: "none",
      "aria-hidden": "true",
      "data-orientation": "horizontal",
    });
    expect(decorative.findAll('span[aria-hidden="true"]')).toHaveLength(2);

    const semantic = mount(Separator, {
      props: {
        orientation: "vertical",
        variant: "dashed",
        size: "md",
        decorative: false,
        accessibleLabel: "Toolbar boundary",
      },
    });
    expect(semantic.get('[data-balsa="separator"]').attributes()).toMatchObject({
      role: "separator",
      "aria-orientation": "vertical",
      "aria-label": "Toolbar boundary",
    });
    expect(semantic.get('[data-balsa="separator"]').classes()).toEqual(
      expect.arrayContaining(["border-l-2", "border-dashed"]),
    );
  });

  it("keeps Skeleton hidden from assistive technology and shapes text lines", () => {
    const wrapper = mount(Skeleton, {
      props: {
        shape: "text",
        lines: 3,
        size: "lg",
        animation: "wave",
        rounded: "xl",
      },
    });
    const root = wrapper.get('[data-balsa="skeleton"]');
    const lines = wrapper.findAll('[data-balsa="skeleton-piece"]');

    expect(root.attributes("aria-hidden")).toBe("true");
    expect(root.attributes("data-animation")).toBe("wave");
    expect(lines).toHaveLength(3);
    expect(lines[0]?.classes()).toEqual(expect.arrayContaining(["h-5", "w-full", "rounded-xl"]));
    expect(lines[2]?.classes()).toContain("w-3/4");
  });

  it("announces Spinner status once while supporting visible label placement", () => {
    const wrapper = mount(Spinner, {
      props: {
        label: "Loading placeholder",
        labelPosition: "bottom",
        color: "warning",
        size: "lg",
        speed: "slow",
      },
    });
    const status = wrapper.get('[role="status"]');
    const ring = wrapper.get('[data-balsa="spinner-ring"]');

    expect(status.attributes()).toMatchObject({
      "aria-label": "Loading placeholder",
      "aria-live": "polite",
      "data-label-position": "bottom",
    });
    expect(status.classes()).toEqual(expect.arrayContaining(["flex-col", "text-balsa-warning"]));
    expect(ring.classes()).toEqual(
      expect.arrayContaining(["size-10", "border-4", "[animation-duration:1.4s]"]),
    );
    expect(
      wrapper.get('[role="status"] > span:last-child').attributes("aria-hidden"),
    ).toBe("true");
  });

  it("normalizes determinate Progress and exposes formatted semantics", () => {
    const wrapper = mount(Progress, {
      props: {
        label: "Upload placeholder",
        value: 140,
        max: 120,
        variant: "striped",
        color: "success",
        formatValue: (value, max) => `${value} of ${max} files`,
      },
    });
    const root = wrapper.get('[data-balsa="progress"]');
    const bar = wrapper.get('[role="progressbar"]');
    const indicator = wrapper.get('[data-balsa="progress-indicator"]');

    expect(root.attributes("data-state")).toBe("complete");
    expect(bar.attributes()).toMatchObject({
      "aria-valuemin": "0",
      "aria-valuemax": "120",
      "aria-valuenow": "120",
      "aria-valuetext": "120 of 120 files",
    });
    expect(indicator.attributes("style")).toContain("width: 100%");
    expect(indicator.attributes("data-variant")).toBe("striped");
    expect(indicator.classes()).toContain("bg-balsa-success");
  });

  it("omits Progress current value while indeterminate", () => {
    const wrapper = mount(Progress, {
      props: {
        label: "Import placeholder",
        value: null,
        indeterminateLabel: "Preparing placeholder",
        showValue: false,
      },
    });
    const bar = wrapper.get('[role="progressbar"]');

    expect(wrapper.get('[data-balsa="progress"]').attributes("data-state"))
      .toBe("indeterminate");
    expect(bar.attributes("aria-valuenow")).toBeUndefined();
    expect(bar.attributes("aria-valuetext")).toBe("Preparing placeholder");
    expect(wrapper.text()).not.toContain("Preparing placeholder");
  });

  it("renders inline Alert semantics and supports explicit dismissal", async () => {
    const wrapper = mount(Alert, {
      props: {
        id: "inline-alert",
        title: "Information placeholder",
        description: "Lorem ipsum dolor sit amet.",
        color: "success",
        variant: "soft",
      },
    });
    const alert = wrapper.get('[data-balsa="alert"]');

    expect(alert.attributes()).toMatchObject({
      role: "alert",
      "data-mode": "inline",
      "data-color": "success",
      "aria-labelledby": "inline-alert-title",
      "aria-describedby": "inline-alert-description",
    });
    expect(alert.classes()).toEqual(
      expect.arrayContaining(["bg-balsa-success/15", "text-balsa-success", "rounded-lg"]),
    );
    expect(wrapper.get('[data-balsa="icon"]').classes()).toContain("lucide-circle-check-big");
    expect(wrapper.get("h3").classes()).toContain("m-0");
    expect(wrapper.get("[data-balsa-alert-close]").classes()).toEqual(
      expect.arrayContaining(["border-0", "size-8", "text-lg", "hover:bg-current/15"]),
    );
    await wrapper.get("[data-balsa-alert-close]").trigger("click");
    expect(wrapper.emitted("update:modelValue")?.[0]).toEqual([false]);
    expect(wrapper.emitted("dismiss")).toHaveLength(1);
  });

  it("keeps persistent Alerts visible and allows their status icon to be overridden", async () => {
    const wrapper = mount(Alert, {
      props: {
        id: "persistent-alert",
        title: "Persistent placeholder",
        persistent: true,
        icon: Bell,
      },
      slots: {
        actions: ({ close }) => h("button", { type: "button", onClick: close }, "Action"),
      },
    });

    expect(wrapper.get('[data-balsa="alert"]').attributes("data-color")).toBe("neutral");
    expect(wrapper.get('[data-balsa="icon"]').classes()).toContain("lucide-bell");
    expect(wrapper.find("[data-balsa-alert-close]").exists()).toBe(false);

    await wrapper.get("[data-balsa-alert-actions] button").trigger("click");
    expect(wrapper.emitted("update:modelValue")).toBeUndefined();
    expect(wrapper.emitted("dismiss")).toBeUndefined();
    expect(wrapper.find('[data-balsa="alert"]').exists()).toBe(true);
    expect(wrapper.get("[data-balsa-alert-actions]").classes()).toContain("justify-end");
  });

  it("uses native top-layer alertdialog behavior with deliberate dismissal", async () => {
    const originalShowModal = HTMLDialogElement.prototype.showModal;
    const originalClose = HTMLDialogElement.prototype.close;
    HTMLDialogElement.prototype.showModal = function showModal() {
      this.setAttribute("open", "");
    };
    HTMLDialogElement.prototype.close = function close() {
      this.removeAttribute("open");
      this.dispatchEvent(new Event("close"));
    };
    const trigger = document.createElement("button");
    document.body.append(trigger);
    trigger.focus();

    try {
      const wrapper = mount(Alert, {
        attachTo: document.body,
        props: {
          id: "decision-alert",
          title: "Decision placeholder",
          description: "Lorem ipsum dolor sit amet.",
          mode: "dialog",
          color: "destructive",
          modelValue: true,
          outsideDismiss: true,
          "onUpdate:modelValue": () => undefined,
        },
        slots: {
          actions: () => h("button", { type: "button" }, "Confirm placeholder"),
        },
      });
      await flushPromises();
      const dialog = wrapper.get("dialog");

      expect(dialog.attributes()).toMatchObject({
        open: "",
        role: "alertdialog",
        "aria-modal": "true",
        "data-color": "destructive",
      });
      expect(document.documentElement.style.overflow).toBe("hidden");
      expect(document.activeElement?.textContent).toBe("Confirm placeholder");

      await dialog.trigger("click", { clientX: -1, clientY: -1 });
      expect(wrapper.emitted("update:modelValue")?.at(-1)).toEqual([false]);
      expect(wrapper.emitted("dismiss")).toHaveLength(1);

      await wrapper.setProps({ modelValue: false });
      await flushPromises();
      expect(document.documentElement.style.overflow).toBe("");
      expect(document.activeElement).toBe(trigger);
      wrapper.unmount();
    } finally {
      HTMLDialogElement.prototype.showModal = originalShowModal;
      HTMLDialogElement.prototype.close = originalClose;
      trigger.remove();
      document.documentElement.style.overflow = "";
    }
  });

  it("keeps an uncontrolled Alert dialog closed and out of layout by default", () => {
    const wrapper = mount(Alert, {
      props: {
        id: "closed-alert",
        title: "Closed placeholder",
        mode: "dialog",
      },
    });
    const dialog = wrapper.get("dialog");

    expect(dialog.attributes("open")).toBeUndefined();
    expect(dialog.classes()).toEqual(expect.arrayContaining([
      "hidden",
      "fixed",
      "inset-0",
    ]));
  });

  it("gives Toast urgency-sensitive live semantics and explicit actions", async () => {
    const wrapper = mount(Toast, {
      props: {
        id: "destructive-toast",
        title: "Failure placeholder",
        description: "Lorem ipsum dolor sit amet.",
        color: "destructive",
        variant: "outline",
        icon: Bell,
        actionLabel: "Retry placeholder",
      },
    });
    const toast = wrapper.get('[data-balsa="toast"]');

    expect(toast.attributes()).toMatchObject({
      role: "alert",
      "aria-live": "assertive",
      "aria-atomic": "true",
      "data-color": "destructive",
    });
    expect(wrapper.get('[data-balsa="icon"]').classes()).toContain("lucide-bell");
    expect(wrapper.get("h3").classes()).toContain("m-0");
    expect(wrapper.get("[data-balsa-toast-close]").classes()).toEqual(
      expect.arrayContaining(["border-0", "size-8", "text-lg", "hover:bg-balsa-muted"]),
    );
    await wrapper.get("[data-balsa-toast-action] button").trigger("click");
    await wrapper.get("[data-balsa-toast-close]").trigger("click");
    expect(wrapper.emitted("action")).toHaveLength(1);
    expect(wrapper.emitted("dismiss")).toHaveLength(1);
  });

  it("defaults Toast to the primary status color", () => {
    const wrapper = mount(Toast, {
      props: {
        id: "primary-toast",
        title: "Primary placeholder",
      },
    });

    expect(wrapper.get('[data-balsa="toast"]').attributes("data-color")).toBe("primary");
  });

  it("keeps an empty ToastViewport mounted so its final toast can leave", () => {
    const wrapper = mount(ToastViewport, {
      props: {
        contained: true,
        modelValue: [],
        position: "top-end",
      },
    });

    const viewport = wrapper.get('[data-balsa="toast-viewport"]');
    expect(viewport.attributes("data-position")).toBe("top-end");
    expect(viewport.classes()).toContain("top-4");
    expect(viewport.classes()).not.toContain("bottom-4");
  });

  it("bounds ToastViewport rendering and dismisses the newest item with Escape", async () => {
    const items = ref<readonly ToastItem[]>([
      { id: "older", title: "Older placeholder", sticky: true },
      { id: "newest", title: "Newest placeholder", sticky: true },
    ]);
    const wrapper = mount({
      setup: () => () => h("div", { "data-theme": "glassmorphism", "data-palette": "light" }, [
        h(ToastViewport, {
          modelValue: items.value,
          "onUpdate:modelValue": (value: readonly ToastItem[]) => {
            items.value = value;
          },
          contained: true,
          limit: 1,
          position: "top-center",
        }),
      ]),
    }, { attachTo: document.body });
    await flushPromises();
    const viewport = wrapper.get('[data-balsa="toast-viewport"]');

    expect(viewport.attributes()).toMatchObject({
      "data-theme": "glassmorphism",
      "data-palette": "light",
      "data-position": "top-center",
      "aria-label": "Notifications",
    });
    expect(wrapper.findAll('[data-balsa="toast"]')).toHaveLength(1);
    expect(wrapper.get('[data-balsa="toast"]').text()).toContain("Newest placeholder");

    document.dispatchEvent(new KeyboardEvent("keydown", {
      key: "Escape",
      bubbles: true,
      cancelable: true,
    }));
    await flushPromises();
    expect(items.value.map(({ id }) => id)).toEqual(["older"]);
    wrapper.unmount();
  });

  it("pauses and resumes ToastViewport lifetimes during pointer interaction", async () => {
    vi.useFakeTimers();
    const items = ref<readonly ToastItem[]>([
      { id: "timed", title: "Timed placeholder", duration: 1000 },
    ]);
    try {
      const wrapper = mount({
        setup: () => () => h("div", { class: "relative" }, [
          h(ToastViewport, {
            modelValue: items.value,
            "onUpdate:modelValue": (value: readonly ToastItem[]) => {
              items.value = value;
            },
            contained: true,
          }),
        ]),
      });
      await vi.advanceTimersByTimeAsync(400);
      await wrapper.get('[data-balsa="toast-viewport"]').trigger("mouseenter");
      await vi.advanceTimersByTimeAsync(1000);
      expect(items.value).toHaveLength(1);

      await wrapper.get('[data-balsa="toast-viewport"]').trigger("mouseleave");
      await vi.advanceTimersByTimeAsync(600);
      await flushPromises();
      expect(items.value).toHaveLength(0);
      wrapper.unmount();
    } finally {
      vi.useRealTimers();
    }
  });

  it("keeps InputGroup as one labelled native control with visual addon ordering", async () => {
    const wrapper = mount(InputGroup, {
      props: {
        id: "address-group",
        label: "Address placeholder",
        modelValue: "",
        startText: "https://",
        endText: ".example",
        status: "unvalidated",
        statusMessage: "Address error placeholder",
        required: true,
      },
    });
    const input = wrapper.get("input");
    const group = input.element.parentElement!;

    expect(wrapper.get("label").attributes("for")).toBe("address-group");
    expect(input.attributes()).toMatchObject({
      required: "",
      "aria-invalid": "true",
      "aria-describedby": "address-group-status",
    });
    expect(Array.from(group.children).map((element) => element.tagName))
      .toEqual(["INPUT", "DIV", "DIV"]);
    expect(wrapper.get('[data-balsa="input-group-start"]').classes())
      .toContain("order-first");
    expect(wrapper.get('[role="alert"]').text()).toBe("Address error placeholder");

    await input.setValue("value-placeholder");
    expect(wrapper.emitted("update:modelValue")?.at(-1)).toEqual(["value-placeholder"]);
  });

  it("normalizes InputOTP as one field and emits completion", async () => {
    const wrapper = mount(InputOTP, {
      props: {
        id: "otp-code",
        label: "Code placeholder",
        modelValue: "",
        length: 6,
        separatorEvery: 3,
        "onUpdate:modelValue": () => undefined,
      },
    });
    const input = wrapper.get("input");

    expect(wrapper.findAll('[data-balsa="input-otp-cell"]')).toHaveLength(6);
    expect(input.attributes()).toMatchObject({
      inputmode: "numeric",
      autocomplete: "one-time-code",
      maxlength: "6",
    });
    expect(wrapper.findAll('span[aria-hidden="true"]').some(
      (element) => element.text() === "–",
    )).toBe(true);

    await input.setValue("12a34567");
    expect(wrapper.emitted("update:modelValue")?.at(-1)).toEqual(["123456"]);
    expect(wrapper.emitted("complete")?.at(-1)).toEqual(["123456"]);
  });

  it("defaults InputOTP to ungrouped cells and supports typed materials and colors", () => {
    const ungrouped = mount(InputOTP, {
      props: {
        id: "default-otp-code",
        label: "Code placeholder",
      },
    });

    expect(ungrouped.get('[data-balsa="input-otp"]').attributes("data-grouped")).toBeUndefined();
    expect(ungrouped.findAll('span[aria-hidden="true"]').some(
      (element) => element.text() === "â€“",
    )).toBe(false);

    const solid = mount(InputOTP, {
      props: {
        id: "solid-otp-code",
        label: "Code placeholder",
        grouped: true,
        separator: "|",
        variant: "solid",
        color: "accent",
      },
    });

    expect(solid.get('[data-balsa="input-otp"]').attributes()).toMatchObject({
      "data-grouped": "true",
      "data-variant": "solid",
      "data-color": "accent",
    });
    expect(solid.get('[data-balsa="input-otp-cell"]').classes()).toEqual(
      expect.arrayContaining(["bg-balsa-accent", "text-balsa-accent-foreground"]),
    );
    expect(solid.findAll('span[aria-hidden="true"]').some(
      (element) => element.text() === "|",
    )).toBe(true);

    const secondarySurface = mount(InputOTP, {
      props: {
        id: "secondary-surface-otp-code",
        label: "Code placeholder",
        color: "secondary",
      },
    });

    expect(secondarySurface.get('[data-balsa="input-otp-cell"]').classes()).toEqual(
      expect.arrayContaining(["border-balsa-secondary/30"]),
    );
    expect(secondarySurface.get('[data-balsa="input-otp-cell"]').classes())
      .not.toContain("border-balsa-input-border");
  });

  it("masks InputOTP visual cells without masking its native value", async () => {
    const wrapper = mount(InputOTP, {
      props: {
        id: "masked-code",
        label: "Masked code placeholder",
        modelValue: "A1B2",
        length: 4,
        mode: "alphanumeric",
        mask: true,
      },
    });

    expect(wrapper.get("input").element.value).toBe("A1B2");
    expect(wrapper.findAll('[data-balsa="input-otp-cell"]').map((cell) => cell.text()))
      .toEqual(["•", "•", "•", "•"]);
  });

  it("keeps RadioGroup native, labelled, color-configurable, exclusive, and explicitly invalid", async () => {
    const defaultGroup = mount(RadioGroup, {
      props: {
        id: "default-choice",
        label: "Choice placeholder",
        options: [{ value: "first", label: "Option placeholder 01" }],
      },
    });

    expect(defaultGroup.get('[data-balsa="radio-group"]').attributes()).toMatchObject({
      "data-layout": "column",
      "data-color": "primary",
    });

    const wrapper = mount(RadioGroup, {
      props: {
        id: "delivery-choice",
        label: "Choice placeholder",
        modelValue: "first",
        options: [
          { value: "first", label: "Option placeholder 01" },
          { value: "second", label: "Option placeholder 02", description: "Description placeholder." },
        ],
        layout: "cards",
        color: "accent",
        required: true,
        status: "unvalidated",
        statusMessage: "Choice error placeholder",
        "onUpdate:modelValue": () => undefined,
      },
    });
    const inputs = wrapper.findAll('input[type="radio"]');

    expect(wrapper.get("legend").text()).toContain("Choice placeholder");
    expect(wrapper.get('[data-balsa="radio-group"]').attributes("data-color")).toBe("accent");
    expect(wrapper.get('[data-balsa="radio-group-indicator"]').classes()).toEqual(
      expect.arrayContaining(["peer-checked:bg-balsa-accent"]),
    );
    expect(inputs).toHaveLength(2);
    expect(inputs.every((input) => input.attributes("name") === "delivery-choice")).toBe(true);
    expect(inputs.every((input) => input.attributes("required") === "")).toBe(true);
    expect(inputs[0]?.element.checked).toBe(true);
    expect(wrapper.get('[role="alert"]').text()).toBe("Choice error placeholder");

    await inputs[1]!.setValue(true);
    expect(wrapper.emitted("update:modelValue")?.at(-1)).toEqual(["second"]);
  });

  it("normalizes Slider single and range values through native range inputs", async () => {
    const single = mount(Slider, {
      props: {
        id: "volume-slider",
        label: "Volume placeholder",
        modelValue: 25,
        min: 0,
        max: 100,
        step: 5,
        "onUpdate:modelValue": () => undefined,
      },
    });
    const singleInput = single.get('input[type="range"]');

    expect(singleInput.attributes()).toMatchObject({
      min: "0",
      max: "100",
      step: "5",
      "aria-labelledby": "volume-slider-label",
      "aria-valuetext": "25",
    });
    await singleInput.setValue(45);
    expect(single.emitted("update:modelValue")?.at(-1)).toEqual([45]);

    const range = mount(Slider, {
      props: {
        id: "price-slider",
        label: "Range placeholder",
        modelValue: [20, 80],
        minStepsBetweenThumbs: 2,
        step: 5,
        "onUpdate:modelValue": () => undefined,
      },
    });
    const rangeInputs = range.findAll('input[type="range"]');

    expect(rangeInputs).toHaveLength(2);
    expect(rangeInputs[0]?.attributes("aria-label")).toBe("Range placeholder minimum");
    expect(rangeInputs[1]?.attributes("aria-label")).toBe("Range placeholder maximum");
    expect(rangeInputs[0]?.attributes("max")).toBe("70");
    expect(rangeInputs[1]?.attributes("min")).toBe("30");
    await rangeInputs[0]!.setValue(75);
    expect(range.emitted("update:modelValue")?.at(-1)).toEqual([[70, 80]]);

    const rangeControl = range.get('[data-balsa="slider-native"]').element.parentElement as HTMLElement;
    Object.defineProperty(rangeControl, "getBoundingClientRect", {
      value: () => ({ left: 0, right: 100, top: 0, bottom: 20, width: 100, height: 20 }),
    });
    const rangeThumbs = range.findAll('[data-balsa="slider-thumb"]');

    expect(rangeThumbs).toHaveLength(2);
    rangeThumbs[0]!.element.dispatchEvent(new MouseEvent("pointerdown", {
      bubbles: true,
      clientX: 40,
      clientY: 10,
    }));
    expect(range.emitted("update:modelValue")?.at(-1)).toEqual([[40, 80]]);
    rangeThumbs[1]!.element.dispatchEvent(new MouseEvent("pointerdown", {
      bubbles: true,
      clientX: 60,
      clientY: 10,
    }));
    expect(range.emitted("update:modelValue")?.at(-1)).toEqual([[20, 60]]);
  });

  it("opens and dismisses Popup with linked dialog semantics", async () => {
    const wrapper = mount(Popup, {
      props: {
        id: "settings-popup",
        label: "Settings placeholder",
        modelValue: false,
        contained: true,
        "onUpdate:modelValue": () => undefined,
      },
      slots: {
        trigger: "Open placeholder",
        default: "<button>Action placeholder</button>",
      },
    });

    await wrapper.get("button").trigger("click");
    await flushPromises();
    expect(wrapper.emitted("update:modelValue")?.at(-1)).toEqual([true]);
    await wrapper.setProps({ modelValue: true });
    await flushPromises();
    expect(wrapper.get('[role="dialog"]').attributes("aria-label")).toBe("Settings placeholder");
    expect(wrapper.get('[aria-haspopup="dialog"]').attributes("aria-expanded")).toBe("true");

    await wrapper.get('[role="dialog"]').trigger("keydown", { key: "Escape" });
    expect(wrapper.emitted("update:modelValue")?.at(-1)).toEqual([false]);
  });

  it("coordinates HoverCard open and close delays without moving focus", async () => {
    vi.useFakeTimers();
    try {
      const wrapper = mount(HoverCard, {
        props: {
          id: "summary-card",
          label: "Summary placeholder",
          openDelay: 100,
          closeDelay: 80,
          contained: true,
        },
        slots: { trigger: "Hover placeholder", default: "Preview placeholder" },
      });
      const trigger = wrapper.get('[tabindex="0"]');

      await trigger.trigger("mouseenter");
      await vi.advanceTimersByTimeAsync(100);
      await flushPromises();
      expect(wrapper.get('[role="tooltip"]').text()).toContain("Preview placeholder");
      expect(document.activeElement).not.toBe(wrapper.get('[role="tooltip"]').element);

      await trigger.trigger("mouseleave");
      await vi.advanceTimersByTimeAsync(80);
      await flushPromises();
      expect(wrapper.find('[role="tooltip"]').exists()).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });

  it("coordinates Tooltip delays with non-interactive described content", async () => {
    vi.useFakeTimers();
    try {
      const wrapper = mount(Tooltip, {
        props: {
          id: "more-information",
          label: "More information placeholder",
          side: "top",
          variant: "glass",
          rounded: "2xl",
          openDelay: 100,
          closeDelay: 80,
          contained: true,
        },
        slots: { trigger: "More information placeholder", default: "Tooltip content placeholder" },
      });
      const trigger = wrapper.get('[tabindex="0"]');

      await trigger.trigger("mouseenter");
      await vi.advanceTimersByTimeAsync(100);
      await flushPromises();
      const tooltip = wrapper.get('[role="tooltip"]');
      expect(tooltip.attributes("aria-label")).toBe("More information placeholder");
      expect(tooltip.classes()).toEqual(expect.arrayContaining(["pointer-events-none", "rounded-2xl"]));
      expect(document.activeElement).not.toBe(tooltip.element);
      expect(trigger.attributes("aria-describedby")).toBe("more-information");

      await trigger.trigger("mouseleave");
      await vi.advanceTimersByTimeAsync(80);
      await flushPromises();
      expect(wrapper.find('[role="tooltip"]').exists()).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });

  it("shares typed menu selection across Dropdown and Context Menu", async () => {
    const items = [
      { id: "edit", label: "Edit placeholder" },
      { id: "visible", label: "Visible placeholder", type: "checkbox" as const, checked: true },
    ];
    const dropdown = mount(DropdownMenu, {
      props: {
        id: "actions-menu",
        label: "Actions placeholder",
        items,
        color: "accent",
        rounded: "2xl",
        contained: true,
        "onUpdate:modelValue": () => undefined,
      },
      slots: { trigger: "Actions placeholder" },
    });

    await dropdown.get('[aria-haspopup="menu"]').trigger("click");
    await dropdown.setProps({ modelValue: true });
    await flushPromises();
    const menu = dropdown.get('[role="menu"]');
    expect(menu.attributes("aria-label")).toBe("Actions placeholder");
    expect(menu.attributes("data-color")).toBe("accent");
    expect(menu.attributes("data-rounded")).toBe("2xl");
    expect(menu.classes()).toEqual(expect.arrayContaining(["border-balsa-accent/30", "rounded-2xl"]));
    await dropdown.findAll('[role^="menuitem"]')[1]!.trigger("click");
    expect(dropdown.emitted("select")?.at(-1)).toEqual([{
      id: "visible",
      type: "checkbox",
      value: undefined,
      checked: false,
    }]);

    const context = mount(ContextMenu, {
      props: {
        id: "context-actions",
        label: "Context actions placeholder",
        items,
        color: "accent",
        rounded: "2xl",
        contained: true,
      },
      slots: { default: "Target placeholder" },
    });
    await context.get('[data-balsa="context-menu"]').trigger("contextmenu", {
      clientX: 20,
      clientY: 30,
    });
    await flushPromises();
    const contextMenu = context.get('[role="menu"]');
    expect(contextMenu.attributes("data-color")).toBe("accent");
    expect(contextMenu.attributes("data-rounded")).toBe("2xl");
    expect(contextMenu.classes()).toEqual(expect.arrayContaining(["border-balsa-accent/30", "rounded-2xl"]));
  });

  it("keeps contained Context Menus within their target bounds", async () => {
    const originalBounds = HTMLElement.prototype.getBoundingClientRect;
    const rect = (left: number, top: number, width: number, height: number) => ({
      left,
      top,
      width,
      height,
      right: left + width,
      bottom: top + height,
      x: left,
      y: top,
      toJSON: () => ({}),
    }) as DOMRect;
    const bounds = vi.spyOn(HTMLElement.prototype, "getBoundingClientRect")
      .mockImplementation(function (this: HTMLElement): DOMRect {
        if (this.dataset.balsa === "context-menu") return rect(100, 100, 200, 200);
        if (this.getAttribute("role") === "menu" || this.parentElement?.dataset.balsa === "context-menu") {
          return rect(0, 0, 160, 144);
        }
        return originalBounds.call(this);
      });

    try {
      const context = mount(ContextMenu, {
        props: {
          id: "contained-context",
          label: "Contained context placeholder",
          items: [{ id: "edit", label: "Edit placeholder" }],
          contained: true,
        },
        slots: { default: "Target placeholder" },
      });
      await context.get('[data-balsa="context-menu"]').trigger("contextmenu", {
        clientX: 290,
        clientY: 290,
      });
      await flushPromises();

      const layer = context.get('[role="menu"]').element.parentElement as HTMLElement;
      expect(layer.style.left).toBe("32px");
      expect(layer.style.top).toBe("48px");
    } finally {
      bounds.mockRestore();
    }
  });

  it("moves Menubar focus and filters Command Menu with native semantics", async () => {
    const menubar = mount(Menubar, {
      attachTo: document.body,
      props: {
        id: "editor-menu",
        label: "Editor menu placeholder",
        contained: true,
        menus: [
          { id: "file", label: "File placeholder", items: [{ id: "new", label: "New placeholder" }] },
          { id: "edit", label: "Edit placeholder", items: [{ id: "undo", label: "Undo placeholder" }] },
        ],
      },
    });
    const triggers = menubar.findAll('[role="menuitem"]');
    await triggers[0]!.trigger("keydown", { key: "ArrowRight" });
    expect(document.activeElement).toBe(triggers[1]!.element);

    const command = mount(CommandMenu, {
      props: {
        id: "commands",
        label: "Commands placeholder",
        size: "sm",
        groups: [
          { id: "navigation", label: "Navigation", items: [
            { id: "home", label: "Home placeholder" },
            { id: "docs", label: "Docs placeholder", keywords: ["guide"] },
          ] },
        ],
      },
    });
    expect(command.get('[data-balsa="command-menu"]').attributes("data-size")).toBe("sm");
    expect(command.get('[data-balsa="command-menu"] > div').classes()).toContain("max-w-md");
    expect(command.get('[data-balsa="command-list"]').attributes("data-dropdown")).toBe("true");
    expect(command.find('[role="listbox"]').exists()).toBe(false);
    const input = command.get('[role="combobox"]');
    await input.setValue("guide");
    const commandListbox = command.get('[role="listbox"]');
    expect(commandListbox.classes()).toEqual(expect.arrayContaining(["left-0", "right-0"]));
    expect(commandListbox.findAll('[role="option"]')).toHaveLength(1);
    expect(commandListbox.text()).toContain("Docs placeholder");
    await input.trigger("keydown", { key: "Escape" });
    expect(command.find('[role="listbox"]').exists()).toBe(false);
    await input.trigger("focus");
    expect(command.find('[role="listbox"]').exists()).toBe(true);
    await input.trigger("keydown", { key: "Enter" });
    expect(command.emitted("select")?.at(-1)?.[0]).toMatchObject({ id: "docs" });
    menubar.unmount();
    command.unmount();
  });

  it("renders Drawer as a labelled contained dialog and obeys dismissal", async () => {
    const wrapper = mount(Drawer, {
      props: {
        id: "task-drawer",
        title: "Task placeholder",
        description: "Description placeholder",
        modelValue: true,
        contained: true,
        "onUpdate:modelValue": () => undefined,
      },
      slots: { default: "Drawer body placeholder" },
    });
    await flushPromises();
    const dialog = wrapper.get("dialog");

    expect(dialog.attributes()).toMatchObject({
      role: "dialog",
      "aria-modal": "true",
      "aria-labelledby": "task-drawer-title",
      "aria-describedby": "task-drawer-description",
    });
    await wrapper.get('button[aria-label="Close drawer"]').trigger("click");
    expect(wrapper.emitted("update:modelValue")?.at(-1)).toEqual([false]);
    wrapper.unmount();

    const rightDrawer = mount(Drawer, {
      props: {
        id: "right-drawer",
        title: "Right placeholder",
        side: "right",
        modelValue: true,
        contained: true,
        showHandle: true,
        "onUpdate:modelValue": () => undefined,
      },
    });
    expect(rightDrawer.get("dialog").classes()).toEqual(
      expect.arrayContaining([
        "right-0",
        "left-auto",
        "top-0",
        "bottom-0",
        "border-r-0",
        "rounded-r-none",
      ]),
    );
    expect(rightDrawer.get('[aria-hidden="true"]').classes()).toEqual(
      expect.arrayContaining(["left-3", "top-1/2", "-translate-y-1/2"]),
    );
    rightDrawer.unmount();
  });

  it("keeps Avatar fallback resilient through image loading and error", async () => {
    const wrapper = mount(Avatar, {
      props: {
        src: "/avatar-placeholder.jpg",
        label: "Person Placeholder",
      },
    });
    expect(wrapper.get('[role="img"]').attributes("aria-label")).toBe("Person Placeholder");
    expect(wrapper.get('[data-balsa="avatar-fallback"]').text()).toBe("PP");
    await wrapper.get("img").trigger("load");
    expect(wrapper.find('[data-balsa="avatar-fallback"]').exists()).toBe(false);
    expect(wrapper.get('[data-balsa="avatar"]').attributes("data-load-state")).toBe("loaded");
    await wrapper.get("img").trigger("error");
    expect(wrapper.get('[data-balsa="avatar-fallback"]').text()).toBe("PP");
    expect(wrapper.emitted("loadState")?.at(-1)).toEqual(["error"]);
  });

  it("clamps Pagination and emits accessible page changes", async () => {
    const wrapper = mount(Pagination, {
      props: {
        modelValue: 4,
        total: 95,
        pageSize: 10,
      },
    });
    expect(wrapper.get('[aria-current="page"]').text()).toBe("4");
    await wrapper.get('button[aria-label="Next page"]').trigger("click");
    expect(wrapper.emitted("change")?.at(-1)).toEqual([5]);
    await wrapper.setProps({ total: 12 });
    expect(wrapper.emitted("update:modelValue")?.at(-1)).toEqual([2]);
    expect(wrapper.get('button[aria-label="Last page"]').attributes("disabled")).toBeDefined();
  });

  it("renders Pagination action-label and icon-only presentations without page numbers", async () => {
    const actionLabels = mount(Pagination, {
      props: {
        modelValue: 2,
        total: 30,
        pageSize: 10,
        presentation: "action-labels",
        previousLabel: "Previous article",
        nextLabel: "Next article",
      },
    });
    expect(actionLabels.get('[data-balsa="pagination"]').attributes("data-presentation")).toBe("action-labels");
    expect(actionLabels.text()).toContain("Previous article");
    expect(actionLabels.text()).toContain("Next article");
    expect(actionLabels.find('[aria-current="page"]').exists()).toBe(false);
    expect(actionLabels.find('[data-balsa="icon"]').exists()).toBe(false);
    await actionLabels.get('button[aria-label="Next article"]').trigger("click");
    expect(actionLabels.emitted("change")?.at(-1)).toEqual([3]);

    const icons = mount(Pagination, {
      props: {
        modelValue: 2,
        total: 30,
        pageSize: 10,
        presentation: "icons",
        previousLabel: "Previous article",
        nextLabel: "Next article",
      },
    });
    expect(icons.text()).not.toContain("Previous article");
    expect(icons.text()).not.toContain("Next article");
    expect(icons.findAll('[data-balsa="icon"]')).toHaveLength(2);
    expect(icons.find('[aria-current="page"]').exists()).toBe(false);
  });

  it("resizes panels with separator keyboard controls", async () => {
    const wrapper = mount(Resizable, {
      props: {
        id: "split-placeholder",
        label: "Resize placeholder panels",
        modelValue: 50,
        min: 20,
        max: 80,
        step: 10,
      },
      slots: { first: "First", second: "Second" },
    });
    const handle = wrapper.get('[role="separator"]');
    expect(handle.attributes("aria-valuenow")).toBe("50");
    await handle.trigger("keydown", { key: "ArrowRight" });
    expect(wrapper.emitted("update:modelValue")?.at(-1)).toEqual([60]);
    await wrapper.setProps({ modelValue: 60 });
    await handle.trigger("keydown", { key: "End" });
    expect(wrapper.emitted("resize")?.at(-1)).toEqual([80]);
  });

  it("keeps Scroll Area a labelled native viewport", async () => {
    const wrapper = mount(ScrollArea, {
      props: {
        label: "Items placeholder",
        orientation: "both",
        visibility: "hover",
        edgeFade: true,
      },
      slots: { default: "Scrollable content placeholder" },
    });
    const viewport = wrapper.get('[data-balsa="scroll-area-viewport"]');
    expect(viewport.attributes()).toMatchObject({
      role: "region",
      "aria-label": "Items placeholder",
      tabindex: "0",
    });
    await viewport.trigger("scroll");
    expect(wrapper.emitted("scroll")).toHaveLength(1);
    expect(wrapper.get('[data-balsa="scroll-area"]').attributes("data-edge-fade")).toBe("true");
  });

  it("opens and closes Preview fullscreen without changing the logical frame", async () => {
    const wrapper = mount(Preview, {
      props: { title: "Interface placeholder", viewport: "fixed", width: 390, height: 844 },
      slots: { default: "Preview content placeholder" },
    });
    expect(wrapper.get("iframe").attributes("title")).toBe("Interface placeholder");
    expect(wrapper.get("iframe").attributes("style")).toContain("width: 390px");
    const fullscreenButton = wrapper.get(
      'button[aria-label="Open fullscreen preview"]',
    );
    expect(fullscreenButton.attributes()).toMatchObject({
      "data-variant": "solid",
      "data-color": "primary",
    });
    expect(fullscreenButton.classes()).toEqual(
      expect.arrayContaining([
        "border-balsa-border",
        "bg-balsa-background/90",
        "text-balsa-foreground",
        "shadow-balsa-lg",
      ]),
    );
    expect(fullscreenButton.classes()).not.toContain("ring-2");
    await fullscreenButton.trigger("click");
    expect(document.body.querySelector('[data-balsa="preview-fullscreen"]')).not.toBeNull();
    document.body.querySelector<HTMLButtonElement>('button[aria-label="Close fullscreen preview"]')?.click();
    await flushPromises();
    expect(document.body.querySelector('[data-balsa="preview-fullscreen"]')).toBeNull();
  });

  it("scales an exact logical viewport inside a fluid aspect-ratio canvas", () => {
    const wrapper = mount(Preview, {
      props: {
        title: "Desktop interface placeholder",
        viewport: "fixed",
        width: 1600,
        height: 900,
        aspectRatio: 16 / 9,
        fullscreen: false,
      },
      slots: { default: "<div>Scrollable desktop content placeholder</div>" },
    });

    expect(
      wrapper.get<HTMLElement>('[data-balsa="preview-workbench"]').element.style
        .aspectRatio,
    ).toBe(String(16 / 9));
    expect(wrapper.get("iframe").attributes("style")).toContain("width: 1600px");
    expect(wrapper.get("iframe").attributes("style")).toContain("height: 900px");
    expect(wrapper.get("iframe").attributes("scrolling")).toBe("auto");
  });

  it("supports natural-height viewport presets and forwards frame scrolling", async () => {
    const scrollOwner = document.createElement("div");
    scrollOwner.dataset.balsaPreviewScrollOwner = "";
    document.body.append(scrollOwner);
    const wrapper = mount(Preview, {
      attachTo: scrollOwner,
      props: {
        title: "Natural interface placeholder",
        viewport: "desktop",
        autoHeight: true,
        fullscreen: false,
      },
      slots: {
        default: "<div>Natural preview content placeholder</div>",
      },
    });
    const preview = wrapper.get<HTMLElement>('[data-balsa="preview"]');
    const frame = wrapper.get<HTMLIFrameElement>("iframe");
    expect(preview.attributes()).toMatchObject({
      "data-viewport": "desktop",
      "data-auto-height": "true",
    });
    expect(preview.element.style.maxWidth).toBe("1600px");
    expect(frame.attributes("scrolling")).toBe("no");

    await frame.trigger("load");
    await flushPromises();
    expect(frame.element.contentDocument?.documentElement.style.overflow).toBe(
      "hidden",
    );
    frame.element.contentDocument?.dispatchEvent(
      new WheelEvent("wheel", {
        cancelable: true,
        deltaY: 180,
      }),
    );
    expect(wrapper.emitted("previewScroll")).toEqual([[180]]);
    expect(scrollOwner.scrollTop).toBe(180);

    await wrapper.setProps({ viewport: "mobile" });
    expect(preview.attributes("data-viewport")).toBe("mobile");
    expect(preview.element.style.maxWidth).toBe("390px");
    wrapper.unmount();
    scrollOwner.remove();
  });

  it("renders Carousel empty state without inactive controls", () => {
    const wrapper = mount(Carousel, {
      props: { items: [], label: "Cards placeholder" },
    });
    expect(wrapper.get('[data-balsa="carousel"]').attributes("aria-label")).toBe("Cards placeholder");
    expect(wrapper.text()).toContain("No carousel items.");
    expect(wrapper.find('button[aria-label="Next slide"]').exists()).toBe(false);
  });

  it("supports Carousel variants and inside navigation placement", () => {
    const Observer = class {
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
    };
    vi.stubGlobal("matchMedia", vi.fn(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
    })));
    vi.stubGlobal("IntersectionObserver", Observer);
    vi.stubGlobal("ResizeObserver", Observer);
    try {
      const wrapper = mount(Carousel, {
        props: {
          items: [
            { id: "one", label: "First placeholder" },
            { id: "two", label: "Second placeholder" },
          ],
          label: "Cards placeholder",
          variant: "glass",
          arrowsPosition: "inside",
          indicatorsPosition: "inside",
        },
      });

      expect(wrapper.get('[data-balsa="carousel"]').attributes("data-variant")).toBe("glass");
      expect(wrapper.get('[data-balsa="carousel-viewport"]').classes()).toContain("backdrop-blur-md");
      expect(wrapper.get('[data-balsa="carousel-slide"]').element.style.flexBasis).toContain("100%");
      expect(wrapper.get('[data-balsa="carousel-arrows"]').classes()).toContain("absolute");
      expect(wrapper.get('[data-balsa="carousel-indicators"]').classes()).toContain("absolute");
      wrapper.unmount();
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("navigates and loops Carousel with its Balsa engine", async () => {
    const items = [
      { id: "one", label: "First placeholder" },
      { id: "two", label: "Second placeholder" },
      { id: "three", label: "Third placeholder" },
    ];
    const wrapper = mount(Carousel, {
      props: { items, label: "Cards placeholder", loop: true },
    });
    await flushPromises();

    await wrapper.get('button[aria-label="Previous slide"]').trigger("click");
    expect(wrapper.get('button[aria-label^="Go to slide 3"]').attributes("aria-current")).toBe("true");
    expect(wrapper.emitted("select")?.at(-1)).toEqual([2, items[2]]);

    await wrapper.get('button[aria-label="Next slide"]').trigger("click");
    expect(wrapper.get('button[aria-label^="Go to slide 1"]').attributes("aria-current")).toBe("true");
    expect(wrapper.emitted("select")?.at(-1)).toEqual([0, items[0]]);

    await wrapper.get('button[aria-label^="Go to slide 2"]').trigger("click");
    expect(wrapper.get('button[aria-label^="Go to slide 2"]').attributes("aria-current")).toBe("true");
    wrapper.unmount();
  });

  it("snaps Carousel from pointer dragging and resists the first boundary", async () => {
    const items = [
      { id: "one", label: "First placeholder" },
      { id: "two", label: "Second placeholder" },
      { id: "three", label: "Third placeholder" },
    ];
    const wrapper = mount(Carousel, {
      props: { items, label: "Cards placeholder" },
    });
    const viewport = wrapper.get('[data-balsa="carousel-viewport"]');
    Object.defineProperty(viewport.element, "clientWidth", { configurable: true, value: 320 });
    window.dispatchEvent(new Event("resize"));
    await flushPromises();

    dispatchPointer(viewport.element, "pointerdown", { pointerId: 1, clientX: 250 });
    dispatchPointer(viewport.element, "pointermove", { pointerId: 1, clientX: 80 });
    dispatchPointer(viewport.element, "pointermove", { pointerId: 1, clientX: 80 });
    dispatchPointer(viewport.element, "pointerup", { pointerId: 1, clientX: 80 });
    await flushPromises();

    expect(wrapper.get('button[aria-label^="Go to slide 2"]').attributes("aria-current")).toBe("true");
    expect(wrapper.get('[data-balsa="carousel-track"]').element.getAttribute("style")).toContain("translate3d(-336px, 0, 0)");

    await wrapper.get('button[aria-label^="Go to slide 1"]').trigger("click");
    dispatchPointer(viewport.element, "pointerdown", { pointerId: 2, clientX: 80 });
    dispatchPointer(viewport.element, "pointermove", { pointerId: 2, clientX: 250 });
    dispatchPointer(viewport.element, "pointermove", { pointerId: 2, clientX: 250 });
    dispatchPointer(viewport.element, "pointerup", { pointerId: 2, clientX: 250 });
    await flushPromises();
    expect(wrapper.get('button[aria-label^="Go to slide 1"]').attributes("aria-current")).toBe("true");
    wrapper.unmount();
  });

  it("selects and collapses typed Sidebar navigation", async () => {
    const wrapper = mount(Sidebar, {
      props: {
        id: "workspace-sidebar",
        label: "Workspace placeholder",
        groups: [{ id: "main", items: [{ id: "overview", label: "Overview placeholder", icon: Home }] }],
      },
    });
    const destination = wrapper.findAll('[data-balsa="sidebar"] button').find((button) => button.text().includes("Overview"));
    await destination?.trigger("click");
    expect(wrapper.emitted("update:modelValue")?.at(-1)).toEqual(["overview"]);
    await wrapper.get('button[aria-label="Collapse sidebar"]').trigger("click");
    expect(wrapper.emitted("update:collapsed")?.at(-1)).toEqual([true]);
  });

  it("validates Attachment files and removes selected values", async () => {
    const wrapper = mount(Attachment, {
      props: { id: "files-placeholder", label: "Files placeholder", accept: ".pdf", maxSize: 10 },
    });
    const invalid = new File(["too large"], "image.png", { type: "image/png" });
    Object.defineProperty(wrapper.get('input[type="file"]').element, "files", { value: [invalid] });
    await wrapper.get('input[type="file"]').trigger("change");
    expect(wrapper.emitted("reject")?.at(-1)?.[0]).toEqual([
      expect.objectContaining({ file: invalid, reason: "type" }),
    ]);
    expect(wrapper.get('[role="alert"]').text()).toContain("unsupported type");
  });

  it("keeps Table loading and empty states inside semantic rows", () => {
    const loading = mount(Table, {
      props: { caption: "Rows placeholder", loading: true, columnCount: 3 },
    });
    expect(loading.get("caption").text()).toBe("Rows placeholder");
    expect(loading.get("td").attributes("colspan")).toBe("3");
    expect(loading.get('[role="status"]').exists()).toBe(true);
  });

  it("colors Table headers and rows independently", () => {
    const wrapper = mount(Table, {
      props: {
        caption: "Rows placeholder",
        headerColor: "success",
        rowColor: "info",
      },
      slots: {
        header: "<thead><tr><th scope=\"col\">Name placeholder</th></tr></thead>",
        default: "<tbody><tr><td>Value placeholder</td></tr></tbody>",
      },
    });

    expect(wrapper.get('[data-balsa="table"]').attributes()).toMatchObject({
      "data-header-color": "success",
      "data-row-color": "info",
    });
    expect(wrapper.get("table").classes()).toEqual(expect.arrayContaining([
      "[&_thead_th]:bg-balsa-success/15",
      "[&_tbody_tr]:bg-balsa-info/10",
      "[&_tbody_tr:hover]:bg-balsa-info/20",
    ]));
  });

  it("selects Calendar dates and opens DatePicker through Popup", async () => {
    const calendar = mount(Calendar, {
      props: { id: "calendar-placeholder", label: "Date placeholder", month: new Date(2026, 6, 1) },
    });
    const day = calendar.get('button[aria-label*="July 25, 2026"]');
    await day.trigger("click");
    expect(calendar.emitted("update:modelValue")?.at(-1)?.[0]).toEqual(new Date(2026, 6, 25));

    const picker = mount(DatePicker, {
      props: {
        id: "date-placeholder",
        label: "Date placeholder",
        name: "dueDate",
        modelValue: new Date(2026, 6, 25),
        required: true,
        status: "unvalidated",
        theme: "glassmorphism",
      },
    });
    const trigger = picker.get('[aria-haspopup="dialog"]');
    expect(trigger.attributes()).toMatchObject({
      "aria-labelledby": "date-placeholder-label",
      "aria-describedby": "date-placeholder-error",
      "aria-invalid": "true",
      "aria-required": "true",
    });
    expect(picker.get('input[type="hidden"]').attributes()).toMatchObject({
      name: "dueDate",
      value: "2026-07-25",
    });
    await trigger.trigger("click");
    await flushPromises();
    expect(document.body.querySelector('[data-balsa="calendar"]')).not.toBeNull();
    expect(document.body.querySelector('[data-balsa="popup-panel"]')?.getAttribute("data-theme"))
      .toBe("glassmorphism");
    picker.unmount();
  });

  it("keeps Calendar roving focus valid across constraints and month paging", async () => {
    const wrapper = mount(Calendar, {
      attachTo: document.body,
      props: {
        id: "keyboard-calendar",
        label: "Keyboard date placeholder",
        month: new Date(2026, 0, 1),
        min: new Date(2026, 0, 15),
        max: new Date(2026, 1, 28),
        disabledDates: (date: Date) => date.getMonth() === 0 && date.getDate() === 16,
      },
    });

    expect(wrapper.get('button[aria-label="Previous month"]').attributes("disabled"))
      .toBeDefined();
    const first = wrapper.get('button[aria-label*="January 15, 2026"]');
    expect(first.attributes("tabindex")).toBe("0");
    await first.trigger("keydown", { key: "ArrowRight" });
    await flushPromises();
    expect((document.activeElement as HTMLElement | null)?.getAttribute("aria-label"))
      .toContain("January 17, 2026");

    const monthEnd = wrapper.get('button[aria-label*="January 31, 2026"]');
    monthEnd.element.focus();
    await monthEnd.trigger("keydown", { key: "PageDown" });
    await flushPromises();
    expect((document.activeElement as HTMLElement | null)?.getAttribute("aria-label"))
      .toContain("February 28, 2026");
    wrapper.unmount();
  });

  it("fully implements Calendar multiple and range models", async () => {
    const multiple = mount(Calendar, {
      props: {
        id: "multiple-calendar",
        label: "Multiple dates placeholder",
        mode: "multiple",
        month: new Date(2026, 6, 1),
      },
    });
    await multiple.get('button[aria-label*="July 10, 2026"]').trigger("click");
    await multiple.get('button[aria-label*="July 12, 2026"]').trigger("click");
    expect(multiple.emitted("update:modelValue")?.at(-1)?.[0]).toEqual([
      new Date(2026, 6, 10),
      new Date(2026, 6, 12),
    ]);

    const range = mount(Calendar, {
      props: {
        id: "range-calendar",
        label: "Date range placeholder",
        mode: "range",
        month: new Date(2026, 6, 1),
      },
    });
    await range.get('button[aria-label*="July 10, 2026"]').trigger("click");
    await range.get('button[aria-label*="July 15, 2026"]').trigger("click");
    expect(range.emitted("update:modelValue")?.at(-1)?.[0]).toEqual({
      start: new Date(2026, 6, 10),
      end: new Date(2026, 6, 15),
    });
  });

  it("sorts and filters DataTable through controlled state events", async () => {
    const wrapper = mount(DataTable, {
      props: {
        id: "results-placeholder",
        caption: "Results placeholder",
        columns: [{ id: "name", label: "Name placeholder", sortable: true, filterable: true }],
        data: [{ id: "b", name: "Beta placeholder" }, { id: "a", name: "Alpha placeholder" }],
        rowKey: "id",
        selection: "multiple",
      },
    });
    await wrapper.get("thead button").trigger("click");
    expect(wrapper.emitted("update:sort")?.at(-1)).toEqual([{ column: "name", direction: "asc" }]);
    expect(wrapper.get('th[aria-sort="ascending"]').exists()).toBe(true);
    await wrapper.get('input[aria-label="Select row a"]').setValue(true);
    expect(wrapper.emitted("update:selected")?.at(-1)).toEqual([["a"]]);
    expect(wrapper.find('thead input[type="search"]').exists()).toBe(false);
    const filterAction = wrapper.get("[data-balsa-data-table-filter-action]");
    expect(filterAction.classes()).toEqual(expect.arrayContaining([
      "min-h-8",
      "border-balsa-border",
      "bg-balsa-surface",
    ]));
    expect(filterAction.get('[data-balsa="icon"]').classes()).toContain("lucide-search");
    await filterAction.trigger("click");
    expect(wrapper.get('[data-balsa="data-table-filter-menu"]').attributes("role")).toBe("dialog");
    expect(wrapper.get('[data-balsa="data-table-filter-menu"] [data-balsa="select"]').exists()).toBe(true);
    await wrapper.get('#results-placeholder-filter-query').setValue("alpha");
    await wrapper.get('[data-balsa="data-table-filter-menu"] form').trigger("submit");
    expect(wrapper.emitted("update:filters")?.at(-1)).toEqual([{ name: "alpha" }]);
    expect(wrapper.get('[data-balsa="data-table-filter-menu"]').text()).toContain("Advanced filters");
  });

  it("passes independent DataTable header and row colors to Table", () => {
    const wrapper = mount(DataTable, {
      props: {
        id: "colored-results",
        caption: "Results placeholder",
        columns: [{ id: "name", label: "Name placeholder" }],
        data: [{ id: "row-1", name: "Row placeholder" }],
        rowKey: "id",
        headerColor: "success",
        rowColor: "info",
      },
    });

    expect(wrapper.get('[data-balsa="data-table"]').attributes()).toMatchObject({
      "data-header-color": "success",
      "data-row-color": "info",
    });
    expect(wrapper.get('[data-balsa="table"]').attributes()).toMatchObject({
      "data-header-color": "success",
      "data-row-color": "info",
    });
  });

  it("renders Charts error and accessible semantic data alternatives", () => {
    const wrapper = mount(Charts, {
      props: {
        title: "Metrics placeholder",
        labels: ["Alpha placeholder"],
        series: [{ label: "Series placeholder", data: [12], color: "primary" }],
        error: "Chart error placeholder.",
      },
    });
    expect(wrapper.get("figcaption").text()).toContain("Metrics placeholder");
    expect(wrapper.get('[role="alert"]').text()).toBe("Chart error placeholder.");
    expect(wrapper.get("table").text()).toContain("Alpha placeholder");
  });

  it("keeps Charts bare and forwards semantic configuration, geometry, and type changes", async () => {
    const wrapper = mount(Charts, {
      props: {
        title: "Metrics placeholder",
        labels: ["Alpha placeholder"],
        series: [{ label: "Series placeholder", data: [12] }],
        colors: ["success"],
        rounded: "xl",
      },
    });
    const root = wrapper.get('[data-balsa="charts"]');

    expect(root.attributes("data-responsive")).toBe("true");
    expect(root.attributes("data-type")).toBe("bar");
    expect(root.attributes("data-bar-mode")).toBe("grouped");
    expect(root.classes()).not.toEqual(expect.arrayContaining(["border", "bg-balsa-surface", "p-5", "rounded-lg"]));

    await wrapper.setProps({ type: "doughnut", barMode: "stacked" });
    expect(root.attributes("data-type")).toBe("donut");
    expect(root.attributes("data-bar-mode")).toBe("stacked");
  });

  it.each([
    ["modern-flat", "dark"],
    ["modern-flat", "light"],
    ["brutalism", "dark"],
    ["brutalism", "light"],
    ["glassmorphism", "dark"],
    ["glassmorphism", "light"],
  ] as const)("renders compact feedback utilities in %s with %s", (theme, palette) => {
    const attrs = { "data-palette": palette };
    const kbd = mount(Kbd, {
      props: { keys: ["K"], theme },
      attrs,
    });
    const separator = mount(Separator, {
      props: { theme },
      attrs,
    });
    const skeleton = mount(Skeleton, {
      props: { theme },
      attrs,
    });
    const spinner = mount(Spinner, {
      props: { theme },
      attrs,
    });
    const progress = mount(Progress, {
      props: { label: "Progress placeholder", value: 50, theme },
      attrs,
    });
    const alert = mount(Alert, {
      props: {
        id: `alert-${theme}-${palette}`,
        title: "Alert placeholder",
        theme,
      },
      attrs,
    });
    const toast = mount(Toast, {
      props: {
        id: `toast-${theme}-${palette}`,
        title: "Toast placeholder",
        theme,
      },
      attrs,
    });
    const inputGroup = mount(InputGroup, {
      props: {
        id: `input-group-${theme}-${palette}`,
        label: "Group placeholder",
        theme,
      },
      attrs,
    });
    const inputOTP = mount(InputOTP, {
      props: {
        id: `input-otp-${theme}-${palette}`,
        label: "OTP placeholder",
        theme,
      },
      attrs,
    });
    const radioGroup = mount(RadioGroup, {
      props: {
        id: `radio-group-${theme}-${palette}`,
        label: "Choice placeholder",
        options: [{ value: "first", label: "Option placeholder" }],
        theme,
      },
      attrs,
    });
    const slider = mount(Slider, {
      props: {
        id: `slider-${theme}-${palette}`,
        label: "Range placeholder",
        theme,
      },
      attrs,
    });
    const popup = mount(Popup, {
      props: { id: `popup-${theme}-${palette}`, label: "Popup placeholder", theme },
      attrs,
    });
    const hoverCard = mount(HoverCard, {
      props: { id: `hover-card-${theme}-${palette}`, label: "Hover placeholder", theme },
      attrs,
    });
    const tooltip = mount(Tooltip, {
      props: { id: `tooltip-${theme}-${palette}`, label: "Tooltip placeholder", theme },
      attrs,
    });
    const dropdownMenu = mount(DropdownMenu, {
      props: { id: `dropdown-menu-${theme}-${palette}`, label: "Menu placeholder", items: [], theme },
      attrs,
    });
    const contextMenu = mount(ContextMenu, {
      props: { id: `context-menu-${theme}-${palette}`, label: "Context placeholder", items: [], theme },
      attrs,
    });
    const menubar = mount(Menubar, {
      props: { id: `menubar-${theme}-${palette}`, label: "Menubar placeholder", menus: [], theme },
      attrs,
    });
    const commandMenu = mount(CommandMenu, {
      props: { id: `command-menu-${theme}-${palette}`, label: "Commands placeholder", groups: [], theme },
      attrs,
    });
    const drawer = mount(Drawer, {
      props: { id: `drawer-${theme}-${palette}`, title: "Drawer placeholder", theme },
      attrs,
    });
    const avatar = mount(Avatar, {
      props: { label: "Person placeholder", theme },
      attrs,
    });
    const pagination = mount(Pagination, {
      props: { total: 20, theme },
      attrs,
    });
    const resizable = mount(Resizable, {
      props: { id: `resizable-${theme}-${palette}`, label: "Resize placeholder", theme },
      attrs,
    });
    const scrollArea = mount(ScrollArea, {
      props: { label: "Scroll placeholder", theme },
      attrs,
    });
    const preview = mount(Preview, {
      props: { title: "Preview placeholder", fullscreen: false, theme },
      attrs,
    });
    const carousel = mount(Carousel, {
      props: { items: [], label: "Carousel placeholder", theme },
      attrs,
    });
    const sidebar = mount(Sidebar, {
      props: { id: `sidebar-${theme}-${palette}`, label: "Sidebar placeholder", groups: [], theme },
      attrs,
    });
    const attachment = mount(Attachment, {
      props: { id: `attachment-${theme}-${palette}`, label: "Files placeholder", theme },
      attrs,
    });
    const table = mount(Table, {
      props: { caption: "Rows placeholder", empty: true, theme },
      attrs,
    });
    const calendar = mount(Calendar, {
      props: { id: `calendar-${theme}-${palette}`, label: "Date placeholder", theme },
      attrs,
    });
    const datePicker = mount(DatePicker, {
      props: { id: `date-picker-${theme}-${palette}`, label: "Date placeholder", theme },
      attrs,
    });
    const dataTable = mount(DataTable, {
      props: { id: `data-table-${theme}-${palette}`, caption: "Rows placeholder", columns: [], data: [], rowKey: "id", theme },
      attrs,
    });
    const charts = mount(Charts, {
      props: { title: "Metrics placeholder", labels: [], series: [], theme },
      attrs,
    });

    for (const [wrapper, hook] of [
      [kbd, "kbd"],
      [separator, "separator"],
      [skeleton, "skeleton"],
      [spinner, "spinner"],
      [progress, "progress"],
      [alert, "alert"],
      [toast, "toast"],
      [inputGroup, "input-group"],
      [inputOTP, "input-otp"],
      [radioGroup, "radio-group"],
      [slider, "slider"],
      [popup, "popup"],
      [hoverCard, "hover-card"],
      [tooltip, "tooltip"],
      [dropdownMenu, "dropdown-menu"],
      [contextMenu, "context-menu"],
      [menubar, "menubar"],
      [commandMenu, "command-menu"],
      [drawer, "drawer"],
      [avatar, "avatar"],
      [pagination, "pagination"],
      [resizable, "resizable"],
      [scrollArea, "scroll-area"],
      [preview, "preview"],
      [carousel, "carousel"],
      [sidebar, "sidebar"],
      [attachment, "attachment"],
      [table, "table"],
      [calendar, "calendar"],
      [datePicker, "date-picker"],
      [dataTable, "data-table"],
      [charts, "charts"],
    ] as const) {
      expect(wrapper.get(`[data-balsa="${hook}"]`).attributes()).toMatchObject({
        "data-theme": theme,
        "data-palette": palette,
      });
    }
  });

  it("renders PropertySelect as a menu row or a forwarding row for a trailing control", async () => {
    const menu = mount(PropertySelect, {
      props: {
        id: "radius",
        label: "Radius",
        value: "Large",
        items: [{ id: "large", type: "action", label: "Large" }],
      },
      attachTo: document.body,
    });
    const trigger = menu.get("#radius-trigger");
    expect(trigger.text()).toContain("Radius");
    expect(trigger.text()).toContain("Large");
    // Geometry follows the live control-radius token, not a fixed corner.
    expect(trigger.classes()).toContain("rounded-balsa-control");
    expect(trigger.classes()).not.toContain("rounded-lg");
    // The row itself is unpadded so a trailing control can meet its border;
    // the caption and the default icon carry their own insets instead.
    expect(trigger.classes()).toEqual(expect.arrayContaining(["p-0", "gap-0"]));
    expect(trigger.classes()).not.toContain("px-3");
    expect(trigger.classes()).not.toContain("py-1.5");
    expect(trigger.get("span").classes()).toEqual(expect.arrayContaining(["py-2", "pl-3"]));
    menu.unmount();

    const clicks: string[] = [];
    const row = mount(PropertySelect, {
      props: { id: "primary", label: "Primary", value: "#1d4ed8" },
      slots: {
        trailing: '<div data-trailing><button type="button" data-swatch>swatch</button><div data-popover><span data-inside>inside</span></div></div>',
      },
      attachTo: document.body,
    });
    expect(row.get("[data-balsa='property-select']").classes())
      .toEqual(expect.arrayContaining(["p-0", "gap-0"]));
    const swatch = row.get("[data-swatch]");
    swatch.element.addEventListener("click", () => clicks.push("swatch"));

    // Clicking the quiet part of the row acts on the trailing control.
    await row.get("strong").trigger("click");
    expect(clicks).toEqual(["swatch"]);

    // Anything the trailing control owns handles its own clicks, so a popover
    // rendered inside it does not toggle the control straight back shut.
    await row.get("[data-inside]").trigger("click");
    expect(clicks).toEqual(["swatch"]);
    await swatch.trigger("click");
    expect(clicks).toEqual(["swatch", "swatch"]);

    row.unmount();
  });
});
