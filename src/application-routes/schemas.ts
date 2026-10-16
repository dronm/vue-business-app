import * as v from "valibot";

import {
	createCommonSchemas,
	defaultTranslate,
	type TranslateFn,
} from "../core/validation";
import type {
	ApplicationRoute,
	ApplicationRouteSyncResult,
} from "./types";

const normalizeNullableFields = (
	value: unknown,
): unknown => {
	if (typeof value !== "object" || value === null || Array.isArray(value)) {
		return value;
	}

	return {
		...value,
		icon: (value as Record<string, unknown>).icon ?? null,
	};
};

export const createApplicationRouteSchemas = (
	t: TranslateFn = defaultTranslate,
) => {
	const {
		DateStringSchema,
		IdSchema,
		RequiredStringSchema,
	} = createCommonSchemas(t);

	const OptionalIconSchema = v.nullable(
		v.pipe(
			v.string(),
			v.trim(),
			v.maxLength(250, t("validation.maxLen", { maxLen: 250 })),
		),
	);

	const ApplicationRouteSchema = v.object({
		id: IdSchema,
		name: RequiredStringSchema,
		path: v.string(),
		descr: RequiredStringSchema,
		section: RequiredStringSchema,
		icon: OptionalIconSchema,
		menu_available: v.boolean(),
		is_active: v.boolean(),
		created_at: DateStringSchema,
		updated_at: DateStringSchema,
	});
	const ApplicationRouteKeySchema = v.pick(ApplicationRouteSchema, ["id"]);
	const ApplicationRouteUpdSchema = v.partial(v.pick(ApplicationRouteSchema, [
		"descr",
		"section",
		"icon",
	]));
	const ApplicationRouteSyncResultSchema = v.object({
		registered: v.number(),
		deactivated: v.number(),
	});

	return {
		ApplicationRouteSchema,
		ApplicationRouteKeySchema,
		ApplicationRouteUpdSchema,
		ApplicationRouteSyncResultSchema,
	};
};

export type ApplicationRouteSchemas = ReturnType<typeof createApplicationRouteSchemas>;

export const applicationRouteFromDTO = (
	dto: unknown,
	schemas: ApplicationRouteSchemas,
): ApplicationRoute => {
	return v.parse(schemas.ApplicationRouteSchema, normalizeNullableFields(dto));
};

export const applicationRouteSyncResultFromDTO = (
	dto: unknown,
	schemas: ApplicationRouteSchemas,
): ApplicationRouteSyncResult => {
	return v.parse(schemas.ApplicationRouteSyncResultSchema, dto);
};
