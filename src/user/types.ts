export interface UserBase<TRoleId extends string = string> {
	id: number;
	name: string;
	role_id: TRoleId;
}

export type UserBaseDTO<TRoleId extends string = string> = UserBase<TRoleId>;
export type UserKeyBase = Pick<UserBase, "id">;

export interface UserNewBase<TRoleId extends string = string> {
	name: string;
	role_id: TRoleId;
	pwd: string;
}

export type UserUpdBase<TRoleId extends string = string> = Partial<UserNewBase<TRoleId>>;

export interface UserUpdateBase<TRoleId extends string = string> {
	key: UserKeyBase;
	model: UserUpdBase<TRoleId>;
}

export interface UserLoginRequestBase {
	name: string;
	pwd: string;
}

/**
 * Common fields of the currently authenticated user's self-service profile.
 * Projects may extend the profile DTO with arbitrary additional attributes.
 */
export interface UserProfileBase {
	id: number;
	name: string;
}

export type UserProfile = UserProfileBase & Record<string, unknown>;

/**
 * Common writable profile fields. Additional project fields are allowed, but
 * the shared view only submits fields explicitly registered through
 * `extraFields`.
 */
export type UserProfileUpdateBase = {
	name: string;
} & Record<string, unknown>;

export interface UserPasswordChange {
	new_password: string;
}

export interface UserProfileFieldsSlotProps {
	model: UserProfile;
	setField: (field: string, value: unknown) => void;
	disabled: boolean;
}
