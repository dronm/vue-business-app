<script setup lang="ts">
import {
	computed,
	ref,
	watch,
} from "vue";
import { useRoute } from "vue-router";

import type { MainMenuForUser } from "../types";

const props = withDefaults(defineProps<{
	item: MainMenuForUser;
	depth?: number;
}>(), {
	depth: 0,
});

const emit = defineEmits<{
	navigate: [];
}>();

const route = useRoute();

const children = computed<MainMenuForUser[]>(() => {
	return props.item.children ?? [];
});

const hasChildren = computed(() => children.value.length > 0);
const isCurrentRoute = computed(() => {
	return Boolean(props.item.route) && route.name === props.item.route;
});

const hasActiveChild = (
	item: MainMenuForUser,
): boolean => {
	if (!item.children) {
		return false;
	}

	return item.children.some((child) => {
		return child.route === route.name || hasActiveChild(child);
	});
};

const isActiveBranch = computed(() => {
	return isCurrentRoute.value || hasActiveChild(props.item);
});

const isOpen = ref(props.depth === 0 || isActiveBranch.value);

const itemIcon = computed(() => {
	const configuredIcon = props.item.icon
		?.split(/\s+/)
		.find((className) => className.startsWith("pi-"));
	if (configuredIcon) {
		return configuredIcon;
	}

	if (hasChildren.value) {
		return "pi-folder";
	}

	const routeName = props.item.route ?? "";
	if (routeName.includes("Parser")) {
		return "pi-bolt";
	}
	if (routeName.toLocaleLowerCase().includes("vehicle")) {
		return "pi-car";
	}
	if (routeName.toLocaleLowerCase().includes("user")) {
		return "pi-users";
	}
	if (routeName.toLocaleLowerCase().includes("market")) {
		return "pi-shop";
	}
	if (routeName.toLocaleLowerCase().includes("catalogue")) {
		return "pi-list";
	}

	return "pi-circle";
});

const itemPadding = computed(() => {
	return `${0.55 + props.depth * 0.75}rem`;
});

const toggleOpen = (): void => {
	isOpen.value = !isOpen.value;
};

watch(
	() => route.name,
	() => {
		if (isActiveBranch.value) {
			isOpen.value = true;
		}
	},
);
</script>

<template>
	<li>
		<div class="group relative">
			<RouterLink
				v-if="item.route"
				:to="{ name: item.route }"
				:class="[
					'flex min-h-8 items-center gap-2 rounded-lg py-1.5 pr-2 text-xs font-medium transition focus:outline-none focus:ring-4 focus:ring-blue-500/20',
					isCurrentRoute
						? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
						: 'text-slate-300 hover:bg-slate-900 hover:text-white',
				]"
				:style="{ paddingLeft: itemPadding }"
				@click="emit('navigate')"
			>
				<span
					:class="[
						'pi shrink-0 text-xs',
						itemIcon,
						isCurrentRoute ? 'text-white' : 'text-slate-500 group-hover:text-slate-300',
					]"
				/>
				<span class="min-w-0 flex-1 truncate">
					{{ item.caption }}
				</span>
			</RouterLink>

			<button
				v-else
				type="button"
				:class="[
					'flex min-h-8 w-full items-center gap-2 rounded-lg py-1.5 pr-2 text-left text-xs font-medium transition focus:outline-none focus:ring-4 focus:ring-blue-500/20',
					isActiveBranch
						? 'bg-slate-900 text-white'
						: 'text-slate-300 hover:bg-slate-900 hover:text-white',
				]"
				:style="{ paddingLeft: itemPadding }"
				@click="toggleOpen"
			>
				<span
					:class="[
						'pi shrink-0 text-xs text-slate-500 group-hover:text-slate-300',
						itemIcon,
					]"
				/>
				<span class="min-w-0 flex-1 truncate">
					{{ item.caption }}
				</span>
				<span
					v-if="hasChildren"
					:class="[
						'pi pi-chevron-down shrink-0 text-xs text-slate-500 transition-transform',
						isOpen ? 'rotate-180' : '',
					]"
				/>
			</button>
		</div>

		<ul
			v-if="hasChildren"
			v-show="isOpen"
			class="mt-0.5 space-y-0.5"
		>
			<VerticalMainMenuItem
				v-for="child in children"
				:key="`${child.caption}-${child.route || 'group'}`"
				:item="child"
				:depth="depth + 1"
				@navigate="emit('navigate')"
			/>
		</ul>
	</li>
</template>
