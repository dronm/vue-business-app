export interface ApplicationRouteDTO {
	id: number;
	name: string;
	path: string;
	descr: string;
	section: string;
	icon?: string | null;
	menu_available: boolean;
	is_active: boolean;
	created_at: string;
	updated_at: string;
}

export interface ApplicationRoute extends ApplicationRouteDTO {
	icon: string | null;
}

export type ApplicationRouteKey = Pick<ApplicationRoute, "id">;

export interface ApplicationRouteUpd {
	descr?: string;
	section?: string;
	icon?: string | null;
}

export type ApplicationRouteNew = ApplicationRouteUpd;

export interface ApplicationRouteManifestItem {
	name: string;
	path: string;
	descr: string;
	section: string;
	icon: string | null;
	menu_available: boolean;
}

export interface ApplicationRouteSyncInput {
	items: ApplicationRouteManifestItem[];
}

export interface ApplicationRouteSyncResult {
	registered: number;
	deactivated: number;
}
