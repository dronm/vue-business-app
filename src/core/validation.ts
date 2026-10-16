import * as v from "valibot";

export type TranslateFn = (
	key: string,
	params?: Record<string, unknown>,
) => string;

export const defaultTranslate: TranslateFn = (
	key: string,
	params: Record<string, unknown> = {},
): string => {
	return Object.entries(params).reduce(
		(result, [name, value]) => result.replace(`{${name}}`, String(value)),
		key,
	);
};

export const createCommonSchemas = (
	t: TranslateFn = defaultTranslate,
) => {
	const RequiredStringSchema = v.pipe(
		v.string(t("validation.required")),
		v.trim(),
		v.nonEmpty(t("validation.required")),
		v.maxLength(1024, t("validation.maxLen", { maxLen: 1024 })),
	);

	const StringSchema = v.pipe(
		v.string(t("validation.required")),
		v.trim(),
		v.maxLength(1024, t("validation.maxLen", { maxLen: 1024 })),
	);

	const DateStringSchema = v.pipe(
		v.string(t("validation.required")),
		v.nonEmpty(t("validation.required")),
	);

	const IntSchema = v.pipe(
		v.number(t("validation.required")),
		v.integer(t("validation.dataTypeInt")),
	);

	const IdSchema = v.pipe(
		IntSchema,
		v.minValue(1, t("validation.minVal", { minVal: 1 })),
	);

	return {
		RequiredStringSchema,
		StringSchema,
		DateStringSchema,
		IntSchema,
		IdSchema,
	};
};
