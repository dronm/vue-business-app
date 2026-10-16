<script setup lang="ts">
import {
	onMounted,
	ref,
} from "vue";

import Button from "primevue/button";
import InputText from "primevue/inputtext";

import { errorText } from "@katren/vue-collection-lib/utils/errorText";

import { useBusinessAppI18n } from "../i18n/useBusinessAppI18n";
import {
	buildUserProfileUpdate,
	setUserProfileExtraField,
} from "./profile";
import type {
	UserProfile,
	UserProfileFieldsSlotProps,
	UserProfileUpdateBase,
} from "./types";
import { useCurrentUserProfile } from "./useCurrentUserProfile";

const props = withDefaults(defineProps<{
	extraFields?: readonly string[];
}>(), {
	extraFields: () => [],
});

defineSlots<{
	fields?(props: UserProfileFieldsSlotProps): unknown;
}>();

const emit = defineEmits<{
	updated: [profile: UserProfile];
}>();

const { t } = useBusinessAppI18n();
const {
	profile,
	loading,
	saving,
	changingPassword,
	load,
	save,
	changePassword,
} = useCurrentUserProfile();

const loadError = ref("");
const profileError = ref("");
const profileSuccess = ref("");
const passwordError = ref("");
const passwordSuccess = ref("");
const newPassword = ref("");
const passwordConfirmation = ref("");

const setField = (
	field: string,
	value: unknown,
): void => {
	if (profile.value === null) {
		return;
	}

	setUserProfileExtraField(profile.value, field, value);
};

const validateName = (): string | null => {
	const name = String(profile.value?.name ?? "").trim();
	if (!name) {
		return t("userProfile.errors.nameRequired");
	}
	if (name.length > 100) {
		return t("userProfile.errors.nameTooLong");
	}

	return null;
};

const buildProfileUpdate = (): UserProfileUpdateBase => {
	if (profile.value === null) {
		throw new Error(t("userProfile.errors.notLoaded"));
	}

	return buildUserProfileUpdate(profile.value, props.extraFields);
};

const saveProfile = async (): Promise<void> => {
	profileError.value = "";
	profileSuccess.value = "";

	const validationError = validateName();
	if (validationError !== null) {
		profileError.value = validationError;
		return;
	}

	try {
		const result = await save(buildProfileUpdate());
		profileSuccess.value = t("userProfile.messages.saved");
		emit("updated", result);
	} catch (err: unknown) {
		profileError.value = errorText(err);
	}
};

const changeUserPassword = async (): Promise<void> => {
	passwordError.value = "";
	passwordSuccess.value = "";

	if (!newPassword.value) {
		passwordError.value = t("userProfile.errors.passwordRequired");
		return;
	}
	if (newPassword.value.length > 50) {
		passwordError.value = t("userProfile.errors.passwordTooLong");
		return;
	}
	if (newPassword.value !== passwordConfirmation.value) {
		passwordError.value = t("userProfile.errors.passwordMismatch");
		return;
	}

	try {
		await changePassword({
			new_password: newPassword.value,
		});
		newPassword.value = "";
		passwordConfirmation.value = "";
		passwordSuccess.value = t("userProfile.messages.passwordChanged");
	} catch (err: unknown) {
		passwordError.value = errorText(err);
	}
};

const loadProfile = async (): Promise<void> => {
	loadError.value = "";
	try {
		await load();
	} catch (err: unknown) {
		loadError.value = errorText(err);
	}
};

onMounted(loadProfile);
</script>

<template>
	<section class="mx-auto w-full max-w-4xl py-4">
		<div class="mb-5">
			<h1 class="text-2xl font-semibold text-slate-900">
				{{ t("userProfile.title") }}
			</h1>
			<p class="mt-1 text-sm text-slate-500">
				{{ t("userProfile.subtitle") }}
			</p>
		</div>

		<div
			v-if="loading"
			class="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm"
		>
			{{ t("loading") }}
		</div>

		<div
			v-else-if="loadError"
			class="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
		>
			<div>{{ loadError }}</div>
			<Button
				type="button"
				class="mt-3"
				:label="t('commands.refresh')"
				severity="secondary"
				outlined
				@click="loadProfile"
			/>
		</div>

		<div v-else-if="profile" class="space-y-5">
			<form
				class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
				@submit.prevent="saveProfile"
			>
				<div class="mb-4">
					<h2 class="text-lg font-semibold text-slate-900">
						{{ t("userProfile.sections.profile") }}
					</h2>
				</div>

				<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
					<div class="flex flex-col gap-1">
						<label for="currentUserProfileName" class="text-sm font-medium text-slate-700">
							{{ t("userProfile.fields.name") }}
						</label>
						<InputText
							id="currentUserProfileName"
							v-model="profile.name"
							autocomplete="username"
							:disabled="saving"
							required
						/>
					</div>

					<slot
						name="fields"
						:model="profile"
						:set-field="setField"
						:disabled="saving"
					/>
				</div>

				<div
					v-if="profileError"
					class="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
				>
					{{ profileError }}
				</div>
				<div
					v-else-if="profileSuccess"
					class="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700"
				>
					{{ profileSuccess }}
				</div>

				<div class="mt-5 flex justify-end">
					<Button
						type="submit"
						:label="t('commands.save')"
						icon="pi pi-check"
						:loading="saving"
					/>
				</div>
			</form>

			<form
				class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
				@submit.prevent="changeUserPassword"
			>
				<div class="mb-4">
					<h2 class="text-lg font-semibold text-slate-900">
						{{ t("userProfile.sections.password") }}
					</h2>
					<p class="mt-1 text-sm text-slate-500">
						{{ t("userProfile.passwordHelp") }}
					</p>
				</div>

				<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
					<div class="flex flex-col gap-1">
						<label for="currentUserNewPassword" class="text-sm font-medium text-slate-700">
							{{ t("userProfile.fields.newPassword") }}
						</label>
						<InputText
							id="currentUserNewPassword"
							v-model="newPassword"
							type="password"
							autocomplete="new-password"
							:disabled="changingPassword"
						/>
					</div>

					<div class="flex flex-col gap-1">
						<label for="currentUserPasswordConfirmation" class="text-sm font-medium text-slate-700">
							{{ t("userProfile.fields.passwordConfirmation") }}
						</label>
						<InputText
							id="currentUserPasswordConfirmation"
							v-model="passwordConfirmation"
							type="password"
							autocomplete="new-password"
							:disabled="changingPassword"
						/>
					</div>
				</div>

				<div
					v-if="passwordError"
					class="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
				>
					{{ passwordError }}
				</div>
				<div
					v-else-if="passwordSuccess"
					class="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700"
				>
					{{ passwordSuccess }}
				</div>

				<div class="mt-5 flex justify-end">
					<Button
						type="submit"
						:label="t('userProfile.actions.changePassword')"
						icon="pi pi-key"
						:loading="changingPassword"
					/>
				</div>
			</form>
		</div>
	</section>
</template>
