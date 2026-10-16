import type { BusinessAppApi } from "../core/api";
import {
	defaultTranslate,
	type TranslateFn,
} from "../core/validation";
import {
	createObjectHistorySchemas,
	objectHistoryResponseFromDTO,
} from "./schemas";
import type {
	ObjectHistoryListQuery,
	ObjectHistoryResponse,
} from "./types";

const basePath = "/object-history";

export const createObjectHistoryApi = (
	api: BusinessAppApi,
	t: TranslateFn = defaultTranslate,
) => {
	const schemas = createObjectHistorySchemas(t);

	return {
		list: async (
			query: ObjectHistoryListQuery,
			signal?: AbortSignal,
		): Promise<ObjectHistoryResponse> => {
			const params = new URLSearchParams({
				object_type: query.objectType.trim(),
				object_id: String(query.objectId).trim(),
			});
			if (query.from !== undefined) {
				params.set("from", String(query.from));
			}
			if (query.count !== undefined) {
				params.set("count", String(query.count));
			}

			const response = await api.get<unknown>(
				`${basePath}?${params.toString()}`,
				undefined,
				{ signal },
			);
			return objectHistoryResponseFromDTO(response, schemas);
		},
	};
};
