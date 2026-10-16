import * as v from "valibot";

import {
	createCommonSchemas,
	defaultTranslate,
	type TranslateFn,
} from "../core/validation";
import type { UserBase } from "./types";

export const createUserBaseSchemas = <TRoleId extends string>(
	roleIdSchema: v.GenericSchema<TRoleId>,
	t: TranslateFn = defaultTranslate,
) => {
	const {
		IdSchema,
	} = createCommonSchemas(t);

	const UserIdSchema = IdSchema;
	const UserNameSchema = v.pipe(
		v.string(t("validation.required")),
		v.trim(),
		v.nonEmpty(t("validation.required")),
		v.maxLength(100, t("validation.maxLen", { maxLen: 100 })),
	);
	const UserPasswordSchema = v.pipe(
		v.string(t("validation.required")),
		v.nonEmpty(t("validation.required")),
		v.maxLength(50, t("validation.maxLen", { maxLen: 50 })),
	);

	const UserBaseEntries = {
		id: UserIdSchema,
		name: UserNameSchema,
		role_id: roleIdSchema,
	};
	const UserBaseSchema = v.object(UserBaseEntries);
	const UserKeyBaseSchema = v.object({
		id: UserIdSchema,
	});

	const UserNewBaseEntries = {
		name: UserNameSchema,
		role_id: roleIdSchema,
		pwd: UserPasswordSchema,
	};
	const UserNewBaseSchema = v.object(UserNewBaseEntries);
	const UserUpdBaseSchema = v.partial(UserNewBaseSchema);
	const UserUpdateBaseSchema = v.object({
		key: UserKeyBaseSchema,
		model: UserUpdBaseSchema,
	});
	const UserLoginRequestBaseSchema = v.object({
		name: UserNameSchema,
		pwd: UserPasswordSchema,
	});

	return {
		UserIdSchema,
		UserNameSchema,
		UserPasswordSchema,
		UserBaseEntries,
		UserBaseSchema,
		UserKeyBaseSchema,
		UserNewBaseEntries,
		UserNewBaseSchema,
		UserUpdBaseSchema,
		UserUpdateBaseSchema,
		UserLoginRequestBaseSchema,
	};
};

export type UserBaseSchemas<TRoleId extends string = string> = ReturnType<
	typeof createUserBaseSchemas<TRoleId>
>;

export const userBaseFromDTO = <TRoleId extends string>(
	dto: unknown,
	schemas: UserBaseSchemas<TRoleId>,
): UserBase<TRoleId> => {
	return v.parse(schemas.UserBaseSchema, dto);
};
