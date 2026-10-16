<script setup lang="ts">
import {
	ref,
	watch,
} from "vue";

import AutoComplete from "primevue/autocomplete";

import { useBusinessApp } from "../../core/runtime";
import type { MainMenuRouteOption } from "../types";

type AutoCompleteEvent = {
	query?: string;
};

type AutoCompleteSelectEvent = {
	value?: MainMenuRouteOption;
};

const props = withDefaults(defineProps<{
	modelValue?: number | null;
	id?: string;
	invalid?: boolean;
	disabled?: boolean;
	placeholder?: string;
}>(), {
	modelValue: null,
	id: "mainMenuRoute",
	invalid: false,
	disabled: false,
	placeholder: "",
});

const emit = defineEmits<{
	"update:modelValue": [value: number | null];
	select: [value: MainMenuRouteOption];
}>();

const runtime = useBusinessApp();
const suggestions = ref<MainMenuRouteOption[]>([]);
const selected = ref<MainMenuRouteOption | string | null>(null);
const loading = ref(false);

const complete = async (
	event: AutoCompleteEvent,
): Promise<void> => {
	try {
		suggestions.value = await runtime.apis.mainMenu.routeAutocomplete(event.query ?? "", 30);
	} catch {
		suggestions.value = [];
	}
};

const loadSelected = async (
	id: number | null | undefined,
): Promise<void> => {
	if (!id) {
		selected.value = null;
		return;
	}
	if (typeof selected.value === "object" && selected.value?.id === id) {
		return;
	}

	loading.value = true;
	try {
		const route = await runtime.apis.applicationRoute.detail({ id });
		selected.value = {
			id: route.id,
			name: route.name,
			path: route.path,
			descr: route.descr,
			section: route.section,
			icon: route.icon,
		};
	} catch {
		selected.value = null;
	} finally {
		loading.value = false;
	}
};

const selectValue = (
	event: AutoCompleteSelectEvent,
): void => {
	if (!event.value) {
		return;
	}

	emit("update:modelValue", event.value.id);
	emit("select", event.value);
};

const clearValue = (): void => {
	selected.value = null;
	emit("update:modelValue", null);
};

watch(
	() => props.modelValue,
	(value: number | null | undefined) => {
		void loadSelected(value);
	},
	{ immediate: true },
);

watch(
	selected,
	(value) => {
		if (value === null && props.modelValue !== null) {
			emit("update:modelValue", null);
		}
	},
);
</script>

<template>
	<AutoComplete
		:id="props.id"
		v-model="selected"
		:suggestions="suggestions"
		:invalid="props.invalid"
		:disabled="props.disabled || loading"
		:placeholder="props.placeholder"
		optionLabel="descr"
		forceSelection
		dropdown
		class="w-full"
		inputClass="w-full"
		@clear="clearValue"
		@complete="complete"
		@item-select="selectValue"
	>
		<template #option="slotProps">
			<div class="min-w-0 py-1">
				<div class="truncate font-medium text-slate-900">
					{{ slotProps.option.descr }}
				</div>
				<div class="truncate text-xs text-slate-500">
					{{ slotProps.option.section }} · {{ slotProps.option.name }} · {{ slotProps.option.path }}
				</div>
			</div>
		</template>
	</AutoComplete>
</template>
