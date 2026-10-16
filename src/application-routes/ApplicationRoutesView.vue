<script setup lang="ts">
import {
	computed,
	onMounted,
	ref,
} from "vue";

import Button from "primevue/button";
import Column from "primevue/column";
import DataTable from "primevue/datatable";
import Dialog from "primevue/dialog";
import InputText from "primevue/inputtext";
import Select from "primevue/select";
import Tag from "primevue/tag";
import ToggleSwitch from "primevue/toggleswitch";

import {
	SortDirect,
	type CollectionParams,
} from "@katren/vue-collection-lib/types/collection";
import { errorText } from "@katren/vue-collection-lib/utils/errorText";

import { useBusinessApp } from "../core/runtime";
import { useBusinessAppI18n } from "../i18n/useBusinessAppI18n";
import type {
	ApplicationRoute,
	ApplicationRouteUpd,
} from "./types";

interface EditForm {
	id: number;
	name: string;
	path: string;
	descr: string;
	section: string;
	icon: string | null;
	menu_available: boolean;
	is_active: boolean;
}

const runtime = useBusinessApp();
const { t } = useBusinessAppI18n();

const rows = ref<ApplicationRoute[]>([]);
const loading = ref(false);
const syncing = ref(false);
const saving = ref(false);
const error = ref("");
const search = ref("");
const section = ref<string | null>(null);
const menuAvailableOnly = ref(true);
const editorVisible = ref(false);
const editorError = ref("");
const form = ref<EditForm | null>(null);

const manifest = computed(() => {
	return runtime.config.applicationRouteManifest ?? [];
});

const canSyncManifest = computed(() => manifest.value.length > 0);

const listParams = (): CollectionParams => {
	return {
		from: 0,
		count: 10000,
		sorter: [
			{
				f: "section",
				d: SortDirect.ASC,
			},
			{
				f: "descr",
				d: SortDirect.ASC,
			},
			{
				f: "name",
				d: SortDirect.ASC,
			},
		],
	} as unknown as CollectionParams;
};

const sections = computed<string[]>(() => {
	return [...new Set(rows.value.map((row) => row.section))]
		.sort((left, right) => left.localeCompare(right));
});

const filteredRows = computed<ApplicationRoute[]>(() => {
	const query = search.value.trim().toLocaleLowerCase();

	return rows.value.filter((row) => {
		if (menuAvailableOnly.value && !row.menu_available) {
			return false;
		}
		if (section.value && row.section !== section.value) {
			return false;
		}
		if (!query) {
			return true;
		}

		return [
			row.descr,
			row.name,
			row.path,
			row.section,
		].some((value) => value.toLocaleLowerCase().includes(query));
	});
});

const load = async (): Promise<void> => {
	loading.value = true;
	error.value = "";
	try {
		const response = await runtime.apis.applicationRoute.list(listParams());
		rows.value = response?.rows ?? [];
	} catch (err: unknown) {
		rows.value = [];
		error.value = errorText(err);
	} finally {
		loading.value = false;
	}
};

const syncManifest = async (): Promise<void> => {
	if (!canSyncManifest.value) {
		return;
	}

	syncing.value = true;
	error.value = "";
	try {
		await runtime.apis.applicationRoute.sync(manifest.value);
		await load();
	} catch (err: unknown) {
		error.value = errorText(err);
	} finally {
		syncing.value = false;
	}
};

const openEdit = (
	route: ApplicationRoute,
): void => {
	editorError.value = "";
	form.value = {
		id: route.id,
		name: route.name,
		path: route.path,
		descr: route.descr,
		section: route.section,
		icon: route.icon,
		menu_available: route.menu_available,
		is_active: route.is_active,
	};
	editorVisible.value = true;
};

const normalizeIcon = (
	value: string | null,
): string | null => {
	const normalized = value?.trim() ?? "";
	return normalized || null;
};

const save = async (): Promise<void> => {
	if (!form.value) {
		return;
	}

	const descr = form.value.descr.trim();
	const sectionValue = form.value.section.trim();
	if (!descr || !sectionValue) {
		editorError.value = t("errors.required");
		return;
	}

	saving.value = true;
	editorError.value = "";
	try {
		const update: ApplicationRouteUpd = {
			descr,
			section: sectionValue,
			icon: normalizeIcon(form.value.icon),
		};
		await runtime.apis.applicationRoute.update({ id: form.value.id }, update);
		editorVisible.value = false;
		await load();
	} catch (err: unknown) {
		editorError.value = errorText(err);
	} finally {
		saving.value = false;
	}
};

onMounted(load);
</script>

<template>
	<section class="py-4">
		<div class="mb-4 flex flex-wrap items-center justify-between gap-3">
			<div>
				<h1 class="text-2xl font-semibold text-slate-900">
					{{ t("applicationRoute.title") }}
				</h1>
				<p class="mt-1 text-sm text-slate-500">
					{{ t("applicationRoute.subtitle") }}
				</p>
			</div>

			<div class="flex items-center gap-2">
				<Button
					:label="t('applicationRoute.actions.sync')"
					icon="pi pi-sync"
					severity="secondary"
					outlined
					:loading="syncing"
					:disabled="!canSyncManifest"
					@click="syncManifest"
				/>
				<Button
					:label="t('commands.refresh')"
					icon="pi pi-refresh"
					:loading="loading"
					@click="load"
				/>
			</div>
		</div>

		<div class="mb-4 grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-3">
			<div class="flex flex-col gap-1">
				<label for="applicationRouteSearch" class="text-sm font-medium text-slate-700">
					{{ t("applicationRoute.search") }}
				</label>
				<InputText
					id="applicationRouteSearch"
					v-model="search"
					:placeholder="t('applicationRoute.searchPlaceholder')"
				/>
			</div>

			<div class="flex flex-col gap-1">
				<label for="applicationRouteSection" class="text-sm font-medium text-slate-700">
					{{ t("applicationRoute.fields.section") }}
				</label>
				<Select
					id="applicationRouteSection"
					v-model="section"
					:options="sections"
					showClear
					:placeholder="t('applicationRoute.allSections')"
					class="w-full"
				/>
			</div>

			<div class="flex items-end">
				<label
					for="applicationRouteMenuAvailableOnly"
					class="flex min-h-10 cursor-pointer items-center gap-3 text-sm font-medium text-slate-700"
				>
					<ToggleSwitch
						inputId="applicationRouteMenuAvailableOnly"
						v-model="menuAvailableOnly"
					/>
					<span>{{ t("applicationRoute.filters.menuAvailableOnly") }}</span>
				</label>
			</div>
		</div>

		<div
			v-if="error"
			class="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
		>
			{{ error }}
		</div>

		<div class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
			<DataTable
				:value="filteredRows"
				dataKey="id"
				:loading="loading"
				paginator
				:rows="30"
				:rowsPerPageOptions="[30, 50, 100]"
				stripedRows
				scrollable
				scrollHeight="calc(100vh - 19rem)"
			>
				<Column field="section" :header="t('applicationRoute.fields.section')" sortable style="min-width: 11rem" />
				<Column field="descr" :header="t('applicationRoute.fields.descr')" sortable style="min-width: 18rem" />
				<Column field="name" :header="t('applicationRoute.fields.name')" sortable style="min-width: 16rem" />
				<Column field="path" :header="t('applicationRoute.fields.path')" sortable style="min-width: 20rem" />
				<Column :header="t('applicationRoute.fields.menuAvailable')" style="width: 9rem">
					<template #body="slotProps">
						<Tag
							:value="slotProps.data.menu_available ? t('common.yes') : t('common.no')"
							:severity="slotProps.data.menu_available ? 'success' : 'secondary'"
						/>
					</template>
				</Column>
				<Column :header="t('applicationRoute.fields.isActive')" style="width: 8rem">
					<template #body="slotProps">
						<Tag
							:value="slotProps.data.is_active ? t('common.yes') : t('common.no')"
							:severity="slotProps.data.is_active ? 'success' : 'danger'"
						/>
					</template>
				</Column>
				<Column style="width: 5rem">
					<template #body="slotProps">
						<Button
							icon="pi pi-pencil"
							text
							rounded
							:aria-label="t('commands.edit')"
							@click="openEdit(slotProps.data)"
						/>
					</template>
				</Column>
			</DataTable>
		</div>

		<Dialog
			v-model:visible="editorVisible"
			:header="t('applicationRoute.form.edit')"
			modal
			:style="{ width: '44rem', maxWidth: 'calc(100vw - 2rem)' }"
		>
			<form v-if="form" class="space-y-4" @submit.prevent="save">
				<div
					v-if="editorError"
					class="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
				>
					{{ editorError }}
				</div>

				<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
					<div class="flex flex-col gap-1">
						<label>{{ t("applicationRoute.fields.name") }}</label>
						<InputText :modelValue="form.name" disabled />
					</div>
					<div class="flex flex-col gap-1">
						<label>{{ t("applicationRoute.fields.path") }}</label>
						<InputText :modelValue="form.path" disabled />
					</div>
					<div class="flex flex-col gap-1 md:col-span-2">
						<label for="applicationRouteDescr">{{ t("applicationRoute.fields.descr") }}</label>
						<InputText id="applicationRouteDescr" v-model="form.descr" maxlength="250" autofocus />
					</div>
					<div class="flex flex-col gap-1">
						<label for="applicationRouteEditSection">{{ t("applicationRoute.fields.section") }}</label>
						<InputText id="applicationRouteEditSection" v-model="form.section" maxlength="250" />
					</div>
					<div class="flex flex-col gap-1">
						<label for="applicationRouteIcon">{{ t("applicationRoute.fields.icon") }}</label>
						<InputText id="applicationRouteIcon" v-model="form.icon" maxlength="250" placeholder="pi pi-list" />
					</div>
				</div>

				<div class="flex justify-end gap-2 pt-2">
					<Button
						:label="t('commands.cancel')"
						severity="secondary"
						outlined
						type="button"
						@click="editorVisible = false"
					/>
					<Button
						:label="t('commands.save')"
						icon="pi pi-check"
						:loading="saving"
						type="submit"
					/>
				</div>
			</form>
		</Dialog>
	</section>
</template>
