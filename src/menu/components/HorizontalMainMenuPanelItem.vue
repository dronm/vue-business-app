<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";

import { mainMenuItemIcon, mainMenuItemMatchesRoute } from "../presentation";
import type { MainMenuForUser } from "../types";

const props = withDefaults(
  defineProps<{
    item: MainMenuForUser;
    depth?: number;
  }>(),
  {
    depth: 0,
  },
);

const emit = defineEmits<{
  navigate: [];
}>();

const route = useRoute();
const children = computed(() => props.item.children ?? []);
const hasChildren = computed(() => children.value.length > 0);
const isCurrentRoute = computed(() => {
  return Boolean(props.item.route) && route.name === props.item.route;
});
const isActiveBranch = computed(() => {
  return mainMenuItemMatchesRoute(props.item, route.name);
});
const itemIcon = computed(() => mainMenuItemIcon(props.item));
</script>

<template>
  <li>
    <RouterLink
      v-if="props.item.route"
      :to="{ name: props.item.route }"
      :class="[
        'group flex min-h-10 items-center gap-3 rounded-xl px-3 py-2 text-sm transition focus:outline-none focus:ring-4 focus:ring-cyan-500/15',
        isCurrentRoute
          ? 'bg-cyan-50 font-semibold text-cyan-800 ring-1 ring-cyan-100'
          : 'text-slate-700 hover:bg-slate-100 hover:text-slate-950',
      ]"
      @click="emit('navigate')"
    >
      <span
        :class="[
          'pi w-5 shrink-0 text-center text-sm',
          itemIcon,
          isCurrentRoute
            ? 'text-cyan-600'
            : 'text-slate-400 group-hover:text-cyan-600',
        ]"
      />
      <span class="min-w-0 flex-1 truncate">
        {{ props.item.caption }}
      </span>
      <span
        v-if="isCurrentRoute"
        class="h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-500"
      />
    </RouterLink>

    <div
      v-else
      :class="[
        'flex items-center gap-3 px-3 pb-1 pt-3 text-[0.7rem] font-bold uppercase tracking-[0.14em]',
        isActiveBranch ? 'text-cyan-700' : 'text-slate-400',
      ]"
    >
      <span :class="['pi w-5 text-center text-xs', itemIcon]" />
      <span>{{ props.item.caption }}</span>
    </div>

    <ul
      v-if="hasChildren"
      :class="[
        'space-y-1',
        props.depth > 0 ? 'ml-5 border-l border-slate-200 pl-2' : '',
      ]"
    >
      <HorizontalMainMenuPanelItem
        v-for="child in children"
        :key="`${child.caption}-${child.route || 'group'}`"
        :item="child"
        :depth="props.depth + 1"
        @navigate="emit('navigate')"
      />
    </ul>
  </li>
</template>
