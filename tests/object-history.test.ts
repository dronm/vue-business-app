import {
	describe,
	expect,
	it,
} from "vitest";

import {
	createObjectHistorySchemas,
	formatObjectHistoryDateTime,
	formatObjectHistoryValue,
	objectHistoryResponseFromDTO,
} from "../src/object-history";

describe("object history", () => {
	it("parses response dates and keeps typed change values", () => {
		const result = objectHistoryResponseFromDTO({
			rows: [
				{
					id: 1,
					changed_at: "2026-08-22T08:10:27+05:00",
					operation: "U",
					changed_by: "skstruktura",
					changes: [
						{
							column: "is_active",
							field: "Активен",
							old: true,
							new: false,
						},
					],
				},
			],
			total: 1,
		}, createObjectHistorySchemas());

		expect(result.rows[0].changed_at).toBeInstanceOf(Date);
		expect(result.rows[0].changes[0].old).toBe(true);
	});

	it("formats Russian dates and reference descriptions", () => {
		const date = new Date(2026, 7, 22, 8, 10, 27);
		expect(formatObjectHistoryDateTime(date, "ru-RU")).toBe("22/08/2026 08:10:27");
		expect(formatObjectHistoryValue(1, "Объект 1", {
			yes: "Да",
			no: "Нет",
		})).toBe("Объект 1");
		expect(formatObjectHistoryValue(false, null, {
			yes: "Да",
			no: "Нет",
		})).toBe("Нет");
	});
});
