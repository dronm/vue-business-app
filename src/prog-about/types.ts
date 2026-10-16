export interface ProgAboutAuthorDTO {
	name: string;
	email: string;
}

export type ProgAboutAuthor = ProgAboutAuthorDTO;

export interface ProgAboutBackendDTO {
	version: string;
	build_date: string;
	commit: string;
	ip: string;
}

export type ProgAboutBackend = ProgAboutBackendDTO;

export interface ProgAboutDBDTO {
	server_type: string;
	server_version: string;
	migration: string;
}

export type ProgAboutDB = ProgAboutDBDTO;

export interface ProgAboutDTO {
	name: string;
	author: ProgAboutAuthorDTO;
	db: ProgAboutDBDTO | null;
	updated_at: string;
	backend: ProgAboutBackendDTO;
}

export interface ProgAbout {
	name: string;
	author: ProgAboutAuthor;
	db: ProgAboutDB | null;
	updated_at: Date;
	backend: ProgAboutBackend;
}
