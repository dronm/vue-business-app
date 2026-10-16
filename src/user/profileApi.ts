import type { BusinessAppApi } from "../core/api";
import {
	defaultTranslate,
	type TranslateFn,
} from "../core/validation";
import {
	createUserProfileSchemas,
	userProfileFromDTO,
} from "./profileSchemas";
import type {
	UserPasswordChange,
	UserProfile,
	UserProfileUpdateBase,
} from "./types";

const basePath = "/users/me";

export const createUserProfileApi = (
	api: BusinessAppApi,
	t: TranslateFn = defaultTranslate,
) => {
	const schemas = createUserProfileSchemas(t);

	return {
		getCurrent: async (): Promise<UserProfile> => {
			const dto = await api.get<unknown>(basePath);
			return userProfileFromDTO(dto, schemas);
		},

		updateCurrent: async (
			model: UserProfileUpdateBase,
		): Promise<UserProfile> => {
			const dto = await api.patch<unknown>(basePath, model);
			return userProfileFromDTO(dto, schemas);
		},

		changePassword: async (
			model: UserPasswordChange,
		): Promise<void> => {
			await api.patch<void>(`${basePath}/password`, model);
		},
	};
};
