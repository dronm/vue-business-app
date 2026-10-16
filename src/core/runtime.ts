import {
	inject,
	type App,
	type InjectionKey,
	type Plugin,
} from "vue";
import * as v from "valibot";

import { createApplicationRouteApi } from "../application-routes/api";
import { defaultTranslate } from "./validation";
import { createMainMenuApi } from "../menu/api";
import { createObjectHistoryApi } from "../object-history/api";
import { createProgAboutApi } from "../prog-about/api";
import { createUserApi } from "../user/api";
import { createUserProfileApi } from "../user/profileApi";
import type {
	BusinessAppConfig,
	RoleOption,
} from "./types";

const DEFAULT_MENU_CHANGED_EVENT = "main-menu-changed";

export interface BusinessAppRuntime {
	config: BusinessAppConfig<string>;
	roleOptions: readonly RoleOption<string>[];
	defaultRoleId: string | null;
	mainMenuChangedEventName: string;
	apis: {
		applicationRoute: ReturnType<typeof createApplicationRouteApi>;
		mainMenu: ReturnType<typeof createMainMenuApi<string>>;
		objectHistory: ReturnType<typeof createObjectHistoryApi>;
		progAbout: ReturnType<typeof createProgAboutApi>;
		user: ReturnType<typeof createUserApi<string>>;
		userProfile: ReturnType<typeof createUserProfileApi>;
	};
}

const BUSINESS_APP_KEY: InjectionKey<BusinessAppRuntime> = Symbol("vue-business-app");

const createRuntime = <TRoleId extends string>(
	config: BusinessAppConfig<TRoleId>,
): BusinessAppRuntime => {
	const translate = config.translate ?? defaultTranslate;
	const roleSchema = (config.roles?.schema ?? v.string()) as v.GenericSchema<string>;
	const roleOptions = (config.roles?.options ?? []) as readonly RoleOption<string>[];
	const defaultRoleId = config.roles?.defaultRoleId
		?? roleOptions[0]?.value
		?? null;

	const normalizedConfig = config as unknown as BusinessAppConfig<string>;

	return {
		config: normalizedConfig,
		roleOptions,
		defaultRoleId,
		mainMenuChangedEventName: config.mainMenuChangedEventName ?? DEFAULT_MENU_CHANGED_EVENT,
		apis: {
			applicationRoute: createApplicationRouteApi(config.api, translate),
			mainMenu: createMainMenuApi<string>(config.api, roleSchema, translate),
			objectHistory: createObjectHistoryApi(config.api, translate),
			progAbout: createProgAboutApi(config.api, translate),
			user: createUserApi<string>(config.api, roleSchema, translate),
			userProfile: createUserProfileApi(config.api, translate),
		},
	};
};

export const createBusinessApp = <TRoleId extends string>(
	config: BusinessAppConfig<TRoleId>,
): Plugin => {
	const runtime = createRuntime(config);

	return {
		install: (
			app: App,
		): void => {
			app.provide(BUSINESS_APP_KEY, runtime);
		},
	};
};

export const useBusinessApp = (): BusinessAppRuntime => {
	const runtime = inject(BUSINESS_APP_KEY, null);
	if (runtime === null) {
		throw new Error(
			"@katren/vue-business-app is not configured. Install createBusinessApp(...) on the Vue application first.",
		);
	}

	return runtime;
};
