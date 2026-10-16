import * as v from "valibot";

import {
	createCommonSchemas,
	defaultTranslate,
	type TranslateFn,
} from "../core/validation";
import type {
	ObjectHistoryResponse,
	ObjectHistoryRow,
} from "./types";

export const createObjectHistorySchemas = (
	t: TranslateFn = defaultTranslate,
) => {
	const {
		DateStringSchema,
		IdSchema,
		RequiredStringSchema,
		StringSchema,
	} = createCommonSchemas(t);

	const ObjectHistoryChangeSchema = v.object({
		column: RequiredStringSchema,
		field: RequiredStringSchema,
		old: v.unknown(),
		new: v.unknown(),
		old_description: v.optional(v.nullable(StringSchema)),
		new_description: v.optional(v.nullable(StringSchema)),
	});

	const ObjectHistoryRowDTOSchema = v.object({
		id: IdSchema,
		changed_at: DateStringSchema,
		operation: RequiredStringSchema,
		changed_by: v.nullable(StringSchema),
		changes: v.array(ObjectHistoryChangeSchema),
	});

	const ObjectHistoryRowSchema = v.object({
		id: IdSchema,
		changed_at: v.date(t("validation.required")),
		operation: RequiredStringSchema,
		changed_by: v.nullable(StringSchema),
		changes: v.array(ObjectHistoryChangeSchema),
	});

	const TotalSchema = v.pipe(
		v.number(t("validation.required")),
		v.integer(t("validation.dataTypeInt")),
		v.minValue(0, t("validation.minVal", { minVal: 0 })),
	);

	const ObjectHistoryResponseDTOSchema = v.object({
		rows: v.array(ObjectHistoryRowDTOSchema),
		total: TotalSchema,
	});

	const ObjectHistoryResponseSchema = v.object({
		rows: v.array(ObjectHistoryRowSchema),
		total: TotalSchema,
	});

	return {
		ObjectHistoryChangeSchema,
		ObjectHistoryRowDTOSchema,
		ObjectHistoryRowSchema,
		ObjectHistoryResponseDTOSchema,
		ObjectHistoryResponseSchema,
	};
};

export type ObjectHistorySchemas = ReturnType<typeof createObjectHistorySchemas>;

export const objectHistoryResponseFromDTO = (
	dto: unknown,
	schemas: ObjectHistorySchemas,
): ObjectHistoryResponse => {
	const parsedDTO = v.parse(schemas.ObjectHistoryResponseDTOSchema, dto);
	const rows: ObjectHistoryRow[] = parsedDTO.rows.map((row) => ({
		...row,
		changed_at: new Date(row.changed_at),
	}));

	return v.parse(schemas.ObjectHistoryResponseSchema, {
		rows,
		total: parsedDTO.total,
	});
};
