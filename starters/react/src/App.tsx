import { useState } from "react";
import { ApplicationCard } from "./components/compositions/ApplicationCard";
import { Input } from "./components/ui/Input";

export function App() {
  const [projectName, setProjectName] = useState("");

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <header className="border-b border-balsa-border pb-8">
        <h1 className="mt-4">Build from readable source</h1>
        <p className="mt-3 max-w-3xl text-balsa-muted-foreground">
          This starter includes the Balsa architecture, palette, tooling, and editable components.
        </p>
      </header>
      <section className="mt-12 max-w-xl">
        <ApplicationCard title="New project" description="Name the application this starter will grow into.">
          <Input
            id="project-name"
            label="Project name"
            placeholder="My React application"
            required
            value={projectName}
            onValueChange={(value) => setProjectName(String(value))}
          />
        </ApplicationCard>
      </section>
    </main>
  );
}
