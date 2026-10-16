<script setup lang="ts">
import {
	computed,
} from "vue";

import Select from "primevue/select";

import { useBusinessApp } from "../core/runtime";
import type { RoleOption } from "../core/types";

const props = withDefaults(defineProps<{
	modelValue?: string | null;
	id?: string;
	invalid?: boolean;
	disabled?: boolean;
	showClear?: boolean;
	options?: readonly RoleOption<string>[];
}>(), {
	modelValue: null,
	id: "roleReference",
	invalid: false,
	disabled: false,
	showClear: true,
});

const emit = defineEmits<{
	"update:modelValue": [value: string | null];
}>();

const runtime = useBusinessApp();

const effectiveOptions = computed<RoleOption<string>[]>(() => {
	return [...(props.options ?? runtime.roleOptions)];
});

const selectedValue = computed({
	get: (): string | null => props.modelValue,
	set: (
		value: string | null,
	): void => {
		emit("update:modelValue", value);
	},
});
</script>

<template>
	<Select
		:id="props.id"
		v-model="selectedValue"
		:options="effectiveOptions"
		optionLabel="label"
		optionValue="value"
		:invalid="props.invalid"
		:disabled="props.disabled"
		:showClear="props.showClear"
		class="w-full"
	/>
</template>
