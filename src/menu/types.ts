import type { ApplicationRouteKey } from "../application-routes/types";
import type { ReferenceBase } from "../core/reference";
import type { UserKeyBase } from "../user/types";

export interface MenuItem {
	id: number;
	caption: string;
	route: string;
	icon: string | null;
	children: MenuItem[] | null;
}

export type MainMenuForUser = MenuItem;

export interface MainMenuDTO<TRoleId extends string = string> {
	id: number;
	role_id: TRoleId | null;
	user_id: number | null;
	parent_id: number | null;
	route_id: number | null;
	caption: string;
	icon?: string | null;
	sort_order: number;
	is_active: boolean;
	created_at: string;
	updated_at: string;
}

export interface MainMenu<TRoleId extends string = string> {
	id: number;
	role_id: TRoleId | null;
	user_id: number | null;
	parent_id: number | null;
	route_id: number | null;
	caption: string;
	icon: string | null;
	sort_order: number;
	is_active: boolean;
	created_at: string;
	updated_at: string;
}

export type MainMenuDetail<TRoleId extends string = string> = MainMenu<TRoleId>;
export type MainMenuKey = Pick<MainMenu, "id">;

export interface MainMenuListDTO<TRoleId extends string = string> {
	id: number;
	role_id: TRoleId | null;
	users_ref: ReferenceBase<UserKeyBase> | null;
	main_menus_ref: ReferenceBase<MainMenuKey> | null;
	application_routes_ref: ReferenceBase<ApplicationRouteKey> | null;
	route_name?: string | null;
	caption: string;
	icon?: string | null;
	sort_order: number;
	is_active: boolean;
	created_at: string;
	updated_at: string;
}

export interface MainMenuList<TRoleId extends string = string> {
	id: number;
	role_id: TRoleId | null;
	users_ref: ReferenceBase<UserKeyBase> | null;
	main_menus_ref: ReferenceBase<MainMenuKey> | null;
	application_routes_ref: ReferenceBase<ApplicationRouteKey> | null;
	route_name: string | null;
	caption: string;
	icon: string | null;
	sort_order: number;
	is_active: boolean;
	created_at: string;
	updated_at: string;
}

export interface MainMenuTreeItem<TRoleId extends string = string> extends MainMenuList<TRoleId> {
	parent_id: number | null;
	user_id: number | null;
	route_id: number | null;
	children: MainMenuTreeItem<TRoleId>[];
}

export interface MainMenuNew<TRoleId extends string = string> {
	role_id: TRoleId | null;
	user_id: number | null;
	parent_id: number | null;
	route_id: number | null;
	caption: string;
	icon: string | null;
	sort_order: number;
	is_active: boolean;
}

export type MainMenuUpd<TRoleId extends string = string> = Partial<MainMenuNew<TRoleId>>;

export interface MainMenuUpdate<TRoleId extends string = string> {
	key: MainMenuKey;
	model: MainMenuUpd<TRoleId>;
}

export interface MainMenuRouteOption {
	id: number;
	name: string;
	path: string;
	descr: string;
	section: string;
	icon: string | null;
}
