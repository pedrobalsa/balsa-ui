import { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it } from "vitest";
import { Input } from "../src/components/ui/Input";

describe("Input", () => {
  it("renders a labelled control", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);

    await act(async () => {
      root.render(<Input id="project-name" label="Project name" />);
    });

    const input = host.querySelector("input");
    expect(input?.id).toBe("project-name");
    expect(host.querySelector("label")?.getAttribute("for")).toBe("project-name");

    root.unmount();
    host.remove();
  });
});
