import type {
	UserProfile,
	UserProfileUpdateBase,
} from "./types";

const reservedProfileUpdateFields = new Set<string>([
	"id",
	"name",
	"role_id",
	"pwd",
	"password",
	"new_password",
	"password_confirmation",
	"__proto__",
	"prototype",
	"constructor",
]);

export const isUserProfileExtraFieldWritable = (
	field: string,
): boolean => {
	return field.trim() !== "" && !reservedProfileUpdateFields.has(field);
};

export const setUserProfileExtraField = (
	profile: UserProfile,
	field: string,
	value: unknown,
): void => {
	if (!isUserProfileExtraFieldWritable(field)) {
		return;
	}

	profile[field] = value;
};

export const buildUserProfileUpdate = (
	profile: UserProfile,
	extraFields: readonly string[] = [],
): UserProfileUpdateBase => {
	const model: UserProfileUpdateBase = {
		name: profile.name.trim(),
	};

	for (const field of extraFields) {
		if (!isUserProfileExtraFieldWritable(field)) {
			continue;
		}

		model[field] = profile[field];
	}

	return model;
};
