<script setup lang="ts">
import {
	computed,
	nextTick,
	onMounted,
	ref,
	watch,
} from "vue";

import Button from "primevue/button";
import Dialog from "primevue/dialog";
import InputNumber from "primevue/inputnumber";
import InputText from "primevue/inputtext";
import Select from "primevue/select";
import ToggleSwitch from "primevue/toggleswitch";

import {
	SortDirect,
	type CollectionParams,
} from "@katren/vue-collection-lib/types/collection";
import { errorText } from "@katren/vue-collection-lib/utils/errorText";

import { useBusinessApp } from "../../core/runtime";
import { useBusinessAppI18n } from "../../i18n/useBusinessAppI18n";
import RoleReferenceSelect from "../../user/RoleReferenceSelect.vue";
import UserReferenceInput from "../../user/UserReferenceInput.vue";
import {
	buildMainMenuTree,
	collectMainMenuNodeIds,
	compareMainMenuNodes,
	findMainMenuNode,
	mainMenuRowMatchesOwner,
} from "../tree";
import type {
	MainMenuList,
	MainMenuNew,
	MainMenuRouteOption,
	MainMenuTreeItem,
	MainMenuUpd,
} from "../types";
import {
	planMainMenuDrop,
	type MainMenuDropPlan,
	type MainMenuDropTarget,
} from "../reorder";
import MainMenuRouteInput from "./MainMenuRouteInput.vue";
import MainMenuTreeNode from "./MainMenuTreeNode.vue";

type OwnerType = "role" | "user";

interface OwnerTypeOption {
	value: OwnerType;
	label: string;
}

interface ParentOption {
	value: number | null;
	label: string;
}

interface MenuForm {
	id: number | null;
	parent_id: number | null;
	route_id: number | null;
	caption: string;
	icon: string | null;
	sort_order: number;
	is_active: boolean;
}

const runtime = useBusinessApp();
const { t } = useBusinessAppI18n();

const ownerTypeOptions = computed<OwnerTypeOption[]>(() => [
	{
		value: "role",
		label: t("mainMenu.owner.role"),
	},
	{
		value: "user",
		label: t("mainMenu.owner.user"),
	},
]);

const ownerType = ref<OwnerType>("role");
const roleId = ref<string | null>(runtime.defaultRoleId);
const userId = ref<number | null>(null);
const loading = ref(false);
const saving = ref(false);
const moving = ref(false);
const deleting = ref(false);
const busy = computed(() => loading.value || saving.value || moving.value || deleting.value);
const error = ref("");
const rows = ref<MainMenuList<string>[]>([]);
const tree = ref<MainMenuTreeItem<string>[]>([]);
const selectedId = ref<number | null>(null);
const collapsedIds = ref(new Set<number>());
const menuContainer = ref<HTMLElement | null>(null);
const draggedId = ref<number | null>(null);
const dropTarget = ref<MainMenuDropTarget | null>(null);
const editorVisible = ref(false);
const editorError = ref("");
const deleteVisible = ref(false);
const deleteTarget = ref<MainMenuTreeItem<string> | null>(null);
const deleteError = ref("");

const deleteMessage = computed(() => {
	const node = deleteTarget.value;
	if (!node) {
		return "";
	}

	return node.children.length > 0
		? t("mainMenu.confirmDeleteTree", { caption: node.caption })
		: t("mainMenu.confirmDelete", { caption: node.caption });
});

const emptyForm = (): MenuForm => {
	return {
		id: null,
		parent_id: null,
		route_id: null,
		caption: "",
		icon: null,
		sort_order: 10,
		is_active: true,
	};
};

const form = ref<MenuForm>(emptyForm());

const currentOwner = computed(() => {
	return ownerType.value === "role"
		? {
			type: "role" as const,
			roleId: roleId.value,
		}
		: {
			type: "user" as const,
			userId: userId.value,
		};
});

const hasOwner = computed(() => {
	return ownerType.value === "role"
		? roleId.value !== null
		: userId.value !== null;
});

const selectedNode = computed<MainMenuTreeItem<string> | null>(() => {
	if (selectedId.value === null) {
		return null;
	}

	return findMainMenuNode(tree.value, selectedId.value);
});

const editorTitle = computed(() => {
	return form.value.id === null
		? t("mainMenu.form.create")
		: t("mainMenu.form.edit");
});

const flattenParentOptions = (
	nodes: MainMenuTreeItem<string>[],
	excludedIds: Set<number>,
	depth: number = 0,
): ParentOption[] => {
	const result: ParentOption[] = [];

	for (const node of nodes) {
		if (!excludedIds.has(node.id)) {
			result.push({
				value: node.id,
				label: `${"— ".repeat(depth)}${node.caption}`,
			});
		}

		result.push(...flattenParentOptions(node.children, excludedIds, depth + 1));
	}

	return result;
};

const parentOptions = computed<ParentOption[]>(() => {
	const excludedIds = new Set<number>();
	if (form.value.id !== null) {
		const current = findMainMenuNode(tree.value, form.value.id);
		if (current) {
			collectMainMenuNodeIds(current, excludedIds);
		}
	}

	return [
		{
			value: null,
			label: t("mainMenu.root"),
		},
		...flattenParentOptions(tree.value, excludedIds),
	];
});

const normalizeOptionalText = (
	value: string | null | undefined,
): string | null => {
	const normalized = value?.trim() ?? "";
	return normalized || null;
};

const listParams = (): CollectionParams => {
	return {
		from: 0,
		count: 10000,
		sorter: [
			{
				f: "sort_order",
				d: SortDirect.ASC,
			},
			{
				f: "id",
				d: SortDirect.ASC,
			},
		],
	} as unknown as CollectionParams;
};

const buildTree = (): void => {
	tree.value = buildMainMenuTree(rows.value, currentOwner.value);

	if (selectedId.value !== null && !findMainMenuNode(tree.value, selectedId.value)) {
		selectedId.value = null;
	}
};

const load = async (): Promise<void> => {
	if (!hasOwner.value) {
		rows.value = [];
		tree.value = [];
		return;
	}

	loading.value = true;
	error.value = "";

	try {
		const response = await runtime.apis.mainMenu.list(listParams());
		rows.value = response?.rows ?? [];
		buildTree();
	} catch (err: unknown) {
		error.value = errorText(err);
	} finally {
		loading.value = false;
	}
};

const siblingsFor = (
	node: MainMenuTreeItem<string>,
): MainMenuTreeItem<string>[] => {
	if (node.parent_id === null) {
		return tree.value;
	}

	return findMainMenuNode(tree.value, node.parent_id)?.children ?? [];
};

const nextSortOrder = (
	parentId: number | null,
): number => {
	const siblings = parentId === null
		? tree.value
		: findMainMenuNode(tree.value, parentId)?.children ?? [];
	const maxSortOrder = siblings.reduce(
		(maximum, item) => Math.max(maximum, item.sort_order),
		0,
	);

	return maxSortOrder + 10;
};

const selectNode = (
	node: MainMenuTreeItem<string>,
): void => {
	selectedId.value = node.id;
};

const toggleNode = (
	node: MainMenuTreeItem<string>,
): void => {
	if (collapsedIds.value.has(node.id)) {
		collapsedIds.value.delete(node.id);
	} else {
		collapsedIds.value.add(node.id);
	}
};

const openCreate = (
	parent: MainMenuTreeItem<string> | null = null,
): void => {
	editorError.value = "";
	form.value = {
		...emptyForm(),
		parent_id: parent?.id ?? null,
		sort_order: nextSortOrder(parent?.id ?? null),
	};
	editorVisible.value = true;
};

const openEdit = (
	node: MainMenuTreeItem<string>,
): void => {
	editorError.value = "";
	selectedId.value = node.id;
	form.value = {
		id: node.id,
		parent_id: node.parent_id,
		route_id: node.route_id,
		caption: node.caption,
		icon: node.icon,
		sort_order: node.sort_order,
		is_active: node.is_active,
	};
	editorVisible.value = true;
};

const applyRoute = (
	route: MainMenuRouteOption,
): void => {
	form.value.route_id = route.id;
	form.value.caption = route.descr;
	form.value.icon = route.icon;
};

const ownerPayload = (): Pick<MainMenuNew<string>, "role_id" | "user_id"> => {
	if (ownerType.value === "role") {
		return {
			role_id: roleId.value,
			user_id: null,
		};
	}

	return {
		role_id: null,
		user_id: userId.value,
	};
};

const dispatchMenuChanged = (): void => {
	if (typeof window !== "undefined") {
		window.dispatchEvent(new Event(runtime.mainMenuChangedEventName));
	}
};

const save = async (): Promise<void> => {
	editorError.value = "";
	const caption = form.value.caption.trim();
	if (!caption) {
		editorError.value = t("errors.required");
		return;
	}
	if (!hasOwner.value) {
		editorError.value = t("mainMenu.errors.ownerRequired");
		return;
	}

	saving.value = true;
	try {
		const editableFields = {
			parent_id: form.value.parent_id,
			route_id: form.value.route_id,
			caption,
			icon: normalizeOptionalText(form.value.icon),
			sort_order: form.value.sort_order,
			is_active: form.value.is_active,
		};

		if (form.value.id === null) {
			await runtime.apis.mainMenu.create({
				...ownerPayload(),
				...editableFields,
			});
		} else {
			const update: MainMenuUpd<string> = editableFields;
			await runtime.apis.mainMenu.update({
				id: form.value.id,
			}, update);
		}

		editorVisible.value = false;
		dispatchMenuChanged();
		await load();
	} catch (err: unknown) {
		editorError.value = errorText(err);
	} finally {
		saving.value = false;
	}
};

const remove = (
	node: MainMenuTreeItem<string>,
): void => {
	if (busy.value) {
		return;
	}

	selectedId.value = node.id;
	deleteTarget.value = node;
	deleteError.value = "";
	deleteVisible.value = true;
};

const confirmDelete = async (): Promise<void> => {
	const node = deleteTarget.value;
	if (!node || busy.value) {
		return;
	}

	deleting.value = true;
	deleteError.value = "";
	try {
		await runtime.apis.mainMenu.delete({ id: node.id });
		deleteVisible.value = false;
		dispatchMenuChanged();
		await load();
	} catch (err: unknown) {
		deleteError.value = errorText(err);
	} finally {
		deleting.value = false;
	}
};

const persistMove = async (
	plan: MainMenuDropPlan,
	focusAfterDrop: boolean = false,
): Promise<void> => {
	if (busy.value) {
		return;
	}

	const node = findMainMenuNode(tree.value, plan.sourceId);
	if (!node) {
		return;
	}

	const focusedElement = typeof document !== "undefined"
		&& document.activeElement instanceof HTMLElement
		&& document.activeElement.closest("[data-main-menu-id]")?.getAttribute("data-main-menu-id") === String(node.id)
		? document.activeElement
		: null;
	const parentChanged = node.parent_id !== plan.parentId;
	const sortOrders = new Map(plan.orders.map((item) => [item.id, item.sort_order]));
	selectedId.value = node.id;
	moving.value = true;
	error.value = "";
	try {
		if (parentChanged) {
			await runtime.apis.mainMenu.update({ id: node.id }, {
				parent_id: plan.parentId,
				sort_order: sortOrders.get(node.id) ?? node.sort_order,
			});
		}
		for (const order of plan.orders) {
			if (parentChanged && order.id === node.id) {
				continue;
			}
			await runtime.apis.mainMenu.update({ id: order.id }, {
				sort_order: order.sort_order,
			});
		}
		const parent = plan.parentId === null ? null : findMainMenuNode(tree.value, plan.parentId);
		rows.value = rows.value.map((row) => {
			const sortOrder = sortOrders.get(row.id);
			if (parentChanged && row.id === node.id) {
				return {
					...row,
					sort_order: sortOrder ?? row.sort_order,
					main_menus_ref: parent ? { keys: { id: parent.id }, descr: parent.caption } : null,
				};
			}
			return sortOrder === undefined ? row : { ...row, sort_order: sortOrder };
		});
		buildTree();
		dispatchMenuChanged();
	} catch (err: unknown) {
		// Updates are separate API requests; reconcile any that succeeded before the failure.
		await load();
		error.value = errorText(err);
	} finally {
		moving.value = false;
		await nextTick();
		if ((focusedElement || focusAfterDrop) && selectedId.value === node.id
			&& typeof document !== "undefined"
			&& (document.activeElement === document.body || document.activeElement === focusedElement)) {
			let visibleNode = findMainMenuNode(tree.value, node.id);
			let ancestor = visibleNode;
			while (ancestor?.parent_id !== null && ancestor?.parent_id !== undefined) {
				ancestor = findMainMenuNode(tree.value, ancestor.parent_id);
				if (ancestor && collapsedIds.value.has(ancestor.id)) {
					visibleNode = ancestor;
				}
			}
			const row = visibleNode
				? menuContainer.value?.querySelector<HTMLElement>(`[data-main-menu-id="${visibleNode.id}"]`)
				: null;
			const target = focusedElement?.isConnected && !focusedElement.matches(":disabled")
				&& visibleNode?.id === node.id ? focusedElement : row;
			target?.focus({ preventScroll: true });
		}
	}
};

const move = async (
	node: MainMenuTreeItem<string>,
	direction: -1 | 1,
): Promise<void> => {
	if (busy.value) {
		return;
	}
	const siblings = [...siblingsFor(node)].sort(compareMainMenuNodes);
	const index = siblings.findIndex((item) => item.id === node.id);
	const target = siblings[index + direction];
	if (index < 0 || !target) {
		return;
	}
	const plan = planMainMenuDrop(tree.value, node.id, {
		id: target.id,
		position: direction === -1 ? "before" : "after",
	});
	if (plan) {
		await persistMove(plan);
	}
};

const endDrag = (): void => {
	draggedId.value = null;
	dropTarget.value = null;
};

const startDrag = (
	node: MainMenuTreeItem<string>,
	event: DragEvent,
): void => {
	if (busy.value || !event.dataTransfer) {
		event.preventDefault();
		return;
	}
	draggedId.value = node.id;
	dropTarget.value = null;
	selectedId.value = node.id;
	event.dataTransfer.effectAllowed = "move";
	event.dataTransfer.setData("application/x-vue-business-app-menu-item", String(node.id));
	event.dataTransfer.setData("text/plain", String(node.id));
	const row = (event.currentTarget as HTMLElement | null)?.closest<HTMLElement>("[data-main-menu-id]");
	if (row && event.dataTransfer.setDragImage) {
		const rect = row.getBoundingClientRect();
		event.dataTransfer.setDragImage(row, event.clientX - rect.left, event.clientY - rect.top);
	}
};

const rowDropTarget = (
	node: MainMenuTreeItem<string>,
	event: DragEvent,
): MainMenuDropTarget => {
	const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
	const ratio = rect.height > 0 ? (event.clientY - rect.top) / rect.height : 0.5;
	const isFolder = node.route_id === null || node.children.length > 0;
	return {
		id: node.id,
		position: isFolder
			? ratio < 1 / 3 ? "before" : ratio > 2 / 3 ? "after" : "inside"
			: ratio < 0.5 ? "before" : "after",
	};
};

const dragOver = (
	target: MainMenuDropTarget,
	event: DragEvent,
): void => {
	if (busy.value || draggedId.value === null
		|| !planMainMenuDrop(tree.value, draggedId.value, target)) {
		dropTarget.value = null;
		if (event.dataTransfer) {
			event.dataTransfer.dropEffect = "none";
		}
		return;
	}
	event.preventDefault();
	dropTarget.value = target;
	if (event.dataTransfer) {
		event.dataTransfer.dropEffect = "move";
	}
};

const dragOverRow = (
	node: MainMenuTreeItem<string>,
	event: DragEvent,
): void => {
	dragOver(rowDropTarget(node, event), event);
};

const leaveDropTarget = (
	id: number | null,
	event: DragEvent,
): void => {
	const element = event.currentTarget as HTMLElement;
	if (event.relatedTarget instanceof Node && element.contains(event.relatedTarget)) {
		return;
	}
	if (dropTarget.value?.id === id) {
		dropTarget.value = null;
	}
};

const leaveRow = (
	node: MainMenuTreeItem<string>,
	event: DragEvent,
): void => {
	leaveDropTarget(node.id, event);
};

const drop = async (
	target: MainMenuDropTarget,
	event: DragEvent,
): Promise<void> => {
	const plan = !busy.value && draggedId.value !== null
		? planMainMenuDrop(tree.value, draggedId.value, target)
		: null;
	endDrag();
	if (!plan) {
		return;
	}
	event.preventDefault();
	await persistMove(plan, true);
};

const dropOnRow = async (
	node: MainMenuTreeItem<string>,
	event: DragEvent,
): Promise<void> => {
	await drop(rowDropTarget(node, event), event);
};

const currentScopeCount = computed(() => {
	return rows.value.filter((row) => {
		return mainMenuRowMatchesOwner(row, currentOwner.value);
	}).length;
});

watch(
	ownerType,
	(value: OwnerType) => {
		selectedId.value = null;
		if (value === "role") {
			userId.value = null;
			if (roleId.value === null) {
				roleId.value = runtime.defaultRoleId;
			}
		} else {
			roleId.value = null;
		}
	},
);

watch(
	[
		ownerType,
		roleId,
		userId,
	],
	() => {
		endDrag();
		selectedId.value = null;
		collapsedIds.value = new Set<number>();
		rows.value = [];
		tree.value = [];
		editorVisible.value = false;
		deleteVisible.value = false;
		void load();
	},
);

onMounted(load);
</script>

<template>
	<section class="py-4">
		<div class="mb-4 flex flex-wrap items-center justify-between gap-3">
			<div>
				<h1 class="text-2xl font-semibold text-slate-900">
					{{ t("mainMenu.title") }}
				</h1>
				<p class="mt-1 text-sm text-slate-500">
					{{ t("mainMenu.subtitle") }}
				</p>
			</div>

			<div class="flex items-center gap-2">
				<Button
					:label="t('commands.refresh')"
					icon="pi pi-refresh"
					severity="secondary"
					outlined
					:loading="loading"
					:disabled="busy"
					@click="load"
				/>
				<Button
					:label="t('mainMenu.actions.addRoot')"
					icon="pi pi-plus"
					:disabled="!hasOwner || busy"
					@click="openCreate()"
				/>
			</div>
		</div>

		<div class="mb-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
			<div class="grid grid-cols-1 gap-4 lg:grid-cols-3">
				<div class="flex flex-col gap-1">
					<label for="mainMenuOwnerType" class="text-sm font-medium text-slate-700">
						{{ t("mainMenu.fields.ownerType") }}
					</label>
					<Select
						id="mainMenuOwnerType"
						v-model="ownerType"
						:disabled="busy"
						:options="ownerTypeOptions"
						optionLabel="label"
						optionValue="value"
						class="w-full"
					/>
				</div>

				<div
					v-if="ownerType === 'role'"
					class="flex flex-col gap-1 lg:col-span-2"
				>
					<label for="mainMenuRole" class="text-sm font-medium text-slate-700">
						{{ t("mainMenu.fields.roleId") }}
					</label>
					<RoleReferenceSelect
						id="mainMenuRole"
						v-model="roleId"
						:disabled="busy"
						:showClear="false"
					/>
				</div>

				<div
					v-else
					class="flex flex-col gap-1 lg:col-span-2"
				>
					<label for="mainMenuUser" class="text-sm font-medium text-slate-700">
						{{ t("mainMenu.fields.userId") }}
					</label>
					<UserReferenceInput
						id="mainMenuUser"
						v-model="userId"
						:disabled="busy"
						:label="t('mainMenu.fields.userId')"
					/>
				</div>
			</div>
		</div>

		<div
			v-if="error"
			class="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
		>
			{{ error }}
		</div>

		<div ref="menuContainer" class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
			<div class="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
				<div class="text-sm font-semibold text-slate-700">
					{{ t("mainMenu.tree") }}
				</div>
				<div class="text-xs text-slate-500">
					{{ t("mainMenu.itemCount", { count: currentScopeCount }) }}
				</div>
			</div>

			<p v-if="hasOwner && tree.length > 0" class="m-0 border-b border-slate-100 px-4 py-2 text-xs text-slate-500">
				{{ t("mainMenu.dragHelp") }}
			</p>

			<div
				v-if="loading && tree.length === 0"
				class="p-6 text-center text-sm text-slate-500"
			>
				{{ t("loading") }}
			</div>

			<div
				v-else-if="!hasOwner"
				class="p-6 text-center text-sm text-slate-500"
			>
				{{ t("mainMenu.selectOwner") }}
			</div>

			<div
				v-else-if="tree.length === 0"
				class="p-6 text-center text-sm text-slate-500"
			>
				{{ t("mainMenu.empty") }}
			</div>

			<TransitionGroup
				v-else
				tag="ul"
				name="main-menu-reorder"
				:css="false"
				class="m-0 list-none p-0"
				:aria-busy="busy"
			>
				<MainMenuTreeNode
					v-for="(node, index) in tree"
					:key="node.id"
					:node="node"
					:selectedId="selectedId"
					:collapsedIds="collapsedIds"
					:busy="busy"
					:dragEnabled="true"
					:draggedId="draggedId"
					:dropTarget="dropTarget"
					:canMoveUp="index > 0"
					:canMoveDown="index < tree.length - 1"
					@select="selectNode"
					@toggle="toggleNode"
					@addChild="openCreate"
					@edit="openEdit"
					@delete="remove"
					@moveUp="move($event, -1)"
					@moveDown="move($event, 1)"
					@dragStart="startDrag"
					@dragEnd="endDrag"
					@dragOver="dragOverRow"
					@dragLeave="leaveRow"
					@drop="dropOnRow"
				/>
			</TransitionGroup>
			<div
				v-if="draggedId !== null"
				data-main-menu-root-drop
				:class="['main-menu-root-drop m-3 rounded-lg border-2 border-dashed border-slate-300 p-3 text-center text-sm text-slate-500', {
					'main-menu-drop-inside': dropTarget?.id === null,
				}]"
				@dragover.stop="dragOver({ id: null, position: 'inside' }, $event)"
				@dragleave.stop="leaveDropTarget(null, $event)"
				@drop.stop="drop({ id: null, position: 'inside' }, $event)"
			>
				{{ t("mainMenu.dropAtRoot") }}
			</div>
		</div>

		<div
			v-if="selectedNode"
			class="mt-3 text-xs text-slate-500"
		>
			{{ t("mainMenu.selected", { caption: selectedNode.caption }) }}
		</div>

		<Dialog
			v-model:visible="deleteVisible"
			:header="t('mainMenu.deleteTitle')"
			modal
			:closable="!deleting"
			:closeOnEscape="!deleting"
			:style="{ width: '28rem', maxWidth: 'calc(100vw - 2rem)' }"
			aria-describedby="mainMenuDeleteMessage"
		>
			<p id="mainMenuDeleteMessage" class="m-0 text-sm text-slate-700">
				{{ deleteMessage }}
			</p>
			<div
				v-if="deleteError"
				role="alert"
				class="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
			>
				{{ deleteError }}
			</div>
			<template #footer>
				<Button
					:label="t('commands.cancel')"
					severity="secondary"
					outlined
					:disabled="deleting"
					@click="deleteVisible = false"
				/>
				<Button
					:label="t('mainMenu.treeNode.delete')"
					icon="pi pi-trash"
					severity="danger"
					:loading="deleting"
					:disabled="deleting"
					@click="confirmDelete"
				/>
			</template>
		</Dialog>

		<Dialog
			v-model:visible="editorVisible"
			:header="editorTitle"
			modal
			:style="{ width: '42rem', maxWidth: 'calc(100vw - 2rem)' }"
		>
			<form
				class="space-y-4"
				@submit.prevent="save"
			>
				<div
					v-if="editorError"
					class="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
				>
					{{ editorError }}
				</div>

				<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
					<div class="flex flex-col gap-1 md:col-span-2">
						<label for="mainMenuCaption">{{ t("mainMenu.fields.caption") }}</label>
						<InputText
							id="mainMenuCaption"
							v-model="form.caption"
							maxlength="250"
							required
							autofocus
						/>
					</div>

					<div class="flex flex-col gap-1 md:col-span-2">
						<label for="mainMenuParent">{{ t("mainMenu.fields.parentId") }}</label>
						<Select
							id="mainMenuParent"
							v-model="form.parent_id"
							:options="parentOptions"
							optionLabel="label"
							optionValue="value"
							filter
							class="w-full"
						/>
					</div>

					<div class="flex flex-col gap-1 md:col-span-2">
						<label for="mainMenuRoute">{{ t("mainMenu.fields.route") }}</label>
						<MainMenuRouteInput
							id="mainMenuRoute"
							v-model="form.route_id"
							:placeholder="t('mainMenu.routePlaceholder')"
							@select="applyRoute"
						/>
						<small class="text-slate-500">
							{{ t("mainMenu.routeHelp") }}
						</small>
					</div>

					<div class="flex flex-col gap-1">
						<label for="mainMenuIcon">{{ t("mainMenu.fields.icon") }}</label>
						<InputText
							id="mainMenuIcon"
							v-model="form.icon"
							maxlength="250"
							placeholder="pi pi-list"
						/>
					</div>

					<div class="flex flex-col gap-1">
						<label for="mainMenuSortOrder">{{ t("mainMenu.fields.sortOrder") }}</label>
						<InputNumber
							id="mainMenuSortOrder"
							v-model="form.sort_order"
							:useGrouping="false"
						/>
					</div>

					<div class="flex items-center gap-3 md:col-span-2">
						<ToggleSwitch
							id="mainMenuActive"
							v-model="form.is_active"
						/>
						<label for="mainMenuActive">{{ t("mainMenu.fields.isActive") }}</label>
					</div>
				</div>

				<div class="flex justify-end gap-2 pt-2">
					<Button
						:label="t('commands.cancel')"
						severity="secondary"
						outlined
						type="button"
						@click="editorVisible = false"
					/>
					<Button
						:label="t('commands.save')"
						icon="pi pi-check"
						:loading="saving"
						type="submit"
					/>
				</div>
			</form>
		</Dialog>
	</section>
</template>

<style scoped>
.main-menu-root-drop.main-menu-drop-inside {
	border-color: #3b82f6;
	background: #eff6ff;
	color: #1d4ed8;
}

.main-menu-reorder-move {
	transition: transform 180ms ease;
}

@media (prefers-reduced-motion: reduce) {
	.main-menu-reorder-move {
		transition: none;
	}
}
</style>
