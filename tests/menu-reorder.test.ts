import { describe, expect, it } from "vitest";
import { planMainMenuDrop } from "../src/menu/reorder";
import type { MainMenuDropPosition } from "../src/menu/reorder";
import type { MainMenuTreeItem } from "../src/menu/types";

const node = (
	id: number,
	parentId: number | null,
	sortOrder: number,
	isFolder: boolean = false,
	children: MainMenuTreeItem<string>[] = [],
): MainMenuTreeItem<string> => ({
	id,
	parent_id: parentId,
	user_id: null,
	role_id: "admin",
	users_ref: null,
	main_menus_ref: parentId === null ? null : { keys: { id: parentId }, descr: String(parentId) },
	application_routes_ref: isFolder ? null : { keys: { id }, descr: String(id) },
	route_id: isFolder ? null : id,
	route_name: isFolder ? null : `route-${id}`,
	caption: `Menu ${id}`,
	icon: null,
	sort_order: sortOrder,
	is_active: true,
	created_at: "2026-10-12T00:00:00Z",
	updated_at: "2026-10-12T00:00:00Z",
	children,
});

const fixture = (): MainMenuTreeItem<string>[] => [
	node(1, null, 10, true, [
		node(11, 1, 10),
		node(12, 1, 20, true, [node(121, 12, 10)]),
		node(13, 1, 30),
	]),
	node(2, null, 20, true, [node(21, 2, 10), node(22, 2, 20)]),
	node(3, null, 30),
	node(4, null, 40, true),
];

describe("main menu drop planning", () => {
	it("reorders root siblings before a target", () => {
		expect(planMainMenuDrop(fixture(), 3, { id: 1, position: "before" })).toEqual({
			sourceId: 3,
			parentId: null,
			orders: [
				{ id: 3, sort_order: 10 },
				{ id: 1, sort_order: 20 },
				{ id: 2, sort_order: 30 },
			],
		});
	});

	it("reorders nested siblings after removing the source from its original index", () => {
		expect(planMainMenuDrop(fixture(), 11, { id: 13, position: "after" })).toEqual({
			sourceId: 11,
			parentId: 1,
			orders: [
				{ id: 12, sort_order: 10 },
				{ id: 13, sort_order: 20 },
				{ id: 11, sort_order: 30 },
			],
		});
	});

	it("moves into an empty group and normalizes the previous siblings", () => {
		expect(planMainMenuDrop(fixture(), 3, { id: 4, position: "inside" })).toEqual({
			sourceId: 3,
			parentId: 4,
			orders: [{ id: 4, sort_order: 30 }, { id: 3, sort_order: 10 }],
		});
	});

	it("appends inside a populated group even when the source order already matches", () => {
		expect(planMainMenuDrop(fixture(), 3, { id: 2, position: "inside" })).toEqual({
			sourceId: 3,
			parentId: 2,
			orders: [{ id: 4, sort_order: 30 }],
		});
	});

	it("treats an item with children as a group even if it has a route", () => {
		const tree = fixture();
		tree[1]!.route_id = 2;
		expect(planMainMenuDrop(tree, 13, { id: 2, position: "inside" })?.parentId).toBe(2);
	});

	it("moves between parents before a target", () => {
		expect(planMainMenuDrop(fixture(), 11, { id: 21, position: "before" })).toEqual({
			sourceId: 11,
			parentId: 2,
			orders: [
				{ id: 12, sort_order: 10 },
				{ id: 13, sort_order: 20 },
				{ id: 21, sort_order: 20 },
				{ id: 22, sort_order: 30 },
			],
		});
	});

	it("moves a whole subtree between parents after a target", () => {
		const tree = fixture();
		expect(planMainMenuDrop(tree, 12, { id: 21, position: "after" })).toEqual({
			sourceId: 12,
			parentId: 2,
			orders: [{ id: 13, sort_order: 20 }, { id: 22, sort_order: 30 }],
		});
		expect(tree[0]!.children[1]!.children[0]!.parent_id).toBe(12);
	});

	it("appends a nested item to the root", () => {
		expect(planMainMenuDrop(fixture(), 11, { id: null, position: "inside" })).toEqual({
			sourceId: 11,
			parentId: null,
			orders: [
				{ id: 12, sort_order: 10 },
				{ id: 13, sort_order: 20 },
				{ id: 11, sort_order: 50 },
			],
		});
	});

	it.each<MainMenuDropPosition>(["before", "inside", "after"])(
		"rejects self and descendant targets for %s drops",
		(position) => {
			expect(planMainMenuDrop(fixture(), 1, { id: 1, position })).toBeNull();
			expect(planMainMenuDrop(fixture(), 1, { id: 12, position })).toBeNull();
			expect(planMainMenuDrop(fixture(), 1, { id: 121, position })).toBeNull();
		},
	);

	it("rejects inside a route, unknown IDs, and non-inside root targets", () => {
		expect(planMainMenuDrop(fixture(), 11, { id: 3, position: "inside" })).toBeNull();
		expect(planMainMenuDrop(fixture(), 999, { id: 1, position: "before" })).toBeNull();
		expect(planMainMenuDrop(fixture(), 3, { id: 999, position: "before" })).toBeNull();
		expect(planMainMenuDrop(fixture(), 3, { id: null, position: "before" })).toBeNull();
		expect(planMainMenuDrop(fixture(), 3, { id: null, position: "after" })).toBeNull();
	});

	it("rejects logical no-ops without normalizing unchanged siblings", () => {
		const tree = fixture();
		tree[0]!.sort_order = 4;
		tree[1]!.sort_order = 4;
		expect(planMainMenuDrop(tree, 1, { id: 2, position: "before" })).toBeNull();
		expect(planMainMenuDrop(tree, 2, { id: 1, position: "after" })).toBeNull();
		expect(planMainMenuDrop(tree, 4, { id: null, position: "inside" })).toBeNull();
		expect(planMainMenuDrop(tree, 13, { id: 1, position: "inside" })).toBeNull();
	});

	it("uses stable ID ordering for unsorted siblings with duplicate sort orders", () => {
		const tree = [node(3, null, 5), node(1, null, 5), node(2, null, 5)];
		expect(planMainMenuDrop(tree, 3, { id: 1, position: "before" })).toEqual({
			sourceId: 3,
			parentId: null,
			orders: [
				{ id: 3, sort_order: 10 },
				{ id: 1, sort_order: 20 },
				{ id: 2, sort_order: 30 },
			],
		});
		expect(tree.map((item) => item.id)).toEqual([3, 1, 2]);
	});

	it("does not change tree data, ownership, references, or child arrays", () => {
		const tree = fixture();
		const snapshot = structuredClone(tree);
		const source = tree[0]!.children[1]!;
		const sourceChildren = source.children;
		const parentChildren = tree[0]!.children;
		planMainMenuDrop(tree, 12, { id: 2, position: "inside" });
		expect(tree).toEqual(snapshot);
		expect(tree[0]!.children).toBe(parentChildren);
		expect(source.children).toBe(sourceChildren);
	});
});
