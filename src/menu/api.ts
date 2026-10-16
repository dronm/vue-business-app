import type * as v from "valibot";

import {
	createCrudApi,
} from "@katren/vue-collection-lib";

import {
	asCollectionConn,
	type BusinessAppApi,
} from "../core/api";
import {
	defaultTranslate,
	type TranslateFn,
} from "../core/validation";
import {
	createMainMenuSchemas,
	mainMenuForUserFromDTO,
	mainMenuFromDTO,
	mainMenuListFromDTO,
	mainMenuRouteOptionFromDTO,
} from "./schemas";
import type {
	MainMenu,
	MainMenuDTO,
	MainMenuForUser,
	MainMenuKey,
	MainMenuList,
	MainMenuListDTO,
	MainMenuNew,
	MainMenuRouteOption,
	MainMenuUpd,
} from "./types";

const basePath = "/main-menus";

export const createMainMenuApi = <TRoleId extends string>(
	api: BusinessAppApi,
	roleIdSchema: v.GenericSchema<TRoleId>,
	t: TranslateFn = defaultTranslate,
) => {
	const schemas = createMainMenuSchemas(roleIdSchema, t);
	const crudApi = createCrudApi<
		MainMenuList<TRoleId>,
		MainMenuListDTO<TRoleId>,
		MainMenu<TRoleId>,
		MainMenuDTO<TRoleId>,
		MainMenuKey,
		MainMenuNew<TRoleId>,
		MainMenuUpd<TRoleId>
	>({
		api: asCollectionConn(api),
		basePath,
		serviceName: "MainMenu",
		getKeyValue: (
			key: MainMenuKey,
		): number => key.id,
		fromListDTO: (
			dto: unknown,
		): MainMenuList<TRoleId> => mainMenuListFromDTO(dto, schemas),
		fromDetailDTO: (
			dto: unknown,
		): MainMenu<TRoleId> => mainMenuFromDTO(dto, schemas),
	});

	return {
		...crudApi,
		forUser: async (): Promise<MainMenuForUser[]> => {
			const response = await api.get<unknown[]>(`${basePath}/for-user`);
			return response.map((dto) => mainMenuForUserFromDTO(dto, schemas));
		},
		routeAutocomplete: async (
			query: string,
			limit: number = 20,
		): Promise<MainMenuRouteOption[]> => {
			const params = new URLSearchParams({
				q: query.trim(),
				limit: String(limit),
			});
			const response = await api.get<unknown[]>(
				`${basePath}/routes/autocomplete?${params.toString()}`,
			);

			return response.map((dto) => mainMenuRouteOptionFromDTO(dto, schemas));
		},
	};
};
