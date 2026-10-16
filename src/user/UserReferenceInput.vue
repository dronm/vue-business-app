<script setup lang="ts">
import {
	ReferenceKeyInput,
	defineCrudReference,
} from "@katren/vue-collection-lib";

import { useBusinessApp } from "../core/runtime";
import { useBusinessAppI18n } from "../i18n/useBusinessAppI18n";
import type {
	UserBase,
	UserKeyBase,
} from "./types";

const props = withDefaults(defineProps<{
	modelValue?: number | null;
	id?: string;
	label?: string;
	invalid?: boolean;
	error?: string;
	disabled?: boolean;
	forceSelection?: boolean;
}>(), {
	modelValue: null,
	id: "userReference",
	label: "",
	invalid: false,
	error: "",
	disabled: false,
	forceSelection: true,
});

const emit = defineEmits<{
	"update:modelValue": [value: number | null];
}>();

const runtime = useBusinessApp();
const { t } = useBusinessAppI18n();
const userReference = defineCrudReference<
	UserBase<string>,
	UserKeyBase,
	number
>({
	list: runtime.apis.user.list,
	detail: runtime.apis.user.detail,
	keyField: "id",
	searchField: "name",
	descrFields: ["name"],
	minLength: 0,
	count: 30,
	completeOnFocus: true,
	forceSelection: props.forceSelection,
	openRoute: runtime.config.userReferenceRoutes?.edit
		? (value) => runtime.config.userReferenceRoutes!.edit!(Number(value.keys?.id))
		: undefined,
	selectRoute: runtime.config.userReferenceRoutes?.list,
});
</script>

<template>
	<ReferenceKeyInput
		:id="props.id"
		:modelValue="props.modelValue"
		:reference="userReference"
		:label="props.label || t('common.user')"
		:invalid="props.invalid"
		:error="props.error"
		:disabled="props.disabled"
		:showOpen="Boolean(runtime.config.userReferenceRoutes?.edit)"
		:showSelect="Boolean(runtime.config.userReferenceRoutes?.list)"
		:openTitle="t('commands.edit')"
		:selectTitle="t('commands.search')"
		:clearTitle="t('commands.clear')"
		class="w-full"
		@update:modelValue="emit('update:modelValue', $event)"
	/>
</template>
