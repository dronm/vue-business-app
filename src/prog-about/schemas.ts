import * as v from "valibot";

import {
	createCommonSchemas,
	defaultTranslate,
	type TranslateFn,
} from "../core/validation";
import type { ProgAbout } from "./types";

export const createProgAboutSchemas = (
	t: TranslateFn = defaultTranslate,
) => {
	const {
		DateStringSchema,
		StringSchema,
	} = createCommonSchemas(t);

	const ProgAboutAuthorSchema = v.object({
		name: StringSchema,
		email: StringSchema,
	});

	const ProgAboutBackendSchema = v.object({
		version: StringSchema,
		build_date: StringSchema,
		commit: StringSchema,
		ip: StringSchema,
	});

	const ProgAboutDBSchema = v.object({
		server_type: StringSchema,
		server_version: StringSchema,
		migration: StringSchema,
	});

	const ProgAboutDTOSchema = v.object({
		name: StringSchema,
		author: ProgAboutAuthorSchema,
		db: v.nullable(ProgAboutDBSchema),
		updated_at: DateStringSchema,
		backend: ProgAboutBackendSchema,
	});

	const ProgAboutSchema = v.object({
		name: StringSchema,
		author: ProgAboutAuthorSchema,
		db: v.nullable(ProgAboutDBSchema),
		updated_at: v.date(t("validation.required")),
		backend: ProgAboutBackendSchema,
	});

	return {
		ProgAboutAuthorSchema,
		ProgAboutBackendSchema,
		ProgAboutDBSchema,
		ProgAboutDTOSchema,
		ProgAboutSchema,
	};
};

export type ProgAboutSchemas = ReturnType<typeof createProgAboutSchemas>;

export const progAboutFromDTO = (
	dto: unknown,
	schemas: ProgAboutSchemas,
): ProgAbout => {
	const parsedDTO = v.parse(schemas.ProgAboutDTOSchema, dto);

	return v.parse(schemas.ProgAboutSchema, {
		...parsedDTO,
		updated_at: new Date(parsedDTO.updated_at),
	});
};
