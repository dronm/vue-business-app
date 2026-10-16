import type { Conn } from "@katren/vue-collection-lib/api/Conn";

/**
 * Public HTTP client contract used by vue-business-app.
 *
 * Conn contains protected members, so using Conn directly in a public API makes
 * two installations of @katren/vue-collection-lib nominally incompatible even
 * when their public HTTP surface is identical. Mapping its public keys produces
 * a structural type and keeps consumers decoupled from the library instance
 * used to compile vue-business-app itself.
 */
export type BusinessAppApi = {
	[K in keyof Conn]: Conn[K];
};

/** Internal bridge for APIs implemented with vue-collection-lib's createCrudApi. */
export const asCollectionConn = (
	api: BusinessAppApi,
): Conn => api as unknown as Conn;
