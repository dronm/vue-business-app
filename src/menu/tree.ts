import type {
	MainMenuList,
	MainMenuTreeItem,
} from "./types";

export interface MainMenuOwner {
	type: "role" | "user";
	roleId?: string | null;
	userId?: number | null;
}

export const mainMenuRowUserId = (
	row: MainMenuList<string>,
): number | null => {
	const value = row.users_ref?.keys?.id;
	return typeof value === "number" ? value : null;
};

export const mainMenuRowParentId = (
	row: MainMenuList<string>,
): number | null => {
	const value = row.main_menus_ref?.keys?.id;
	return typeof value === "number" ? value : null;
};

export const mainMenuRowMatchesOwner = (
	row: MainMenuList<string>,
	owner: MainMenuOwner,
): boolean => {
	if (owner.type === "role") {
		return owner.roleId !== null
			&& owner.roleId !== undefined
			&& row.role_id === owner.roleId;
	}

	return owner.userId !== null
		&& owner.userId !== undefined
		&& mainMenuRowUserId(row) === owner.userId;
};

export const compareMainMenuNodes = (
	left: MainMenuTreeItem<string>,
	right: MainMenuTreeItem<string>,
): number => {
	return left.sort_order - right.sort_order || left.id - right.id;
};

export const sortMainMenuTree = (
	nodes: MainMenuTreeItem<string>[],
): void => {
	nodes.sort(compareMainMenuNodes);
	for (const node of nodes) {
		sortMainMenuTree(node.children);
	}
};

export const buildMainMenuTree = (
	rows: MainMenuList<string>[],
	owner: MainMenuOwner,
): MainMenuTreeItem<string>[] => {
	const scopedRows = rows.filter((row) => mainMenuRowMatchesOwner(row, owner));
	const byId = new Map<number, MainMenuTreeItem<string>>();

	for (const row of scopedRows) {
		byId.set(row.id, {
			...row,
			parent_id: mainMenuRowParentId(row),
			user_id: mainMenuRowUserId(row),
			route_id: row.application_routes_ref?.keys.id ?? null,
			children: [],
		});
	}

	const roots: MainMenuTreeItem<string>[] = [];
	for (const node of byId.values()) {
		const parent = node.parent_id === null
			? null
			: byId.get(node.parent_id) ?? null;

		if (parent) {
			parent.children.push(node);
		} else {
			roots.push(node);
		}
	}

	sortMainMenuTree(roots);
	return roots;
};

export const findMainMenuNode = (
	nodes: MainMenuTreeItem<string>[],
	id: number,
): MainMenuTreeItem<string> | null => {
	for (const node of nodes) {
		if (node.id === id) {
			return node;
		}

		const child = findMainMenuNode(node.children, id);
		if (child) {
			return child;
		}
	}

	return null;
};

export const collectMainMenuNodeIds = (
	node: MainMenuTreeItem<string>,
	result: Set<number>,
): void => {
	result.add(node.id);
	for (const child of node.children) {
		collectMainMenuNodeIds(child, result);
	}
};
