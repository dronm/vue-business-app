import { compareMainMenuNodes } from "./tree";
import type { MainMenuTreeItem } from "./types";

export type MainMenuDropPosition = "before" | "inside" | "after";

export interface MainMenuDropTarget {
	id: number | null;
	position: MainMenuDropPosition;
}

export interface MainMenuDropOrder {
	id: number;
	sort_order: number;
}

export interface MainMenuDropPlan {
	sourceId: number;
	parentId: number | null;
	orders: MainMenuDropOrder[];
}

interface MainMenuNodeLocation {
	node: MainMenuTreeItem<string>;
	parentId: number | null;
	siblings: readonly MainMenuTreeItem<string>[];
}

const findNodeLocation = (
	nodes: readonly MainMenuTreeItem<string>[],
	id: number,
	parentId: number | null = null,
): MainMenuNodeLocation | null => {
	for (const node of nodes) {
		if (node.id === id) {
			return { node, parentId, siblings: nodes };
		}

		const child = findNodeLocation(node.children, id, node.id);
		if (child) {
			return child;
		}
	}

	return null;
};

const containsNode = (
	node: MainMenuTreeItem<string>,
	id: number,
): boolean => {
	return node.id === id || node.children.some((child) => containsNode(child, id));
};

const addChangedOrders = (
	nodes: readonly MainMenuTreeItem<string>[],
	orders: MainMenuDropOrder[],
): void => {
	nodes.forEach((node, index) => {
		const sortOrder = (index + 1) * 10;
		if (node.sort_order !== sortOrder) {
			orders.push({ id: node.id, sort_order: sortOrder });
		}
	});
};

/**
 * Plan a subtree move without changing the tree. A null target with "inside"
 * appends to the root; "inside" an item appends to that item's children.
 * Only changed sort orders are returned, along with the source's new parent.
 */
export const planMainMenuDrop = (
	nodes: readonly MainMenuTreeItem<string>[],
	sourceId: number,
	target: MainMenuDropTarget,
): MainMenuDropPlan | null => {
	const source = findNodeLocation(nodes, sourceId);
	if (!source) {
		return null;
	}

	let parentId: number | null;
	let targetSiblings: readonly MainMenuTreeItem<string>[];
	if (target.id === null) {
		if (target.position !== "inside") {
			return null;
		}
		parentId = null;
		targetSiblings = nodes;
	} else {
		const destination = findNodeLocation(nodes, target.id);
		if (!destination || containsNode(source.node, target.id)) {
			return null;
		}

		if (target.position === "inside") {
			if (destination.node.route_id !== null && destination.node.children.length === 0) {
				return null;
			}
			parentId = destination.node.id;
			targetSiblings = destination.node.children;
		} else {
			parentId = destination.parentId;
			targetSiblings = destination.siblings;
		}
	}

	const originalSiblings = [...source.siblings].sort(compareMainMenuNodes);
	const destinationSiblings = [...targetSiblings]
		.filter((node) => node.id !== sourceId)
		.sort(compareMainMenuNodes);
	const targetIndex = target.position === "inside"
		? destinationSiblings.length
		: destinationSiblings.findIndex((node) => node.id === target.id)
			+ (target.position === "after" ? 1 : 0);
	destinationSiblings.splice(targetIndex, 0, source.node);

	const sameParent = source.parentId === parentId;
	if (sameParent && originalSiblings.every((node, index) => {
		return node.id === destinationSiblings[index]?.id;
	})) {
		return null;
	}

	const orders: MainMenuDropOrder[] = [];
	if (!sameParent) {
		addChangedOrders(originalSiblings.filter((node) => node.id !== sourceId), orders);
	}
	addChangedOrders(destinationSiblings, orders);

	return { sourceId, parentId, orders };
};
