<script setup lang="ts">
import { ref } from "vue";
import Accordion from "./components/ui/Accordion.vue";
import Alert from "./components/ui/Alert.vue";
import Attachment from "./components/ui/Attachment.vue";
import Calendar, { type CalendarModelValue } from "./components/ui/Calendar.vue";
import Charts from "./components/ui/Charts.vue";
import Avatar from "./components/ui/Avatar.vue";
import Breadcrumb from "./components/ui/Breadcrumb.vue";
import Carousel from "./components/ui/Carousel.vue";
import Collapsible from "./components/ui/Collapsible.vue";
import CommandMenu from "./components/ui/CommandMenu.vue";
import type { CommandGroup } from "./components/ui/command";
import ContextMenu from "./components/ui/ContextMenu.vue";
import DataTable from "./components/ui/DataTable.vue";
import DatePicker from "./components/ui/DatePicker.vue";
import Drawer from "./components/ui/Drawer.vue";
import DropdownMenu from "./components/ui/DropdownMenu.vue";
import GradientBackground from "./components/ui/GradientBackground.vue";
import HoverCard from "./components/ui/HoverCard.vue";
import Input from "./components/ui/Input.vue";
import InputGroup from "./components/ui/InputGroup.vue";
import InputOTP from "./components/ui/InputOTP.vue";
import Kbd from "./components/ui/Kbd.vue";
import Menubar, { type MenubarMenu } from "./components/ui/Menubar.vue";
import type { MenuItem } from "./components/ui/menu";
import Popup from "./components/ui/Popup.vue";
import Pagination from "./components/ui/Pagination.vue";
import Preview from "./components/ui/Preview.vue";
import Progress from "./components/ui/Progress.vue";
import RadioGroup from "./components/ui/RadioGroup.vue";
import Resizable from "./components/ui/Resizable.vue";
import ScrollArea from "./components/ui/ScrollArea.vue";
import Sidebar from "./components/ui/Sidebar.vue";
import Separator from "./components/ui/Separator.vue";
import Skeleton from "./components/ui/Skeleton.vue";
import Spinner from "./components/ui/Spinner.vue";
import Slider from "./components/ui/Slider.vue";
import Switch from "./components/ui/Switch.vue";
import Table from "./components/ui/Table.vue";
import Toggle from "./components/ui/Toggle.vue";
import ToggleGroup from "./components/ui/ToggleGroup.vue";
import ToastViewport, {
  type ToastItem,
} from "./components/ui/ToastViewport.vue";

const name = ref("");
const address = ref("");
const code = ref("");
const choice = ref("first");
const range = ref<[number, number]>([25, 75]);
const popupOpen = ref(false);
const dropdownOpen = ref(false);
const contextOpen = ref(false);
const openMenu = ref<string | null>(null);
const commandOpen = ref(false);
const commandQuery = ref("");
const drawerOpen = ref(false);
const enabled = ref(true);
const bold = ref(false);
const alignment = ref("left");
const detailsOpen = ref(true);
const openQuestion = ref<string | readonly string[]>("first");
const page = ref(2);
const split = ref(45);
const activeDestination = ref("overview");
const files = ref<readonly File[]>([]);
const calendarDate = ref<CalendarModelValue>(null);
const notifications = ref<readonly ToastItem[]>([
  {
    id: "notification-placeholder",
    title: "Notification placeholder",
    sticky: true,
  },
]);
const questionItems = [
  { id: "first", title: "Question placeholder 01", content: "Lorem ipsum dolor sit amet." },
  { id: "second", title: "Question placeholder 02", content: "Consectetur adipiscing elit." },
];
const alignmentOptions = [
  { id: "left", label: "Left placeholder" },
  { id: "center", label: "Center placeholder" },
];
const breadcrumbItems = [
  { label: "Docs", href: "/docs" },
  { label: "Components", href: "/docs/components" },
  { label: "Input" },
];
const choiceOptions = [
  { value: "first", label: "Option placeholder 01" },
  { value: "second", label: "Option placeholder 02" },
];
const menuItems: readonly MenuItem[] = [
  { id: "edit", label: "Edit placeholder" },
  { id: "visible", label: "Visible placeholder", type: "checkbox", checked: true },
];
const menubarMenus: readonly MenubarMenu[] = [
  { id: "file", label: "File placeholder", items: menuItems },
];
const commandGroups: readonly CommandGroup[] = [
  { id: "actions", label: "Actions placeholder", items: [{ id: "create", label: "Create placeholder" }] },
];
</script>

<template>
  <main class="relative isolate min-h-screen overflow-hidden">
    <GradientBackground preset="obsidian-fold" paused />
    <div class="relative z-10">
      <Breadcrumb :items="breadcrumbItems" />
      <Input id="name" v-model="name" label="Name" />
      <InputGroup
        id="address"
        v-model="address"
        label="Address placeholder"
        start-text="https://"
      />
      <InputOTP
        id="code"
        v-model="code"
        label="Code placeholder"
        :separator-every="3"
      />
      <RadioGroup
        id="choice"
        v-model="choice"
        label="Choice placeholder"
        :options="choiceOptions"
      />
      <Slider
        id="range"
        v-model="range"
        label="Range placeholder"
      />
      <Popup id="popup" v-model="popupOpen" label="Popup placeholder">
        <template #trigger>Open popup placeholder</template>
        Popup content placeholder
      </Popup>
      <HoverCard id="hover" label="Hover placeholder">
        <template #trigger>Hover placeholder</template>
        Hover content placeholder
      </HoverCard>
      <DropdownMenu
        id="dropdown-menu"
        v-model="dropdownOpen"
        label="Actions placeholder"
        :items="menuItems"
      />
      <ContextMenu
        id="context-menu"
        v-model="contextOpen"
        label="Context placeholder"
        :items="menuItems"
      >
        Context target placeholder
      </ContextMenu>
      <Menubar
        id="menubar"
        v-model="openMenu"
        label="Menubar placeholder"
        :menus="menubarMenus"
      />
      <CommandMenu
        id="commands"
        v-model="commandOpen"
        v-model:query="commandQuery"
        label="Commands placeholder"
        :groups="commandGroups"
      />
      <Drawer id="drawer" v-model="drawerOpen" title="Drawer placeholder">
        Drawer content placeholder
      </Drawer>
      <Switch id="enabled" v-model="enabled" label="Setting placeholder" />
      <Toggle v-model="bold">Bold placeholder</Toggle>
      <ToggleGroup
        v-model="alignment"
        :options="alignmentOptions"
        label="Alignment placeholder"
      />
      <Collapsible
        id="details-placeholder"
        v-model="detailsOpen"
        title="Details placeholder"
      >
        Lorem ipsum dolor sit amet.
      </Collapsible>
      <Accordion
        id="questions-placeholder"
        v-model="openQuestion"
        :items="questionItems"
      />
      <p>Press <Kbd :keys="['Ctrl', 'K']" accessible-label="Control plus K" /></p>
      <Avatar label="Person placeholder" fallback="PP" />
      <Pagination v-model="page" :total="120" />
      <Resizable
        id="workspace-placeholder"
        v-model="split"
        label="Resize placeholder panels"
        class="h-64"
      >
        <template #first>First panel placeholder</template>
        <template #second>Second panel placeholder</template>
      </Resizable>
      <ScrollArea label="Items placeholder" class="h-48">
        <div class="h-96">Scrollable content placeholder</div>
      </ScrollArea>
      <Preview title="Interface placeholder" :fullscreen="false">
        Preview content placeholder
      </Preview>
      <Carousel
        label="Cards placeholder"
        :items="[{ id: 'first', label: 'Card placeholder' }]"
      />
      <Sidebar
        id="workspace-sidebar-placeholder"
        v-model="activeDestination"
        label="Workspace placeholder"
        :groups="[{ id: 'main', items: [{ id: 'overview', label: 'Overview placeholder' }] }]"
      />
      <Attachment id="files-placeholder" v-model="files" label="Files placeholder" />
      <Table caption="Rows placeholder">
        <template #header><thead><tr><th scope="col">Name placeholder</th></tr></thead></template>
        <tbody><tr><th scope="row">Row placeholder</th></tr></tbody>
      </Table>
      <Calendar id="calendar-placeholder" v-model="calendarDate" label="Date placeholder" />
      <DatePicker id="date-placeholder" v-model="calendarDate" label="Date placeholder" />
      <DataTable
        id="rows-placeholder"
        caption="Rows placeholder"
        :columns="[{ id: 'name', label: 'Name placeholder', sortable: true }]"
        :data="[{ id: 'first', name: 'Row placeholder' }]"
        row-key="id"
      />
      <Charts
        title="Metrics placeholder"
        :labels="['Alpha placeholder']"
        :series="[{ label: 'Series placeholder', data: [12], color: 'primary' }]"
      />
      <Separator label="Section placeholder" />
      <div aria-busy="true" aria-label="Loading content placeholder">
        <Skeleton shape="text" :lines="3" />
      </div>
      <Spinner label="Loading placeholder" label-position="right" />
      <Progress label="Upload placeholder" :value="58" />
      <Alert
        id="feedback-placeholder"
        title="Information placeholder"
        description="Lorem ipsum dolor sit amet."
      />
      <ToastViewport v-model="notifications" contained />
    </div>
  </main>
</template>
