import type { MainMenuForUser } from "./types";

export const normalizeMenuSearch = (
	value: string,
): string => {
	return value.trim().toLocaleLowerCase();
};

export const filterMainMenu = (
	items: MainMenuForUser[],
	search: string,
): MainMenuForUser[] => {
	const normalizedSearch = normalizeMenuSearch(search);
	if (!normalizedSearch) {
		return items;
	}

	return items.reduce<MainMenuForUser[]>((result, item) => {
		const children = item.children
			? filterMainMenu(item.children, normalizedSearch)
			: null;
		const itemMatches = normalizeMenuSearch(item.caption).includes(normalizedSearch);

		if (itemMatches || (children && children.length > 0)) {
			result.push({
				...item,
				children: itemMatches ? item.children : children,
			});
		}

		return result;
	}, []);
};
