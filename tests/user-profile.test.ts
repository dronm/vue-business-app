import {
	describe,
	expect,
	it,
} from "vitest";

import {
	buildUserProfileUpdate,
	setUserProfileExtraField,
} from "../src/user/profile";
import type { UserProfile } from "../src/user/types";

describe("user profile extension fields", () => {
	it("submits only explicitly registered non-reserved fields", () => {
		const profile: UserProfile = {
			id: 7,
			name: " User ",
			role_id: "admin",
			email: "user@example.com",
			department_id: 12,
		};

		expect(buildUserProfileUpdate(profile, [
			"email",
			"department_id",
			"role_id",
			"id",
		])).toEqual({
			name: "User",
			email: "user@example.com",
			department_id: 12,
		});
	});

	it("does not let an extension slot mutate reserved profile fields", () => {
		const profile: UserProfile = {
			id: 7,
			name: "User",
			role_id: "accountant",
		};

		setUserProfileExtraField(profile, "role_id", "admin");
		setUserProfileExtraField(profile, "email", "new@example.com");

		expect(profile.role_id).toBe("accountant");
		expect(profile.email).toBe("new@example.com");
	});
});
