<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from "vue";
import { RouterLink, useRoute, type RouteLocationRaw } from "vue-router";

import { useBusinessApp } from "../../core/runtime";
import type { AppBranding } from "../../core/types";
import { useBusinessAppI18n } from "../../i18n/useBusinessAppI18n";
import {
  flattenMainMenuRoutes,
  mainMenuItemIcon,
  mainMenuItemMatchesRoute,
} from "../presentation";
import type { MainMenuForUser } from "../types";
import HorizontalMainMenuPanelItem from "./HorizontalMainMenuPanelItem.vue";

const props = withDefaults(
  defineProps<{
    menu: MainMenuForUser[];
    userName?: string | null;
    menuError?: string | null;
    branding?: AppBranding;
    brandRoute?: RouteLocationRaw | null;
    canViewProfile?: boolean;
    canManageMenu?: boolean;
    canViewApplicationRoutes?: boolean;
    sticky?: boolean;
  }>(),
  {
    userName: null,
    menuError: null,
    brandRoute: null,
    canViewProfile: false,
    canManageMenu: false,
    canViewApplicationRoutes: false,
    sticky: true,
  },
);

const emit = defineEmits<{
  profile: [];
  about: [];
  constructor: [];
  allRoutes: [];
  logout: [];
}>();

const runtime = useBusinessApp();
const route = useRoute();
const { t } = useBusinessAppI18n();

const rootElement = ref<HTMLElement | null>(null);
const searchInput = ref<HTMLInputElement | null>(null);
const activeRootId = ref<number | null>(null);
const searchOpen = ref(false);
const userMenuOpen = ref(false);
const mobileOpen = ref(false);
const searchText = ref("");

const branding = computed<AppBranding>(() => {
  return props.branding ?? runtime.config.branding;
});

const brandMark = computed(() => {
  const fallbackMark = branding.value.fallbackMark;
  if (typeof fallbackMark === "string" && fallbackMark.trim()) {
    return fallbackMark.trim().slice(0, 2).toUpperCase();
  }

  const title = branding.value.title.trim();
  return title ? title.charAt(0).toUpperCase() : "A";
});

const userInitials = computed(() => {
  const name = props.userName?.trim();
  if (!name) {
    return "U";
  }

  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
});

const routeEntries = computed(() => flattenMainMenuRoutes(props.menu));
const normalizedSearch = computed(() =>
  searchText.value.trim().toLocaleLowerCase(),
);
const searchResults = computed(() => {
  const query = normalizedSearch.value;
  const results =
    query === ""
      ? routeEntries.value
      : routeEntries.value.filter((entry) => {
          return `${entry.caption} ${entry.breadcrumb}`
            .toLocaleLowerCase()
            .includes(query);
        });

  return results.slice(0, 20);
});

const closeDesktopPopovers = (): void => {
  activeRootId.value = null;
  searchOpen.value = false;
  userMenuOpen.value = false;
};

const closeAllMenus = (): void => {
  closeDesktopPopovers();
  mobileOpen.value = false;
};

const toggleRoot = (item: MainMenuForUser): void => {
  searchOpen.value = false;
  userMenuOpen.value = false;
  activeRootId.value = activeRootId.value === item.id ? null : item.id;
};

const toggleSearch = async (): Promise<void> => {
  activeRootId.value = null;
  userMenuOpen.value = false;
  searchOpen.value = !searchOpen.value;
  if (searchOpen.value) {
    await nextTick();
    searchInput.value?.focus();
  }
};

const toggleUserMenu = (): void => {
  activeRootId.value = null;
  searchOpen.value = false;
  userMenuOpen.value = !userMenuOpen.value;
};

const toggleMobile = (): void => {
  closeDesktopPopovers();
  mobileOpen.value = !mobileOpen.value;
};

const emitAction = (
  action: "profile" | "about" | "constructor" | "allRoutes" | "logout",
): void => {
  closeAllMenus();
  switch (action) {
    case "profile":
      emit("profile");
      break;
    case "about":
      emit("about");
      break;
    case "constructor":
      emit("constructor");
      break;
    case "allRoutes":
      emit("allRoutes");
      break;
    case "logout":
      emit("logout");
      break;
  }
};

const handleDocumentPointerDown = (event: PointerEvent): void => {
  const target = event.target;
  if (!(target instanceof Node) || rootElement.value?.contains(target)) {
    return;
  }
  closeDesktopPopovers();
};

const handleDocumentKeydown = (event: KeyboardEvent): void => {
  if (event.key === "Escape") {
    closeAllMenus();
  }
};

onMounted(() => {
  document.addEventListener("pointerdown", handleDocumentPointerDown);
  document.addEventListener("keydown", handleDocumentKeydown);
});

onBeforeUnmount(() => {
  document.removeEventListener("pointerdown", handleDocumentPointerDown);
  document.removeEventListener("keydown", handleDocumentKeydown);
});

watch(
  () => route.fullPath,
  () => {
    closeAllMenus();
  },
);
</script>

<template>
  <header
    ref="rootElement"
    :class="[
      'z-50 border-b border-slate-800/80 bg-slate-950 text-white shadow-[0_12px_40px_-22px_rgba(15,23,42,0.9)]',
      props.sticky ? 'sticky top-0' : 'relative',
    ]"
  >
    <div class="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        class="absolute -left-20 -top-24 h-56 w-56 rounded-full bg-cyan-500/15 blur-3xl"
      />
      <div
        class="absolute right-1/4 top-0 h-32 w-64 rounded-full bg-blue-600/10 blur-3xl"
      />
    </div>

    <div class="relative flex h-16 items-center gap-3 px-3 sm:px-4 lg:px-5">
      <component
        :is="props.brandRoute ? RouterLink : 'div'"
        :to="props.brandRoute || undefined"
        class="group flex min-w-0 shrink-0 items-center gap-3 rounded-xl focus:outline-none focus:ring-4 focus:ring-cyan-400/15"
        @click="closeAllMenus"
      >
        <img
          v-if="branding.logoUrl"
          :src="branding.logoUrl"
          :alt="branding.logoAlt || branding.title"
          class="h-10 w-10 rounded-xl bg-white/95 object-contain p-1 shadow-lg shadow-black/20"
        />
        <div
          v-else
          class="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 via-sky-500 to-blue-600 text-sm font-black tracking-wide text-white shadow-lg shadow-cyan-950/50 ring-1 ring-white/15 transition group-hover:scale-[1.03]"
        >
          {{ brandMark }}
        </div>

        <div class="hidden min-w-0 sm:block">
          <div class="truncate text-sm font-bold tracking-wide text-white">
            {{ branding.title }}
          </div>
          <div
            v-if="branding.subtitle"
            class="truncate text-[0.68rem] font-medium uppercase tracking-[0.12em] text-slate-400"
          >
            {{ branding.subtitle }}
          </div>
        </div>
      </component>

      <div class="mx-1 hidden h-7 w-px shrink-0 bg-slate-800 lg:block" />

      <nav class="hidden min-w-0 flex-1 items-center gap-1 lg:flex">
        <div
          v-for="item in props.menu"
          :key="item.id"
          class="relative shrink-0"
        >
          <RouterLink
            v-if="item.route && !item.children?.length"
            :to="{ name: item.route }"
            :class="[
              'flex h-9 items-center gap-2 rounded-lg px-3 text-xs font-semibold transition focus:outline-none focus:ring-4 focus:ring-cyan-400/15',
              route.name === item.route
                ? 'bg-white/12 text-white ring-1 ring-white/10'
                : 'text-slate-300 hover:bg-white/[0.07] hover:text-white',
            ]"
          >
            <span
              :class="['pi text-xs text-cyan-400', mainMenuItemIcon(item)]"
            />
            <span>{{ item.caption }}</span>
          </RouterLink>

          <button
            v-else
            type="button"
            :class="[
              'flex h-9 items-center gap-2 rounded-lg px-3 text-xs font-semibold transition focus:outline-none focus:ring-4 focus:ring-cyan-400/15',
              mainMenuItemMatchesRoute(item, route.name) ||
              activeRootId === item.id
                ? 'bg-white/12 text-white ring-1 ring-white/10'
                : 'text-slate-300 hover:bg-white/[0.07] hover:text-white',
            ]"
            :aria-expanded="activeRootId === item.id"
            @click.stop="toggleRoot(item)"
          >
            <span
              :class="['pi text-xs text-cyan-400', mainMenuItemIcon(item)]"
            />
            <span>{{ item.caption }}</span>
            <span
              :class="[
                'pi pi-chevron-down text-[0.6rem] text-slate-500 transition-transform',
                activeRootId === item.id ? 'rotate-180' : '',
              ]"
            />
          </button>

          <Transition
            enter-active-class="transition duration-150 ease-out"
            enter-from-class="-translate-y-1 opacity-0"
            leave-active-class="transition duration-100 ease-in"
            leave-to-class="-translate-y-1 opacity-0"
          >
            <div
              v-if="activeRootId === item.id"
              class="absolute left-0 top-[calc(100%+0.75rem)] z-50 w-[22rem] overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 text-slate-900 shadow-2xl shadow-slate-950/20 ring-1 ring-black/5"
            >
              <div
                class="mb-1 flex items-center gap-3 rounded-xl bg-gradient-to-r from-slate-50 to-cyan-50/70 px-3 py-3"
              >
                <div
                  class="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-cyan-300 shadow-sm"
                >
                  <span :class="['pi text-sm', mainMenuItemIcon(item)]" />
                </div>
                <div class="min-w-0">
                  <div class="truncate text-sm font-bold text-slate-900">
                    {{ item.caption }}
                  </div>
                  <div
                    class="text-[0.68rem] uppercase tracking-[0.12em] text-slate-400"
                  >
                    {{ t("menu.sectionTitle") }}
                  </div>
                </div>
              </div>

              <ul class="max-h-[65vh] space-y-1 overflow-y-auto py-1">
                <HorizontalMainMenuPanelItem
                  v-if="item.route"
                  :item="{ ...item, children: null }"
                  @navigate="closeAllMenus"
                />
                <HorizontalMainMenuPanelItem
                  v-for="child in item.children ?? []"
                  :key="child.id"
                  :item="child"
                  @navigate="closeAllMenus"
                />
              </ul>
            </div>
          </Transition>
        </div>
      </nav>

      <div class="ml-auto flex shrink-0 items-center gap-1.5">
        <button
          type="button"
          class="hidden h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/8 hover:text-cyan-300 focus:outline-none focus:ring-4 focus:ring-cyan-400/15 sm:flex"
          :class="searchOpen ? 'bg-white/10 text-cyan-300' : ''"
          :aria-label="t('commands.search')"
          :aria-expanded="searchOpen"
          @click.stop="toggleSearch"
        >
          <span class="pi pi-search text-sm" />
        </button>

        <div class="relative hidden sm:block">
          <button
            type="button"
            class="flex h-10 items-center gap-2 rounded-xl border border-white/8 bg-white/5 py-1 pl-1 pr-2 text-left transition hover:border-white/15 hover:bg-white/8 focus:outline-none focus:ring-4 focus:ring-cyan-400/15"
            :aria-expanded="userMenuOpen"
            @click.stop="toggleUserMenu"
          >
            <span
              class="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 text-xs font-bold text-white shadow-sm"
            >
              {{ userInitials }}
            </span>
            <span
              class="hidden max-w-28 truncate text-xs font-semibold text-slate-200 xl:block"
            >
              {{ props.userName || t("common.user") }}
            </span>
            <span class="pi pi-chevron-down text-[0.6rem] text-slate-500" />
          </button>

          <Transition
            enter-active-class="transition duration-150 ease-out"
            enter-from-class="-translate-y-1 opacity-0"
            leave-active-class="transition duration-100 ease-in"
            leave-to-class="-translate-y-1 opacity-0"
          >
            <div
              v-if="userMenuOpen"
              class="absolute right-0 top-[calc(100%+0.75rem)] z-50 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 text-slate-700 shadow-2xl shadow-slate-950/20 ring-1 ring-black/5"
            >
              <div class="mb-2 rounded-xl bg-slate-50 px-3 py-3">
                <div class="truncate text-sm font-bold text-slate-900">
                  {{ props.userName || t("common.user") }}
                </div>
                <div class="mt-0.5 text-xs text-slate-400">
                  {{ t("common.activeSession") }}
                </div>
              </div>

              <button
                v-if="props.canViewProfile"
                type="button"
                class="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition hover:bg-slate-100 hover:text-slate-950"
                @click="emitAction('profile')"
              >
                <span class="pi pi-user w-5 text-center text-cyan-600" />
                <span>{{ t("menu.profile") }}</span>
              </button>
              <button
                v-if="props.canManageMenu"
                type="button"
                class="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition hover:bg-slate-100 hover:text-slate-950"
                @click="emitAction('constructor')"
              >
                <span class="pi pi-sitemap w-5 text-center text-cyan-600" />
                <span>{{ t("menu.constructor") }}</span>
              </button>
              <button
                v-if="props.canViewApplicationRoutes"
                type="button"
                class="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition hover:bg-slate-100 hover:text-slate-950"
                @click="emitAction('allRoutes')"
              >
                <span class="pi pi-th-large w-5 text-center text-cyan-600" />
                <span>{{ t("menu.allRoutes") }}</span>
              </button>
              <button
                type="button"
                class="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition hover:bg-slate-100 hover:text-slate-950"
                @click="emitAction('about')"
              >
                <span class="pi pi-info-circle w-5 text-center text-cyan-600" />
                <span>{{ t("menu.about") }}</span>
              </button>
              <div class="my-2 h-px bg-slate-100" />
              <button
                type="button"
                class="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm text-red-600 transition hover:bg-red-50"
                @click="emitAction('logout')"
              >
                <span class="pi pi-sign-out w-5 text-center" />
                <span>{{ t("menu.logout") }}</span>
              </button>
            </div>
          </Transition>
        </div>

        <button
          type="button"
          class="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-4 focus:ring-cyan-400/15 lg:hidden"
          :aria-label="t('menu.open')"
          :aria-expanded="mobileOpen"
          @click="toggleMobile"
        >
          <span :class="['pi', mobileOpen ? 'pi-times' : 'pi-bars']" />
        </button>
      </div>
    </div>

    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="-translate-y-1 opacity-0"
      leave-active-class="transition duration-100 ease-in"
      leave-to-class="-translate-y-1 opacity-0"
    >
      <div
        v-if="searchOpen"
        class="absolute right-4 top-[calc(100%+0.75rem)] z-50 hidden w-[min(32rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-2xl shadow-slate-950/25 ring-1 ring-black/5 sm:block"
      >
        <div class="border-b border-slate-100 bg-slate-50/80 p-3">
          <label class="relative block">
            <span
              class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-sm text-cyan-600"
            />
            <input
              ref="searchInput"
              v-model="searchText"
              type="search"
              class="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10"
              :placeholder="t('menu.searchPlaceholder')"
            />
          </label>
        </div>

        <div class="max-h-[60vh] overflow-y-auto p-2">
          <RouterLink
            v-for="entry in searchResults"
            :key="entry.key"
            :to="{ name: entry.route }"
            class="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition hover:bg-cyan-50 focus:outline-none focus:ring-4 focus:ring-cyan-500/10"
            @click="closeAllMenus"
          >
            <span
              class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition group-hover:bg-cyan-100 group-hover:text-cyan-700"
            >
              <span :class="['pi text-sm', entry.icon]" />
            </span>
            <span class="min-w-0 flex-1">
              <span class="block truncate text-sm font-semibold text-slate-800">
                {{ entry.caption }}
              </span>
              <span
                v-if="entry.breadcrumb"
                class="block truncate text-xs text-slate-400"
              >
                {{ entry.breadcrumb }}
              </span>
            </span>
            <span
              class="pi pi-arrow-right text-xs text-slate-300 group-hover:text-cyan-600"
            />
          </RouterLink>

          <div
            v-if="searchResults.length === 0"
            class="px-4 py-8 text-center text-sm text-slate-400"
          >
            <span class="pi pi-search mb-3 block text-2xl text-slate-300" />
            {{ t("menu.empty") }}
          </div>
        </div>
      </div>
    </Transition>

    <div
      v-if="props.menuError"
      class="relative border-t border-red-900/50 bg-red-950/80 px-4 py-2 text-xs text-red-200"
    >
      <span class="pi pi-exclamation-triangle mr-2" />
      {{ props.menuError }}
    </div>

    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="-translate-y-2 opacity-0"
      leave-active-class="transition duration-150 ease-in"
      leave-to-class="-translate-y-2 opacity-0"
    >
      <div
        v-if="mobileOpen"
        class="relative max-h-[calc(100vh-4rem)] overflow-y-auto border-t border-slate-800 bg-slate-950/98 px-3 pb-4 pt-3 lg:hidden"
      >
        <label class="relative mb-3 block">
          <span
            class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-xs text-cyan-400"
          />
          <input
            v-model="searchText"
            type="search"
            class="h-10 w-full rounded-xl border border-slate-700 bg-slate-900 pl-9 pr-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10"
            :placeholder="t('menu.searchPlaceholder')"
          />
        </label>

        <div class="rounded-2xl bg-white p-2 text-slate-900 shadow-xl">
          <template v-if="normalizedSearch">
            <RouterLink
              v-for="entry in searchResults"
              :key="entry.key"
              :to="{ name: entry.route }"
              class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-cyan-50 hover:text-cyan-800"
              @click="closeAllMenus"
            >
              <span :class="['pi w-5 text-center text-cyan-600', entry.icon]" />
              <span class="min-w-0 flex-1 truncate">{{ entry.caption }}</span>
            </RouterLink>
            <div
              v-if="searchResults.length === 0"
              class="px-3 py-6 text-center text-sm text-slate-400"
            >
              {{ t("menu.empty") }}
            </div>
          </template>
          <ul v-else class="space-y-1">
            <HorizontalMainMenuPanelItem
              v-for="item in props.menu"
              :key="item.id"
              :item="item"
              @navigate="closeAllMenus"
            />
          </ul>
        </div>

        <div class="mt-3 grid grid-cols-2 gap-2">
          <button
            v-if="props.canViewProfile"
            type="button"
            class="flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2.5 text-left text-xs font-semibold text-slate-200 ring-1 ring-slate-800"
            @click="emitAction('profile')"
          >
            <span class="pi pi-user text-cyan-400" />
            {{ t("menu.profile") }}
          </button>
          <button
            type="button"
            class="flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2.5 text-left text-xs font-semibold text-slate-200 ring-1 ring-slate-800"
            @click="emitAction('about')"
          >
            <span class="pi pi-info-circle text-cyan-400" />
            {{ t("menu.about") }}
          </button>
          <button
            v-if="props.canManageMenu"
            type="button"
            class="flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2.5 text-left text-xs font-semibold text-slate-200 ring-1 ring-slate-800"
            @click="emitAction('constructor')"
          >
            <span class="pi pi-sitemap text-cyan-400" />
            {{ t("menu.constructor") }}
          </button>
          <button
            v-if="props.canViewApplicationRoutes"
            type="button"
            class="flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2.5 text-left text-xs font-semibold text-slate-200 ring-1 ring-slate-800"
            @click="emitAction('allRoutes')"
          >
            <span class="pi pi-th-large text-cyan-400" />
            {{ t("menu.allRoutes") }}
          </button>
        </div>

        <button
          type="button"
          class="mt-3 flex w-full items-center justify-between rounded-xl bg-red-950/50 px-3 py-2.5 text-sm font-semibold text-red-200 ring-1 ring-red-900/50"
          @click="emitAction('logout')"
        >
          <span class="flex items-center gap-2">
            <span class="pi pi-sign-out" />
            {{ t("menu.logout") }}
          </span>
          <span class="truncate text-xs font-normal text-slate-500">
            {{ props.userName || t("common.user") }}
          </span>
        </button>
      </div>
    </Transition>
  </header>
</template>
