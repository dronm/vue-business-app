export interface ObjectHistoryValueLabels {
	yes: string;
	no: string;
	empty?: string;
}

const dateTimeParts = (
	value: Date,
	locale: string,
): Map<string, string> => {
	const formatter = new Intl.DateTimeFormat(locale, {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
		hourCycle: "h23",
	});

	return new Map(
		formatter
			.formatToParts(value)
			.filter((part) => part.type !== "literal")
			.map((part) => [part.type, part.value]),
	);
};

export const formatObjectHistoryDateTime = (
	value: Date,
	locale: string = "ru-RU",
): string => {
	if (Number.isNaN(value.getTime())) {
		return "—";
	}

	const parts = dateTimeParts(value, locale);
	return `${parts.get("day")}/${parts.get("month")}/${parts.get("year")} ${parts.get("hour")}:${parts.get("minute")}:${parts.get("second")}`;
};

export const formatObjectHistoryValue = (
	value: unknown,
	description: string | null | undefined,
	labels: ObjectHistoryValueLabels,
): string => {
	const normalizedDescription = description?.trim() ?? "";
	if (normalizedDescription !== "") {
		return normalizedDescription;
	}

	if (value === null || value === undefined || value === "") {
		return labels.empty ?? "—";
	}
	if (typeof value === "boolean") {
		return value ? labels.yes : labels.no;
	}
	if (typeof value === "string" || typeof value === "number" || typeof value === "bigint") {
		return String(value);
	}

	try {
		return JSON.stringify(value);
	} catch {
		return String(value);
	}
};
