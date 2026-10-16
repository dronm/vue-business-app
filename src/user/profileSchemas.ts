import * as v from "valibot";

import {
	createCommonSchemas,
	defaultTranslate,
	type TranslateFn,
} from "../core/validation";
import type {
	UserProfile,
	UserProfileBase,
} from "./types";

export const createUserProfileSchemas = (
	t: TranslateFn = defaultTranslate,
) => {
	const {
		IdSchema,
	} = createCommonSchemas(t);

	const UserProfileNameSchema = v.pipe(
		v.string(t("validation.required")),
		v.trim(),
		v.nonEmpty(t("validation.required")),
		v.maxLength(100, t("validation.maxLen", { maxLen: 100 })),
	);
	const UserProfilePasswordSchema = v.pipe(
		v.string(t("validation.required")),
		v.nonEmpty(t("validation.required")),
		v.maxLength(50, t("validation.maxLen", { maxLen: 50 })),
	);
	const UserProfileBaseSchema = v.object({
		id: IdSchema,
		name: UserProfileNameSchema,
	});

	return {
		UserProfileNameSchema,
		UserProfilePasswordSchema,
		UserProfileBaseSchema,
	};
};

export type UserProfileSchemas = ReturnType<typeof createUserProfileSchemas>;

export const userProfileFromDTO = (
	dto: unknown,
	schemas: UserProfileSchemas,
): UserProfile => {
	const base = v.parse(schemas.UserProfileBaseSchema, dto) as UserProfileBase;
	const extra = typeof dto === "object" && dto !== null && !Array.isArray(dto)
		? dto as Record<string, unknown>
		: {};

	return {
		...extra,
		...base,
	};
};
