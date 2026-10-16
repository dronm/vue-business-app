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
	createUserBaseSchemas,
	userBaseFromDTO,
} from "./schemas";
import type {
	UserBase,
	UserBaseDTO,
	UserKeyBase,
	UserNewBase,
	UserUpdBase,
} from "./types";

export const createUserApi = <TRoleId extends string>(
	api: BusinessAppApi,
	roleIdSchema: v.GenericSchema<TRoleId>,
	t: TranslateFn = defaultTranslate,
) => {
	const schemas = createUserBaseSchemas(roleIdSchema, t);

	return createCrudApi<
		UserBase<TRoleId>,
		UserBaseDTO<TRoleId>,
		UserBase<TRoleId>,
		UserBaseDTO<TRoleId>,
		UserKeyBase,
		UserNewBase<TRoleId>,
		UserUpdBase<TRoleId>
	>({
		api: asCollectionConn(api),
		basePath: "/users",
		serviceName: "User",
		getKeyValue: (
			key: UserKeyBase,
		): number => key.id,
		fromListDTO: (
			dto: unknown,
		): UserBase<TRoleId> => userBaseFromDTO(dto, schemas),
		fromDetailDTO: (
			dto: unknown,
		): UserBase<TRoleId> => userBaseFromDTO(dto, schemas),
	});
};
