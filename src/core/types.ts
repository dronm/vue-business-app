import type { RouteLocationRaw } from "vue-router";
import type * as v from "valibot";

import type { BusinessAppApi } from "./api";

import type { ApplicationRouteManifestItem } from "../application-routes/types";
import type { TranslateFn } from "./validation";

export interface AppBranding {
	logoUrl?: string;
	logoAlt?: string;
	title: string;
	subtitle?: string;
	fallbackMark?: string;
}

export interface RoleOption<TRoleId extends string = string> {
	value: TRoleId;
	label: string;
}

export interface UserReferenceRoutes {
	list?: RouteLocationRaw;
	edit?: (
		id: number,
	) => RouteLocationRaw;
}

export interface BusinessAppRoleConfig<TRoleId extends string = string> {
	options: readonly RoleOption<TRoleId>[];
	defaultRoleId?: TRoleId | null;
	schema?: v.GenericSchema<TRoleId>;
}

export interface BusinessAppConfig<TRoleId extends string = string> {
	api: BusinessAppApi;
	branding: AppBranding;
	applicationRouteManifest?: readonly ApplicationRouteManifestItem[];
	roles?: BusinessAppRoleConfig<TRoleId>;
	userReferenceRoutes?: UserReferenceRoutes;
	mainMenuChangedEventName?: string;
	translate?: TranslateFn;
}
