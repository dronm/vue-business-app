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
	applicationRouteFromDTO,
	applicationRouteSyncResultFromDTO,
	createApplicationRouteSchemas,
} from "./schemas";
import type {
	ApplicationRoute,
	ApplicationRouteDTO,
	ApplicationRouteKey,
	ApplicationRouteManifestItem,
	ApplicationRouteNew,
	ApplicationRouteSyncResult,
	ApplicationRouteUpd,
} from "./types";

const basePath = "/application-routes";

export const createApplicationRouteApi = (
	api: BusinessAppApi,
	t: TranslateFn = defaultTranslate,
) => {
	const schemas = createApplicationRouteSchemas(t);
	const crudApi = createCrudApi<
		ApplicationRoute,
		ApplicationRouteDTO,
		ApplicationRoute,
		ApplicationRouteDTO,
		ApplicationRouteKey,
		ApplicationRouteNew,
		ApplicationRouteUpd
	>({
		api: asCollectionConn(api),
		basePath,
		serviceName: "ApplicationRoute",
		getKeyValue: (
			key: ApplicationRouteKey,
		): number => key.id,
		fromListDTO: (
			dto: unknown,
		): ApplicationRoute => applicationRouteFromDTO(dto, schemas),
		fromDetailDTO: (
			dto: unknown,
		): ApplicationRoute => applicationRouteFromDTO(dto, schemas),
	});

	return {
		...crudApi,
		sync: async (
			items: readonly ApplicationRouteManifestItem[],
		): Promise<ApplicationRouteSyncResult> => {
			const response = await api.post<unknown>(`${basePath}/sync`, {
				items: [...items],
			});

			return applicationRouteSyncResultFromDTO(response, schemas);
		},
	};
};
