// @vitest-environment happy-dom

import {
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	vi,
} from "vitest";
import {
	createApp,
	nextTick,
	type App,
} from "vue";
import PrimeVue from "primevue/config";
import { createI18n } from "vue-i18n";

import MainMenuConstructorView from "../src/menu/components/MainMenuConstructorView.vue";
import type { MainMenuList } from "../src/menu/types";

const api = vi.hoisted(() => ({
	list: vi.fn(),
	update: vi.fn(),
	delete: vi.fn(),
	create: vi.fn(),
}));

vi.mock("../src/core/runtime", () => ({
	useBusinessApp: () => ({
		defaultRoleId: "admin",
		mainMenuChangedEventName: "main-menu-changed",
		apis: { mainMenu: api },
	}),
}));

vi.mock("../src/user/RoleReferenceSelect.vue", () => ({
	default: { render: () => null },
}));
vi.mock("../src/user/UserReferenceInput.vue", () => ({
	default: { render: () => null },
}));
vi.mock("../src/menu/components/MainMenuRouteInput.vue", () => ({
	default: { render: () => null },
}));

const row = (
	id: number,
	parentId: number | null,
	caption: string,
	sortOrder: number,
	isFolder: boolean = false,
): MainMenuList<string> => ({
	id,
	role_id: "admin",
	users_ref: null,
	main_menus_ref: parentId === null ? null : {
		keys: { id: parentId },
		descr: String(parentId),
	},
	application_routes_ref: isFolder ? null : {
		keys: { id },
		descr: caption,
	},
	route_name: isFolder ? null : `route-${id}`,
	caption,
	icon: "pi pi-star",
	sort_order: sortOrder,
	is_active: true,
	created_at: "2026-10-12T00:00:00Z",
	updated_at: "2026-10-12T00:00:00Z",
});

const fixture = (): MainMenuList<string>[] => [
	row(1, null, "Products", 10, true),
	row(2, null, "Reports", 20, true),
	row(3, null, "Users", 30),
	row(11, 1, "Brands", 10),
	row(12, 1, "Nested group", 20, true),
	row(13, 1, "Inventory", 30),
	row(121, 12, "Nested route", 10),
	row(21, 2, "Daily report", 10),
];

let app: App | null = null;
let host: HTMLDivElement;
let backendRows: MainMenuList<string>[];

const flush = async (): Promise<void> => {
	for (let index = 0; index < 12; index += 1) {
		await Promise.resolve();
		await nextTick();
	}
};

const mount = async (): Promise<void> => {
	host = document.createElement("div");
	document.body.append(host);
	app = createApp(MainMenuConstructorView);
	app.use(PrimeVue, { unstyled: true });
	app.use(createI18n({ legacy: false, locale: "en" }));
	app.mount(host);
	await flush();
};

const nodeRow = (
	id: number,
): HTMLElement => {
	const element = host.querySelector<HTMLElement>(`[data-main-menu-id="${id}"]`);
	expect(element, `Menu item ${id} should exist`).not.toBeNull();
	return element!;
};

const action = (
	id: number,
	label: string,
): HTMLButtonElement => {
	const button = nodeRow(id).querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`);
	expect(button, `${label} should exist for item ${id}`).not.toBeNull();
	return button!;
};

const folderToggle = (
	id: number,
): HTMLButtonElement => {
	return nodeRow(id).querySelector<HTMLButtonElement>("button[aria-expanded]")!;
};

const siblingIds = (
	id: number,
): number[] => {
	const siblings = nodeRow(id).parentElement!.parentElement!;
	return [...siblings.children].map((element) => {
		return Number(element.querySelector("[data-main-menu-id]")!.getAttribute("data-main-menu-id"));
	});
};

const dragTransfer = (): DataTransfer => {
	const data = new Map<string, string>();

	return {
		dropEffect: "none",
		effectAllowed: "uninitialized",
		getData: (type: string): string => data.get(type) ?? "",
		setData: (type: string, value: string): void => {
			data.set(type, value);
		},
		setDragImage: vi.fn(),
	} as unknown as DataTransfer;
};

const dragLabel = (
	id: number,
): HTMLElement => {
	const label = nodeRow(id).querySelector<HTMLElement>(".main-menu-drag-label");
	expect(label, `Draggable label should exist for item ${id}`).not.toBeNull();
	expect(label!.getAttribute("aria-label")).toMatch(/^Drag to move: /);
	return label!;
};

const dispatchDrag = (
	element: HTMLElement,
	type: "dragstart" | "dragover" | "dragleave" | "drop" | "dragend",
	transfer: DataTransfer,
	clientY: number = 45,
	relatedTarget: EventTarget | null = null,
): Event => {
	const event = new Event(type, { bubbles: true, cancelable: true });
	Object.defineProperties(event, {
		dataTransfer: { value: transfer },
		clientY: { value: clientY },
		relatedTarget: { value: relatedTarget },
	});
	element.dispatchEvent(event);
	return event;
};

const beginDrag = async (
	id: number,
): Promise<DataTransfer> => {
	const label = dragLabel(id);
	expect(label.getAttribute("draggable")).toBe("true");
	const transfer = dragTransfer();
	dispatchDrag(label, "dragstart", transfer);
	await flush();
	return transfer;
};

const dragRow = (
	id: number,
	type: "dragover" | "dragleave" | "drop",
	transfer: DataTransfer,
	clientY: number = 45,
	relatedTarget: EventTarget | null = null,
): Event => {
	const element = nodeRow(id);
	vi.spyOn(element, "getBoundingClientRect").mockReturnValue(new DOMRect(0, 0, 300, 90));
	return dispatchDrag(element, type, transfer, clientY, relatedTarget);
};

const rootDropZone = (): HTMLElement => {
	const element = host.querySelector<HTMLElement>("[data-main-menu-root-drop]");
	expect(element, "Root drop area should exist").not.toBeNull();
	return element!;
};

const dialog = (): HTMLElement | null => {
	return document.querySelector<HTMLElement>('[role="dialog"]');
};

const dialogButton = (
	label: string,
): HTMLButtonElement => {
	const button = [...dialog()!.querySelectorAll<HTMLButtonElement>("button")].find((element) => {
		return element.textContent?.trim() === label;
	});
	expect(button, `Modal button ${label} should exist`).toBeDefined();
	return button!;
};

beforeEach(() => {
	backendRows = fixture();
	api.list.mockReset().mockImplementation(async () => ({
		rows: backendRows.map((item) => ({ ...item })),
	}));
	api.update.mockReset().mockResolvedValue(undefined);
	api.delete.mockReset().mockResolvedValue(undefined);
	api.create.mockReset().mockResolvedValue(undefined);
});

afterEach(() => {
	app?.unmount();
	app = null;
	document.body.innerHTML = "";
	vi.restoreAllMocks();
});

describe("main menu constructor", () => {
	it("uses draggable captions without separate handles and one folder icon that changes with expansion", async () => {
		await mount();
		const toggle = folderToggle(1);
		const label = dragLabel(11);

		expect(host.querySelector(".main-menu-drag-handle, .pi-bars")).toBeNull();
		expect(label.tagName).toBe("SPAN");
		expect(label.textContent?.trim()).toBe("Brands");
		expect(label.getAttribute("draggable")).toBe("true");
		expect(label.getAttribute("tabindex")).toBe("0");
		expect(label.getAttribute("aria-label")).toBe("Drag to move: Brands");
		expect(label.getAttribute("title")).toBe("Drag to move");
		expect(toggle.getAttribute("draggable")).not.toBe("true");
		expect([...nodeRow(11).querySelectorAll("button")].some((button) => button.draggable)).toBe(false);
		label.click();
		await flush();
		expect(nodeRow(11).classList.contains("bg-blue-50")).toBe(true);

		expect(toggle.getAttribute("aria-expanded")).toBe("true");
		expect(nodeRow(1).querySelectorAll(".pi-folder-open")).toHaveLength(1);
		expect(nodeRow(1).querySelector(".pi-chevron-right")).toBeNull();
		expect(nodeRow(1).querySelector(".pi-star")).toBeNull();
		expect(nodeRow(11).querySelectorAll(".pi-star")).toHaveLength(1);
		expect(nodeRow(11).querySelector("button[aria-expanded]")).toBeNull();

		toggle.click();
		await flush();

		expect(toggle.getAttribute("aria-expanded")).toBe("false");
		expect(nodeRow(1).querySelectorAll(".pi-folder")).toHaveLength(1);
		expect(nodeRow(1).querySelector(".pi-folder-open")).toBeNull();
	});

	it("moves a root item without refetching or replacing rows and keeps folder state and focus", async () => {
		await mount();
		folderToggle(12).click();
		folderToggle(1).click();
		await flush();
		let resolveUpdate!: () => void;
		api.update.mockImplementationOnce(() => new Promise<void>((resolve) => {
			resolveUpdate = resolve;
		}));
		const movedRow = nodeRow(2);
		const button = action(2, "Move up");
		button.focus();
		button.click();
		await flush();
		button.blur();
		resolveUpdate();
		await flush();

		expect(siblingIds(2)).toEqual([2, 1, 3]);
		expect(api.list).toHaveBeenCalledTimes(1);
		expect(api.update).toHaveBeenNthCalledWith(1, { id: 2 }, { sort_order: 10 });
		expect(api.update).toHaveBeenNthCalledWith(2, { id: 1 }, { sort_order: 20 });
		expect(nodeRow(2)).toBe(movedRow);
		expect(movedRow.classList.contains("bg-blue-50")).toBe(true);
		expect(folderToggle(1).getAttribute("aria-expanded")).toBe("false");
		expect(folderToggle(2).getAttribute("aria-expanded")).toBe("true");
		expect(document.activeElement).toBe(movedRow);

		folderToggle(1).click();
		await flush();
		expect(folderToggle(12).getAttribute("aria-expanded")).toBe("false");
	});

	it("keeps focus on a nested item while moving it to a position with an enabled arrow", async () => {
		await mount();
		folderToggle(12).click();
		await flush();
		let resolveUpdate!: () => void;
		api.update.mockImplementationOnce(() => new Promise<void>((resolve) => {
			resolveUpdate = resolve;
		}));
		const movedRow = nodeRow(13);
		const button = action(13, "Move up");
		button.focus();
		button.click();
		await flush();
		button.blur();
		resolveUpdate();
		await flush();

		expect(siblingIds(13)).toEqual([11, 13, 12]);
		expect(nodeRow(13)).toBe(movedRow);
		expect(document.activeElement).toBe(button);
		expect(movedRow.classList.contains("bg-blue-50")).toBe(true);
		expect(folderToggle(12).getAttribute("aria-expanded")).toBe("false");
		expect(api.list).toHaveBeenCalledTimes(1);
	});

	it("blocks repeated move commands while order persistence is pending", async () => {
		await mount();
		let resolveUpdate!: () => void;
		api.update.mockImplementationOnce(() => new Promise<void>((resolve) => {
			resolveUpdate = resolve;
		}));
		const button = action(2, "Move up");
		button.click();
		button.click();
		await flush();

		expect(api.update).toHaveBeenCalledTimes(1);
		expect(button.disabled).toBe(true);
		expect(action(1, "Delete").disabled).toBe(true);
		expect(siblingIds(2)).toEqual([1, 2, 3]);

		resolveUpdate();
		await flush();
		expect(api.update).toHaveBeenCalledTimes(2);
		expect(siblingIds(2)).toEqual([2, 1, 3]);
		expect(api.list).toHaveBeenCalledTimes(1);
	});

	it("reconciles partially saved ordering on failure without replacing rows or expanding folders", async () => {
		await mount();
		folderToggle(1).click();
		await flush();
		const originalRow = nodeRow(2);
		api.update.mockImplementationOnce(async () => {
			backendRows.find((item) => item.id === 2)!.sort_order = 10;
		});
		api.update.mockRejectedValueOnce(new Error("Ordering failed"));
		action(2, "Move up").click();
		await flush();

		expect(api.list).toHaveBeenCalledTimes(2);
		expect(nodeRow(2)).toBe(originalRow);
		expect(originalRow.classList.contains("bg-blue-50")).toBe(true);
		expect(folderToggle(1).getAttribute("aria-expanded")).toBe("false");
		expect(host.textContent).toContain("Ordering failed");
		expect(action(2, "Delete").disabled).toBe(false);
	});

	it("drags a sibling before another item without refetching, losing selection, or opening folders", async () => {
		await mount();
		folderToggle(12).click();
		folderToggle(1).click();
		await flush();
		const originalRow = nodeRow(2);
		const label = dragLabel(2);
		label.focus();
		const transfer = await beginDrag(2);
		expect(dragRow(1, "dragover", transfer, 5).defaultPrevented).toBe(true);
		await flush();
		dragRow(1, "drop", transfer, 5);
		await flush();

		expect(siblingIds(2)).toEqual([2, 1, 3]);
		expect(api.list).toHaveBeenCalledTimes(1);
		expect(api.update).toHaveBeenCalledTimes(2);
		expect(api.update).toHaveBeenNthCalledWith(1, { id: 2 }, { sort_order: 10 });
		expect(api.update).toHaveBeenNthCalledWith(2, { id: 1 }, { sort_order: 20 });
		expect(nodeRow(2)).toBe(originalRow);
		expect(originalRow.classList.contains("bg-blue-50")).toBe(true);
		expect(originalRow.contains(document.activeElement)).toBe(true);
		expect(folderToggle(1).getAttribute("aria-expanded")).toBe("false");
		expect(folderToggle(2).getAttribute("aria-expanded")).toBe("true");
		folderToggle(1).click();
		await flush();
		expect(folderToggle(12).getAttribute("aria-expanded")).toBe("false");
	});

	it("drops a route inside a collapsed folder and retains its new parent for later arrow moves", async () => {
		await mount();
		folderToggle(2).click();
		await flush();
		dragLabel(13).focus();
		const transfer = await beginDrag(13);
		dragRow(2, "dragover", transfer, 45);
		dragRow(2, "drop", transfer, 45);
		await flush();

		expect(api.update).toHaveBeenCalledExactlyOnceWith({ id: 13 }, { parent_id: 2, sort_order: 20 });
		expect(api.list).toHaveBeenCalledTimes(1);
		await vi.waitFor(() => expect(siblingIds(13)).toEqual([21, 13]));
		expect(siblingIds(11)).toEqual([11, 12]);
		expect(folderToggle(2).getAttribute("aria-expanded")).toBe("false");
		expect(nodeRow(13).classList.contains("bg-blue-50")).toBe(true);
		expect(document.activeElement).toBe(nodeRow(2));

		folderToggle(2).click();
		await flush();
		action(13, "Move up").click();
		await flush();
		expect(siblingIds(13)).toEqual([13, 21]);
		expect(api.update).toHaveBeenNthCalledWith(2, { id: 13 }, { sort_order: 10 });
		expect(api.update).toHaveBeenNthCalledWith(3, { id: 21 }, { sort_order: 20 });
		expect(api.list).toHaveBeenCalledTimes(1);
	});

	it("moves an entire collapsed branch into another folder while preserving its descendants", async () => {
		await mount();
		folderToggle(12).click();
		await flush();
		dragLabel(12).focus();
		const transfer = await beginDrag(12);
		dragRow(2, "drop", transfer, 45);
		await flush();

		expect(api.update).toHaveBeenCalledTimes(2);
		expect(api.update).toHaveBeenNthCalledWith(1, { id: 12 }, { parent_id: 2, sort_order: 20 });
		expect(api.update).toHaveBeenNthCalledWith(2, { id: 13 }, { sort_order: 20 });
		await vi.waitFor(() => expect(siblingIds(12)).toEqual([21, 12]));
		expect(nodeRow(12).contains(document.activeElement)).toBe(true);
		expect(siblingIds(121)).toEqual([121]);
		expect(nodeRow(121).closest("ul")?.parentElement?.querySelector("[data-main-menu-id]")?.getAttribute("data-main-menu-id")).toBe("12");
		expect(folderToggle(12).getAttribute("aria-expanded")).toBe("false");
		expect(api.list).toHaveBeenCalledTimes(1);
	});

	it("allows a drop inside an empty group and a direct drop back at the menu root", async () => {
		backendRows.push(row(4, null, "Empty group", 40, true));
		await mount();
		expect(nodeRow(4).querySelector("button[aria-expanded]")).toBeNull();
		const intoGroup = await beginDrag(13);
		dragRow(4, "drop", intoGroup, 45);
		await flush();

		expect(api.update).toHaveBeenCalledExactlyOnceWith({ id: 13 }, { parent_id: 4, sort_order: 10 });
		await vi.waitFor(() => expect(siblingIds(13)).toEqual([13]));
		expect(folderToggle(4).getAttribute("aria-expanded")).toBe("true");
		const toRoot = await beginDrag(13);
		dispatchDrag(rootDropZone(), "drop", toRoot);
		await flush();

		expect(api.update).toHaveBeenNthCalledWith(2, { id: 13 }, { parent_id: null, sort_order: 50 });
		await vi.waitFor(() => expect(siblingIds(13)).toEqual([1, 2, 3, 4, 13]));
		expect(nodeRow(4).querySelector("button[aria-expanded]")).toBeNull();
		expect(api.list).toHaveBeenCalledTimes(1);
	});

	it("rejects moving a branch into itself or one of its descendants", async () => {
		await mount();
		const transfer = await beginDrag(1);
		expect(dragRow(12, "dragover", transfer, 45).defaultPrevented).toBe(false);
		dragRow(12, "drop", transfer, 45);
		await flush();
		const secondTransfer = await beginDrag(1);
		dragRow(121, "drop", secondTransfer, 85);
		await flush();
		const thirdTransfer = await beginDrag(1);
		dragRow(1, "drop", thirdTransfer, 45);
		await flush();

		expect(api.update).not.toHaveBeenCalled();
		expect(api.list).toHaveBeenCalledTimes(1);
		expect(siblingIds(1)).toEqual([1, 2, 3]);
		expect(siblingIds(12)).toEqual([11, 12, 13]);
	});

	it("ignores external drags and sibling drops that leave the ordering unchanged", async () => {
		await mount();
		const external = dragTransfer();
		external.setData("text/plain", "3");
		expect(dragRow(1, "dragover", external, 45).defaultPrevented).toBe(false);
		dragRow(1, "drop", external, 45);
		await flush();
		const transfer = await beginDrag(2);
		dragRow(3, "drop", transfer, 5);
		await flush();

		expect(api.update).not.toHaveBeenCalled();
		expect(api.list).toHaveBeenCalledTimes(1);
		expect(siblingIds(2)).toEqual([1, 2, 3]);
	});

	it("shows pointer-specific drop markers and clears them when leaving, ending, or completing a drag", async () => {
		await mount();
		const transfer = await beginDrag(3);
		expect(nodeRow(3).classList.contains("main-menu-dragging")).toBe(true);
		dragRow(1, "dragover", transfer, 5);
		await flush();
		expect(nodeRow(1).classList.contains("main-menu-drop-before")).toBe(true);
		dragRow(1, "dragover", transfer, 85);
		await flush();
		expect(nodeRow(1).classList.contains("main-menu-drop-after")).toBe(true);
		expect(nodeRow(1).classList.contains("main-menu-drop-before")).toBe(false);
		dragRow(1, "dragover", transfer, 45);
		await flush();
		expect(nodeRow(1).classList.contains("main-menu-drop-inside")).toBe(true);
		dragRow(1, "dragleave", transfer, 45, folderToggle(1));
		await flush();
		expect(nodeRow(1).classList.contains("main-menu-drop-inside")).toBe(true);
		dragRow(1, "dragleave", transfer, 45, document.body);
		await flush();
		expect(nodeRow(1).classList.contains("main-menu-drop-inside")).toBe(false);
		dispatchDrag(dragLabel(3), "dragend", transfer);
		await flush();
		expect(host.querySelector(".main-menu-dragging")).toBeNull();
		expect(host.querySelector(".main-menu-drop-before, .main-menu-drop-inside, .main-menu-drop-after")).toBeNull();
		expect(api.update).not.toHaveBeenCalled();

		const secondTransfer = await beginDrag(2);
		dragRow(1, "dragover", secondTransfer, 5);
		dragRow(1, "drop", secondTransfer, 5);
		await flush();
		expect(siblingIds(2)).toEqual([2, 1, 3]);
		expect(host.querySelector(".main-menu-dragging")).toBeNull();
		expect(host.querySelector(".main-menu-drop-before, .main-menu-drop-inside, .main-menu-drop-after")).toBeNull();
	});

	it("keeps the tree unchanged while saving a drop and blocks repeated drops", async () => {
		await mount();
		let resolveUpdate!: () => void;
		api.update.mockImplementationOnce(() => new Promise<void>((resolve) => {
			resolveUpdate = resolve;
		}));
		const transfer = await beginDrag(13);
		dragRow(2, "drop", transfer, 45);
		dragRow(2, "drop", transfer, 45);
		await flush();

		expect(api.update).toHaveBeenCalledTimes(1);
		expect(siblingIds(13)).toEqual([11, 12, 13]);
		expect(dragLabel(13).getAttribute("draggable")).toBe("false");
		expect(dragLabel(13).getAttribute("tabindex")).toBe("-1");
		expect(action(1, "Delete").disabled).toBe(true);
		dispatchDrag(dragLabel(3), "dragstart", transfer);
		dragRow(1, "drop", transfer, 5);
		await flush();
		expect(api.update).toHaveBeenCalledTimes(1);
		resolveUpdate();
		await flush();

		await vi.waitFor(() => expect(siblingIds(13)).toEqual([21, 13]));
		expect(api.list).toHaveBeenCalledTimes(1);
		expect(dragLabel(13).getAttribute("draggable")).toBe("true");
		expect(dragLabel(13).getAttribute("tabindex")).toBe("0");
	});

	it("refreshes after a failed drop without speculatively reparenting the row or expanding folders", async () => {
		await mount();
		folderToggle(2).click();
		await flush();
		const originalRow = nodeRow(13);
		api.update.mockRejectedValueOnce(new Error("Drag update failed"));
		const transfer = await beginDrag(13);
		dragRow(2, "drop", transfer, 45);
		await flush();

		expect(api.list).toHaveBeenCalledTimes(2);
		expect(siblingIds(13)).toEqual([11, 12, 13]);
		expect(nodeRow(13)).toBe(originalRow);
		expect(folderToggle(2).getAttribute("aria-expanded")).toBe("false");
		expect(host.textContent).toContain("Drag update failed");
		expect(dragLabel(13).getAttribute("draggable")).toBe("true");
		expect(action(13, "Delete").disabled).toBe(false);
	});

	it("asks to delete a branch in a modal and cancellation leaves its data intact", async () => {
		await mount();
		const confirm = vi.spyOn(window, "confirm");
		action(1, "Delete").click();
		await flush();

		expect(confirm).not.toHaveBeenCalled();
		expect(dialog()?.getAttribute("aria-modal")).toBe("true");
		expect(dialog()?.textContent).toContain("Delete item “Products” and all its children?");
		expect(api.delete).not.toHaveBeenCalled();
		dialogButton("Cancel").click();
		await vi.waitFor(() => expect(dialog()).toBeNull());
		expect(api.delete).not.toHaveBeenCalled();
		expect(api.list).toHaveBeenCalledTimes(1);
		expect(nodeRow(1)).toBeDefined();
	});

	it("deletes only after confirmation and prevents duplicate requests while deleting", async () => {
		await mount();
		let resolveDelete!: () => void;
		api.delete.mockImplementationOnce(() => new Promise<void>((resolve) => {
			resolveDelete = resolve;
		}));
		action(3, "Delete").click();
		await flush();
		expect(dialog()?.textContent).toContain("Delete item “Users”?");
		const button = dialogButton("Delete");
		button.click();
		button.click();
		await flush();

		expect(api.delete).toHaveBeenCalledExactlyOnceWith({ id: 3 });
		expect(button.disabled).toBe(true);
		expect(dialogButton("Cancel").disabled).toBe(true);
		backendRows = backendRows.filter((item) => item.id !== 3);
		resolveDelete();
		await flush();
		await vi.waitFor(() => expect(dialog()).toBeNull());
		expect(api.list).toHaveBeenCalledTimes(2);
		expect(host.querySelector('[data-main-menu-id="3"]')).toBeNull();
	});

	it("keeps a failed deletion in the modal with an error and permits retry", async () => {
		await mount();
		api.delete.mockRejectedValueOnce(new Error("Delete failed"));
		action(3, "Delete").click();
		await flush();
		dialogButton("Delete").click();
		await flush();

		expect(dialog()?.querySelector('[role="alert"]')?.textContent).toContain("Delete failed");
		expect(dialogButton("Delete").disabled).toBe(false);
		expect(api.list).toHaveBeenCalledTimes(1);
		backendRows = backendRows.filter((item) => item.id !== 3);
		dialogButton("Delete").click();
		await flush();
		await vi.waitFor(() => expect(dialog()).toBeNull());
		expect(api.delete).toHaveBeenCalledTimes(2);
		expect(api.list).toHaveBeenCalledTimes(2);
	});
});
