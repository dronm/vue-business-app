import * as v from "valibot";

import {
	createCommonSchemas,
	defaultTranslate,
	type TranslateFn,
} from "../core/validation";
import type {
	MainMenu,
	MainMenuForUser,
	MainMenuList,
	MainMenuRouteOption,
	MenuItem,
} from "./types";

const isRecord = (
	value: unknown,
): value is Record<string, unknown> => {
	return typeof value === "object" && value !== null && !Array.isArray(value);
};

const normalizeNullableFields = (
	value: unknown,
): unknown => {
	if (!isRecord(value)) {
		return value;
	}

	return {
		...value,
		icon: value.icon ?? null,
		route_name: value.route_name ?? null,
		application_routes_ref: value.application_routes_ref ?? null,
	};
};

const normalizeMenuItemDTO = (
	value: unknown,
): unknown => {
	if (!isRecord(value)) {
		return value;
	}

	const children = Array.isArray(value.children)
		? value.children.map(normalizeMenuItemDTO)
		: null;

	return {
		...value,
		icon: value.icon ?? null,
		children,
	};
};

const normalizeRouteOption = (
	value: unknown,
): unknown => {
	if (!isRecord(value)) {
		return value;
	}

	return {
		...value,
		icon: value.icon ?? null,
	};
};

export const createMainMenuSchemas = <TRoleId extends string>(
	roleIdSchema: v.GenericSchema<TRoleId>,
	t: TranslateFn = defaultTranslate,
) => {
	const {
		DateStringSchema,
		IdSchema,
		IntSchema,
	} = createCommonSchemas(t);

	const MainMenuIdSchema = IdSchema;
	const MainMenuCaptionSchema = v.pipe(
		v.string(t("validation.required")),
		v.trim(),
		v.nonEmpty(t("validation.required")),
		v.maxLength(250, t("validation.maxLen", { maxLen: 250 })),
	);
	const NullableTextSchema = v.nullable(
		v.pipe(
			v.string(),
			v.trim(),
			v.maxLength(250, t("validation.maxLen", { maxLen: 250 })),
		),
	);
	const ReferenceSchema = v.object({
		keys: v.object({
			id: IdSchema,
		}),
		descr: v.string(),
	});

	const MainMenuSchema = v.object({
		id: MainMenuIdSchema,
		role_id: v.nullable(roleIdSchema),
		user_id: v.nullable(IdSchema),
		parent_id: v.nullable(IdSchema),
		route_id: v.nullable(IdSchema),
		caption: MainMenuCaptionSchema,
		icon: NullableTextSchema,
		sort_order: IntSchema,
		is_active: v.boolean(),
		created_at: DateStringSchema,
		updated_at: DateStringSchema,
	});
	const MainMenuKeySchema = v.pick(MainMenuSchema, ["id"]);

	const MenuItemSchema: v.GenericSchema<MenuItem> = v.object({
		id: MainMenuIdSchema,
		caption: MainMenuCaptionSchema,
		route: v.string(),
		icon: NullableTextSchema,
		children: v.nullable(
			v.array(
				v.lazy((): v.GenericSchema<MenuItem> => MenuItemSchema),
			),
		),
	});

	const MainMenuListSchema = v.object({
		id: MainMenuIdSchema,
		role_id: v.nullable(roleIdSchema),
		users_ref: v.nullable(ReferenceSchema),
		main_menus_ref: v.nullable(ReferenceSchema),
		application_routes_ref: v.nullable(ReferenceSchema),
		route_name: v.nullable(v.string()),
		caption: MainMenuCaptionSchema,
		icon: NullableTextSchema,
		sort_order: IntSchema,
		is_active: v.boolean(),
		created_at: DateStringSchema,
		updated_at: DateStringSchema,
	});

	const MainMenuNewSchema = v.object({
		role_id: v.nullable(roleIdSchema),
		user_id: v.nullable(IdSchema),
		parent_id: v.nullable(IdSchema),
		route_id: v.nullable(IdSchema),
		caption: MainMenuCaptionSchema,
		icon: NullableTextSchema,
		sort_order: IntSchema,
		is_active: v.boolean(),
	});
	const MainMenuUpdSchema = v.partial(MainMenuNewSchema);
	const MainMenuUpdateSchema = v.object({
		key: MainMenuKeySchema,
		model: MainMenuUpdSchema,
	});

	const MainMenuRouteOptionSchema = v.object({
		id: IdSchema,
		name: v.string(),
		path: v.string(),
		descr: v.string(),
		section: v.string(),
		icon: NullableTextSchema,
	});

	return {
		MainMenuIdSchema,
		MainMenuCaptionSchema,
		MainMenuSchema,
		MainMenuKeySchema,
		MenuItemSchema,
		MainMenuForUserSchema: MenuItemSchema,
		MainMenuListSchema,
		MainMenuNewSchema,
		MainMenuUpdSchema,
		MainMenuUpdateSchema,
		MainMenuRouteOptionSchema,
	};
};

export type MainMenuSchemas<TRoleId extends string = string> = ReturnType<
	typeof createMainMenuSchemas<TRoleId>
>;

export const mainMenuFromDTO = <TRoleId extends string>(
	dto: unknown,
	schemas: MainMenuSchemas<TRoleId>,
): MainMenu<TRoleId> => {
	return v.parse(schemas.MainMenuSchema, normalizeNullableFields(dto));
};

export const mainMenuListFromDTO = <TRoleId extends string>(
	dto: unknown,
	schemas: MainMenuSchemas<TRoleId>,
): MainMenuList<TRoleId> => {
	return v.parse(schemas.MainMenuListSchema, normalizeNullableFields(dto));
};

export const mainMenuForUserFromDTO = <TRoleId extends string>(
	dto: unknown,
	schemas: MainMenuSchemas<TRoleId>,
): MainMenuForUser => {
	return v.parse(schemas.MainMenuForUserSchema, normalizeMenuItemDTO(dto));
};

export const mainMenuRouteOptionFromDTO = <TRoleId extends string>(
	dto: unknown,
	schemas: MainMenuSchemas<TRoleId>,
): MainMenuRouteOption => {
	return v.parse(schemas.MainMenuRouteOptionSchema, normalizeRouteOption(dto));
};
