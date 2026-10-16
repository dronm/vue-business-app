import {
	ref,
	type Ref,
} from "vue";

import { useBusinessApp } from "../core/runtime";
import type {
	UserPasswordChange,
	UserProfile,
	UserProfileBase,
	UserProfileUpdateBase,
} from "./types";

export interface CurrentUserProfileController<
	TProfile extends UserProfileBase = UserProfile,
> {
	profile: Ref<TProfile | null>;
	loading: Ref<boolean>;
	saving: Ref<boolean>;
	changingPassword: Ref<boolean>;
	load: () => Promise<TProfile>;
	save: (model: UserProfileUpdateBase) => Promise<TProfile>;
	changePassword: (model: UserPasswordChange) => Promise<void>;
}

export const useCurrentUserProfile = <
	TProfile extends UserProfileBase = UserProfile,
>(): CurrentUserProfileController<TProfile> => {
	const runtime = useBusinessApp();
	const profile = ref<TProfile | null>(null) as Ref<TProfile | null>;
	const loading = ref(false);
	const saving = ref(false);
	const changingPassword = ref(false);

	const load = async (): Promise<TProfile> => {
		loading.value = true;
		try {
			const result = await runtime.apis.userProfile.getCurrent() as TProfile;
			profile.value = result;
			return result;
		} finally {
			loading.value = false;
		}
	};

	const save = async (
		model: UserProfileUpdateBase,
	): Promise<TProfile> => {
		saving.value = true;
		try {
			const result = await runtime.apis.userProfile.updateCurrent(model) as TProfile;
			profile.value = {
				...(profile.value ?? {}),
				...model,
				...result,
			} as TProfile;
			return profile.value;
		} finally {
			saving.value = false;
		}
	};

	const changePassword = async (
		model: UserPasswordChange,
	): Promise<void> => {
		changingPassword.value = true;
		try {
			await runtime.apis.userProfile.changePassword(model);
		} finally {
			changingPassword.value = false;
		}
	};

	return {
		profile,
		loading,
		saving,
		changingPassword,
		load,
		save,
		changePassword,
	};
};
