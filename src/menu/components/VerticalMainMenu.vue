<script setup lang="ts">
import {
	computed,
	ref,
	watch,
} from "vue";
import { useRoute } from "vue-router";

import { useBusinessApp } from "../../core/runtime";
import type { AppBranding } from "../../core/types";
import { useBusinessAppI18n } from "../../i18n/useBusinessAppI18n";
import { filterMainMenu } from "../filter";
import type { MainMenuForUser } from "../types";
import VerticalMainMenuItem from "./VerticalMainMenuItem.vue";

const props = withDefaults(defineProps<{
	menu: MainMenuForUser[];
	userName?: string | null;
	menuError?: string | null;
	branding?: AppBranding;
	canViewProfile?: boolean;
	canManageMenu?: boolean;
	canViewApplicationRoutes?: boolean;
}>(), {
	userName: null,
	menuError: null,
	canViewProfile: false,
	canManageMenu: false,
	canViewApplicationRoutes: false,
});

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

const isMobileOpen = ref(false);
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

const filteredMenu = computed<MainMenuForUser[]>(() => {
	return filterMainMenu(props.menu, searchText.value);
});

const userInitials = computed(() => {
	const name = props.userName?.trim();
	if (!name) {
		return "U";
	}

	return name
		.split(/\s+/)
		.slice(0, 2)
		.map((part: string) => part.charAt(0).toUpperCase())
		.join("");
});

const closeMobileMenu = (): void => {
	isMobileOpen.value = false;
};

const toggleMobileMenu = (): void => {
	isMobileOpen.value = !isMobileOpen.value;
};

const openProfile = (): void => {
	closeMobileMenu();
	emit("profile");
};

const showAbout = (): void => {
	closeMobileMenu();
	emit("about");
};

const openConstructor = (): void => {
	closeMobileMenu();
	emit("constructor");
};

const openAllRoutes = (): void => {
	closeMobileMenu();
	emit("allRoutes");
};

watch(
	() => route.fullPath,
	() => {
		closeMobileMenu();
	},
);
</script>

<template>
	<div>
		<div
			v-if="isMobileOpen"
			class="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm lg:hidden"
			@click="closeMobileMenu"
		/>

		<aside
			:class="[
				'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-800 bg-slate-950 text-slate-100 shadow-2xl shadow-slate-950/30 transition-transform duration-200 lg:translate-x-0',
				isMobileOpen ? 'translate-x-0' : '-translate-x-full',
			]"
		>
			<div class="flex h-16 items-center gap-3 border-b border-slate-800 px-5">
				<img
					v-if="branding.logoUrl"
					:src="branding.logoUrl"
					:alt="branding.logoAlt || branding.title"
					class="h-10 w-10 shrink-0 rounded-xl object-contain"
				/>
				<div
					v-else
					class="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-500 text-lg font-black text-white shadow-lg shadow-blue-500/30"
				>
					{{ brandMark }}
				</div>

				<div class="min-w-0">
					<div class="truncate text-sm font-semibold tracking-wide text-white">
						{{ branding.title }}
					</div>
					<div v-if="branding.subtitle" class="truncate text-xs text-slate-400">
						{{ branding.subtitle }}
					</div>
				</div>
			</div>

			<div class="border-b border-slate-800 px-4 py-4">
				<label class="relative block">
					<span class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-500" />
					<input
						v-model="searchText"
						type="search"
						class="h-10 w-full rounded-xl border border-slate-800 bg-slate-900/80 pl-9 pr-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
						:placeholder="t('menu.searchPlaceholder')"
					/>
				</label>
			</div>

			<nav class="flex-1 overflow-y-auto px-2 py-2">
				<div class="mb-1 px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
					{{ t("menu.sectionTitle") }}
				</div>

				<div
					v-if="menuError"
					class="mb-3 rounded-xl border border-red-900/60 bg-red-950/40 px-3 py-2 text-sm text-red-200"
				>
					{{ menuError }}
				</div>

				<div
					v-else-if="filteredMenu.length === 0"
					class="rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-3 text-sm text-slate-400"
				>
					{{ t("menu.empty") }}
				</div>

				<ul v-else class="space-y-1">
					<VerticalMainMenuItem
						v-for="item in filteredMenu"
						:key="`${item.caption}-${item.route || 'group'}`"
						:item="item"
						:depth="0"
						@navigate="closeMobileMenu"
					/>
				</ul>
			</nav>

			<div class="border-t border-slate-800 p-4">
				<div class="mb-3 space-y-1">
					<button
						v-if="props.canViewProfile"
						type="button"
						class="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm text-slate-300 transition hover:bg-slate-900 hover:text-white focus:outline-none focus:ring-4 focus:ring-blue-500/20"
						@click="openProfile"
					>
						<span class="pi pi-user w-5 text-center text-slate-400" />
						<span>{{ t("menu.profile") }}</span>
					</button>

					<button
						v-if="props.canManageMenu"
						type="button"
						class="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm text-slate-300 transition hover:bg-slate-900 hover:text-white focus:outline-none focus:ring-4 focus:ring-blue-500/20"
						@click="openConstructor"
					>
						<span class="pi pi-sitemap w-5 text-center text-slate-400" />
						<span>{{ t("menu.constructor") }}</span>
					</button>

					<button
						v-if="props.canViewApplicationRoutes"
						type="button"
						class="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm text-slate-300 transition hover:bg-slate-900 hover:text-white focus:outline-none focus:ring-4 focus:ring-blue-500/20"
						@click="openAllRoutes"
					>
						<span class="pi pi-th-large w-5 text-center text-slate-400" />
						<span>{{ t("menu.allRoutes") }}</span>
					</button>

					<button
						type="button"
						class="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm text-slate-300 transition hover:bg-slate-900 hover:text-white focus:outline-none focus:ring-4 focus:ring-blue-500/20"
						@click="showAbout"
					>
						<span class="pi pi-info-circle w-5 text-center text-slate-400" />
						<span>{{ t("menu.about") }}</span>
					</button>
				</div>

				<div class="flex items-center gap-3 rounded-2xl bg-slate-900 p-3 ring-1 ring-slate-800">
					<div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-800 text-sm font-semibold text-slate-100">
						{{ userInitials }}
					</div>

					<div class="min-w-0 flex-1">
						<div class="truncate text-sm font-medium text-white">
							{{ userName || t("common.user") }}
						</div>
						<div class="truncate text-xs text-slate-500">
							{{ t("common.activeSession") }}
						</div>
					</div>

					<button
						type="button"
						class="shrink-0 rounded-xl p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white focus:outline-none focus:ring-4 focus:ring-blue-500/20"
						:title="t('menu.logout')"
						:aria-label="t('menu.logout')"
						@click="emit('logout')"
					>
						<span class="pi pi-sign-out" />
					</button>
				</div>
			</div>
		</aside>

		<button
			type="button"
			class="fixed left-2 top-2 z-30 rounded-lg border border-slate-200 bg-white p-2 text-slate-600 shadow-sm transition hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/10 lg:hidden"
			:aria-label="t('menu.open')"
			@click="toggleMobileMenu"
		>
			<span class="pi pi-bars" />
		</button>
	</div>
</template>
