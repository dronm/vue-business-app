<script setup lang="ts">
import {
	computed,
	ref,
	watch,
} from "vue";

import Button from "primevue/button";
import Dialog from "primevue/dialog";

import { useBusinessApp } from "../core/runtime";
import type { AppBranding } from "../core/types";
import { useBusinessAppI18n } from "../i18n/useBusinessAppI18n";
import type { ProgAbout } from "./types";

const props = defineProps<{
	visible: boolean;
	branding?: AppBranding;
}>();

const emit = defineEmits<{
	"update:visible": [value: boolean];
}>();

const runtime = useBusinessApp();
const {
	t,
	locale,
} = useBusinessAppI18n();

const info = ref<ProgAbout | null>(null);
const loading = ref(false);
const errorMessage = ref<string | null>(null);

interface InfoRow {
	label: string;
	value: string;
}

const branding = computed<AppBranding>(() => {
	return props.branding ?? runtime.config.branding;
});

const dialogVisible = computed({
	get: (): boolean => props.visible,
	set: (
		value: boolean,
	): void => {
		emit("update:visible", value);
	},
});

const displayValue = (
	value: string | null | undefined,
): string => {
	const normalized = value?.trim() ?? "";
	return normalized || "—";
};

const formatDateTime = (
	value: Date,
): string => {
	if (Number.isNaN(value.getTime())) {
		return "—";
	}

	return value.toLocaleString(locale.value, {
		dateStyle: "medium",
		timeStyle: "medium",
	});
};

const backendRows = computed<InfoRow[]>(() => {
	if (info.value === null) {
		return [];
	}

	return [
		{ label: t("progAbout.fields.backendVersion"), value: info.value.backend.version },
		{ label: t("progAbout.fields.buildDate"), value: info.value.backend.build_date },
		{ label: t("progAbout.fields.commit"), value: info.value.backend.commit },
		{ label: t("progAbout.fields.ip"), value: info.value.backend.ip },
	];
});

const databaseRows = computed<InfoRow[]>(() => {
	if (info.value?.db === null || info.value?.db === undefined) {
		return [];
	}

	return [
		{ label: t("progAbout.fields.serverType"), value: info.value.db.server_type },
		{ label: t("progAbout.fields.serverVersion"), value: info.value.db.server_version },
		{ label: t("progAbout.fields.migration"), value: info.value.db.migration },
	];
});

const loadInfo = async (): Promise<void> => {
	loading.value = true;
	errorMessage.value = null;

	try {
		info.value = await runtime.apis.progAbout.info();
	} catch (error: unknown) {
		info.value = null;
		errorMessage.value = error instanceof Error
			? error.message
			: String(error);
	} finally {
		loading.value = false;
	}
};

watch(
	() => props.visible,
	(value: boolean) => {
		if (value) {
			void loadInfo();
		}
	},
);
</script>

<template>
	<Dialog
		v-model:visible="dialogVisible"
		modal
		:header="t('progAbout.title')"
		:draggable="false"
		:dismissable-mask="true"
		class="w-[min(46rem,calc(100vw-2rem))]"
	>
		<div
			v-if="branding.logoUrl"
			class="mb-5 flex justify-center"
		>
			<img
				:src="branding.logoUrl"
				:alt="branding.logoAlt || branding.title"
				class="max-h-20 max-w-64 object-contain"
			/>
		</div>

		<div
			v-if="loading"
			class="flex min-h-48 items-center justify-center gap-3 text-sm text-slate-500"
		>
			<span class="pi pi-spin pi-spinner text-xl" />
			<span>{{ t("progAbout.loading") }}</span>
		</div>

		<div
			v-else-if="errorMessage"
			class="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
		>
			<div class="font-semibold">
				{{ t("progAbout.loadError") }}
			</div>
			<div class="mt-1 break-words text-red-700">
				{{ errorMessage }}
			</div>
			<div class="mt-4">
				<Button
					:label="t('progAbout.actions.retry')"
					icon="pi pi-refresh"
					severity="danger"
					outlined
					@click="loadInfo"
				/>
			</div>
		</div>

		<div v-else-if="info" class="space-y-5 text-sm">
			<section>
				<h3 class="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
					{{ t("progAbout.sections.program") }}
				</h3>
				<dl class="overflow-hidden rounded-xl border border-slate-200 bg-white">
					<div class="grid grid-cols-[10rem_minmax(0,1fr)] border-b border-slate-100 px-4 py-3 last:border-b-0">
						<dt class="font-medium text-slate-500">
							{{ t("progAbout.fields.name") }}
						</dt>
						<dd class="break-words text-slate-900">
							{{ displayValue(info.name) }}
						</dd>
					</div>
					<div class="grid grid-cols-[10rem_minmax(0,1fr)] px-4 py-3">
						<dt class="font-medium text-slate-500">
							{{ t("progAbout.fields.updatedAt") }}
						</dt>
						<dd class="text-slate-900">
							{{ formatDateTime(info.updated_at) }}
						</dd>
					</div>
				</dl>
			</section>

			<section>
				<h3 class="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
					{{ t("progAbout.sections.author") }}
				</h3>
				<dl class="overflow-hidden rounded-xl border border-slate-200 bg-white">
					<div class="grid grid-cols-[10rem_minmax(0,1fr)] border-b border-slate-100 px-4 py-3">
						<dt class="font-medium text-slate-500">
							{{ t("progAbout.fields.authorName") }}
						</dt>
						<dd class="break-words text-slate-900">
							{{ displayValue(info.author.name) }}
						</dd>
					</div>
					<div class="grid grid-cols-[10rem_minmax(0,1fr)] px-4 py-3">
						<dt class="font-medium text-slate-500">
							{{ t("progAbout.fields.authorEmail") }}
						</dt>
						<dd class="break-words text-slate-900">
							<a
								v-if="info.author.email"
								:href="`mailto:${info.author.email}`"
								class="text-blue-600 hover:underline"
							>
								{{ info.author.email }}
							</a>
							<span v-else>—</span>
						</dd>
					</div>
				</dl>
			</section>

			<section>
				<h3 class="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
					{{ t("progAbout.sections.backend") }}
				</h3>
				<dl class="overflow-hidden rounded-xl border border-slate-200 bg-white">
					<div
						v-for="row in backendRows"
						:key="row.label"
						class="grid grid-cols-[10rem_minmax(0,1fr)] border-b border-slate-100 px-4 py-3 last:border-b-0"
					>
						<dt class="font-medium text-slate-500">
							{{ row.label }}
						</dt>
						<dd class="break-all font-mono text-xs text-slate-900">
							{{ displayValue(row.value) }}
						</dd>
					</div>
				</dl>
			</section>

			<section>
				<h3 class="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
					{{ t("progAbout.sections.database") }}
				</h3>
				<div
					v-if="info.db === null"
					class="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-500"
				>
					{{ t("progAbout.databaseUnavailable") }}
				</div>
				<dl v-else class="overflow-hidden rounded-xl border border-slate-200 bg-white">
					<div
						v-for="row in databaseRows"
						:key="row.label"
						class="grid grid-cols-[10rem_minmax(0,1fr)] border-b border-slate-100 px-4 py-3 last:border-b-0"
					>
						<dt class="font-medium text-slate-500">
							{{ row.label }}
						</dt>
						<dd class="break-words text-slate-900">
							{{ displayValue(row.value) }}
						</dd>
					</div>
				</dl>
			</section>
		</div>

		<template #footer>
			<Button
				:label="t('commands.close')"
				icon="pi pi-times"
				severity="secondary"
				outlined
				@click="dialogVisible = false"
			/>
		</template>
	</Dialog>
</template>
