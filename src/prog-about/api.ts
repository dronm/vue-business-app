import type { BusinessAppApi } from "../core/api";

import {
	defaultTranslate,
	type TranslateFn,
} from "../core/validation";
import {
	createProgAboutSchemas,
	progAboutFromDTO,
} from "./schemas";
import type { ProgAbout } from "./types";

export const createProgAboutApi = (
	api: BusinessAppApi,
	t: TranslateFn = defaultTranslate,
) => {
	const schemas = createProgAboutSchemas(t);

	return {
		info: async (): Promise<ProgAbout> => {
			const response = await api.get<unknown>("/prog-about/info");
			return progAboutFromDTO(response, schemas);
		},
	};
};
