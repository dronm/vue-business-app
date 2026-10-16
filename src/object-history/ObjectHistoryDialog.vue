<script setup lang="ts">
import {
	computed,
	onBeforeUnmount,
	ref,
	watch,
} from "vue";

import Button from "primevue/button";
import Column from "primevue/column";
import DataTable from "primevue/datatable";
import Dialog from "primevue/dialog";

import { useBusinessApp } from "../core/runtime";
import { useBusinessAppI18n } from "../i18n/useBusinessAppI18n";
import {
	formatObjectHistoryDateTime,
	formatObjectHistoryValue,
} from "./format";
import type {
	ObjectHistoryChange,
	ObjectHistoryRow,
} from "./types";

const props = withDefaults(defineProps<{
	visible: boolean;
	objectType: string;
	objectId: string | number | null | undefined;
	title?: string;
	pageSize?: number;
}>(), {
	title: undefined,
	pageSize: 50,
});

const emit = defineEmits<{
	"update:visible": [value: boolean];
}>();

const runtime = useBusinessApp();
const {
	t,
	locale,
} = useBusinessAppI18n();

const rows = ref<ObjectHistoryRow[]>([]);
const total = ref(0);
const first = ref(0);
const activePageSize = ref(props.pageSize);
const expandedRows = ref<Record<string, boolean>>({});
const loading = ref(false);
const errorMessage = ref<string | null>(null);
let activeRequest: AbortController | null = null;

const dialogVisible = computed({
	get: (): boolean => props.visible,
	set: (
		value: boolean,
	): void => {
		emit("update:visible", value);
	},
});

const dialogTitle = computed(() => props.title?.trim() || t("objectHistory.title"));

const hasObjectKey = computed(() => {
	return props.objectType.trim() !== ""
		&& props.objectId !== null
		&& props.objectId !== undefined
		&& String(props.objectId).trim() !== "";
});

const normalizePageSize = (
	value: number,
): number => {
	if (!Number.isFinite(value)) {
		return 50;
	}
	return Math.min(500, Math.max(1, Math.trunc(value)));
};

const operationLabel = (
	operation: string,
): string => {
	switch (operation.trim().toUpperCase()) {
	case "I":
		return t("objectHistory.operations.insert");
	case "U":
		return t("objectHistory.operations.update");
	case "D":
		return t("objectHistory.operations.delete");
	default:
		return operation;
	}
};

const dateTimeLabel = (
	value: Date,
): string => formatObjectHistoryDateTime(value, locale.value);

const changeValue = (
	value: unknown,
	description: string | null | undefined,
): string => formatObjectHistoryValue(value, description, {
	yes: t("common.yes"),
	no: t("common.no"),
});

const load = async (): Promise<void> => {
	activeRequest?.abort();
	activeRequest = null;

	if (!props.visible || !hasObjectKey.value) {
		rows.value = [];
		total.value = 0;
		errorMessage.value = null;
		loading.value = false;
		return;
	}

	const request = new AbortController();
	activeRequest = request;
	loading.value = true;
	errorMessage.value = null;

	try {
		const response = await runtime.apis.objectHistory.list({
			objectType: props.objectType,
			objectId: String(props.objectId),
			from: first.value,
			count: activePageSize.value,
		}, request.signal);
		if (request.signal.aborted) {
			return;
		}

		rows.value = response.rows;
		total.value = response.total;
		expandedRows.value = {};
	} catch (error: unknown) {
		if (request.signal.aborted) {
			return;
		}
		rows.value = [];
		total.value = 0;
		errorMessage.value = error instanceof Error
			? error.message
			: String(error);
	} finally {
		if (activeRequest === request) {
			activeRequest = null;
			loading.value = false;
		}
	}
};

const resetAndLoad = (): void => {
	first.value = 0;
	activePageSize.value = normalizePageSize(props.pageSize);
	expandedRows.value = {};
	void load();
};

const handlePage = (
	event: { first: number; rows: number },
): void => {
	first.value = event.first;
	activePageSize.value = event.rows;
	void load();
};

const oldValue = (
	change: ObjectHistoryChange,
): string => changeValue(change.old, change.old_description);

const newValue = (
	change: ObjectHistoryChange,
): string => changeValue(change.new, change.new_description);

watch(
	() => [props.visible, props.objectType, props.objectId] as const,
	([visible]) => {
		if (visible) {
			resetAndLoad();
		} else {
			activeRequest?.abort();
			activeRequest = null;
			loading.value = false;
		}
	},
	{ immediate: true },
);

watch(
	() => props.pageSize,
	() => {
		if (props.visible) {
			resetAndLoad();
		}
	},
);

onBeforeUnmount(() => {
	activeRequest?.abort();
});

defineExpose({
	refresh: resetAndLoad,
});
</script>

<template>
	<Dialog
		v-model:visible="dialogVisible"
		modal
		:header="dialogTitle"
		:draggable="false"
		:dismissable-mask="true"
		class="w-[min(72rem,calc(100vw-2rem))]"
	>
		<div
			v-if="errorMessage"
			class="mb-3 flex items-start justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
			role="alert"
		>
			<span class="break-words">{{ errorMessage }}</span>
			<Button
				:label="t('commands.refresh')"
				icon="pi pi-refresh"
				severity="danger"
				text
				size="small"
				@click="resetAndLoad"
			/>
		</div>

		<DataTable
			v-model:expanded-rows="expandedRows"
			:value="rows"
			data-key="id"
			lazy
			paginator
			:loading="loading"
			:first="first"
			:rows="activePageSize"
			:total-records="total"
			:rows-per-page-options="[25, 50, 100]"
			size="small"
			striped-rows
			removable-sort
			class="object-history-table"
			@page="handlePage"
		>
			<Column expander class="w-12" />
			<Column
				field="changed_at"
				:header="t('objectHistory.fields.changedAt')"
				class="w-48 whitespace-nowrap"
			>
				<template #body="{ data }">
					{{ dateTimeLabel(data.changed_at) }}
				</template>
			</Column>
			<Column
				field="operation"
				:header="t('objectHistory.fields.operation')"
				class="w-48"
			>
				<template #body="{ data }">
					{{ operationLabel(data.operation) }}
				</template>
			</Column>
			<Column
				field="changed_by"
				:header="t('objectHistory.fields.user')"
			>
				<template #body="{ data }">
					{{ data.changed_by || "—" }}
				</template>
			</Column>

			<template #expansion="{ data }">
				<div class="px-3 py-2">
					<DataTable
						:value="data.changes"
						data-key="column"
						size="small"
						show-gridlines
						class="w-full"
					>
						<Column
							field="field"
							:header="t('objectHistory.changeFields.field')"
							class="w-1/3"
						/>
						<Column :header="t('objectHistory.changeFields.old')">
							<template #body="{ data: change }">
								<span class="break-words">{{ oldValue(change) }}</span>
							</template>
						</Column>
						<Column :header="t('objectHistory.changeFields.new')">
							<template #body="{ data: change }">
								<span class="break-words">{{ newValue(change) }}</span>
							</template>
						</Column>
						<template #empty>
							{{ t("objectHistory.noVisibleChanges") }}
						</template>
					</DataTable>
				</div>
			</template>

			<template #empty>
				{{ hasObjectKey ? t("objectHistory.empty") : t("objectHistory.objectKeyRequired") }}
			</template>
		</DataTable>

		<template #footer>
			<Button
				:label="t('commands.close')"
				severity="secondary"
				@click="dialogVisible = false"
			/>
		</template>
	</Dialog>
</template>
