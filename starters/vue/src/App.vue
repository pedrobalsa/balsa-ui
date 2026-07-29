<script setup lang="ts">
import { ref } from "vue";
import Breadcrumb from "./components/ui/Breadcrumb.vue";
import Input from "./components/ui/Input.vue";

const projectName = ref("");
const breadcrumbItems = [
  { label: "Workspace", href: "#workspace" },
  { label: "New project" },
];
</script>

<template>
  <main class="mx-auto max-w-5xl px-6 py-12">
    <header class="border-b border-balsa-border pb-8">
      <Breadcrumb :items="breadcrumbItems" />
      <h1 class="mt-4">Build from readable source</h1>
      <p class="mt-3 max-w-3xl text-balsa-muted-foreground">
        This starter includes the Balsa architecture, palette, tooling, and editable components.
      </p>
    </header>
    <section class="mt-12 max-w-xl rounded-balsa-surface bg-balsa-surface p-6 text-balsa-surface-foreground shadow-balsa-surface">
      <Input
        id="project-name"
        v-model="projectName"
        label="Project name"
        placeholder="My Vue application"
        required
      />
    </section>
  </main>
</template>
