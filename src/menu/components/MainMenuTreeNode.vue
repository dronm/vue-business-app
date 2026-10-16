<script setup lang="ts">
import {
	computed,
	ref,
	TransitionGroup,
} from "vue";

import Button from "primevue/button";

import { useBusinessAppI18n } from "../../i18n/useBusinessAppI18n";
import type { MainMenuDropTarget } from "../reorder";
import type { MainMenuTreeItem } from "../types";

const props = withDefaults(defineProps<{
	node: MainMenuTreeItem<string>;
	depth?: number;
	selectedId?: number | null;
	canMoveUp?: boolean;
	canMoveDown?: boolean;
	collapsedIds?: ReadonlySet<number>;
	busy?: boolean;
	dragEnabled?: boolean;
	draggedId?: number | null;
	dropTarget?: MainMenuDropTarget | null;
}>(), {
	depth: 0,
	selectedId: null,
	canMoveUp: false,
	canMoveDown: false,
	busy: false,
	dragEnabled: false,
	draggedId: null,
	dropTarget: null,
});

const emit = defineEmits<{
	select: [node: MainMenuTreeItem<string>];
	addChild: [node: MainMenuTreeItem<string>];
	edit: [node: MainMenuTreeItem<string>];
	delete: [node: MainMenuTreeItem<string>];
	moveUp: [node: MainMenuTreeItem<string>];
	moveDown: [node: MainMenuTreeItem<string>];
	toggle: [node: MainMenuTreeItem<string>];
	dragStart: [node: MainMenuTreeItem<string>, event: DragEvent];
	dragEnd: [];
	dragOver: [node: MainMenuTreeItem<string>, event: DragEvent];
	dragLeave: [node: MainMenuTreeItem<string>, event: DragEvent];
	drop: [node: MainMenuTreeItem<string>, event: DragEvent];
}>();

const { t } = useBusinessAppI18n();
const open = ref(true);

const hasChildren = computed(() => props.node.children.length > 0);
const isFolder = computed(() => hasChildren.value || props.node.route_id === null);
const isOpen = computed(() => props.collapsedIds === undefined
	? open.value
	: !props.collapsedIds.has(props.node.id));
const selected = computed(() => props.selectedId === props.node.id);
const dropPosition = computed(() => props.dropTarget?.id === props.node.id
	? props.dropTarget.position
	: null);
const rowPadding = computed(() => `${0.75 + props.depth * 1.4}rem`);
const displayIcon = computed(() => {
	if (isFolder.value) {
		return hasChildren.value && isOpen.value ? "pi pi-folder-open" : "pi pi-folder";
	}

	return props.node.icon?.trim() || "pi pi-link";
});
const toggleLabel = computed(() => `${t(isOpen.value ? "mainMenu.treeNode.collapse" : "mainMenu.treeNode.expand")}: ${props.node.caption}`);

const toggle = (): void => {
	if (!hasChildren.value) {
		return;
	}

	if (props.collapsedIds !== undefined) {
		emit("toggle", props.node);
		return;
	}

	open.value = !open.value;
};
</script>

<template>
	<li :class="['main-menu-node', { 'main-menu-drop-after': dropPosition === 'after' }]">
		<div
			:data-main-menu-id="node.id"
			tabindex="-1"
			:class="[
				'main-menu-row group flex min-h-11 items-center gap-2 border-b border-slate-100 pr-2 transition',
				selected ? 'bg-blue-50' : 'bg-white hover:bg-slate-50',
				{
					'main-menu-dragging': draggedId === node.id,
					'main-menu-drop-before': dropPosition === 'before',
					'main-menu-drop-inside': dropPosition === 'inside',
					'main-menu-drop-after': dropPosition === 'after',
				},
			]"
			:style="{ paddingLeft: rowPadding }"
			@click="emit('select', node)"
			@dragover.stop="emit('dragOver', node, $event)"
			@dragleave.stop="emit('dragLeave', node, $event)"
			@drop.stop="emit('drop', node, $event)"
		>
			<button
				v-if="hasChildren"
				type="button"
				class="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-500 hover:bg-slate-200"
				:aria-expanded="isOpen"
				:aria-label="toggleLabel"
				@click.stop="toggle"
			>
				<span :class="[displayIcon, 'text-sm']" aria-hidden="true" />
			</button>

			<span
				v-else
				class="flex h-7 w-7 shrink-0 items-center justify-center text-slate-500"
				aria-hidden="true"
			>
				<span :class="[displayIcon, 'text-sm']" />
			</span>

			<div class="main-menu-content min-w-0 flex-1 py-2">
				<div class="main-menu-caption flex min-w-0 items-center gap-2">
					<span
						:class="[
							'main-menu-drag-label min-w-0 truncate text-sm font-medium',
							node.is_active ? 'text-slate-900' : 'text-slate-400 line-through',
						]"
						:draggable="dragEnabled && !busy"
						:tabindex="dragEnabled && !busy ? 0 : -1"
						:aria-label="dragEnabled ? `${t('mainMenu.treeNode.drag')}: ${node.caption}` : undefined"
						:title="dragEnabled ? t('mainMenu.treeNode.drag') : undefined"
						@dragstart.stop="emit('dragStart', node, $event)"
						@dragend.stop="emit('dragEnd')"
						@keydown.enter.stop="emit('select', node)"
						@keydown.space.prevent.stop="emit('select', node)"
					>
						{{ node.caption }}
					</span>
					<span
						v-if="!node.is_active"
						class="shrink-0 rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-slate-500"
					>
						{{ t("mainMenu.treeNode.disabled") }}
					</span>
					<div
						class="main-menu-actions shrink-0 gap-1 rounded-md bg-white/90 shadow-sm ring-1 ring-slate-200"
					>
						<Button
							class="main-menu-action"
							icon="pi pi-arrow-up"
							severity="secondary"
							text
							rounded
							size="small"
							:disabled="props.busy || !props.canMoveUp"
							:aria-label="t('mainMenu.treeNode.moveUp')"
							@click.stop="emit('moveUp', node)"
						/>
						<Button
							class="main-menu-action"
							icon="pi pi-arrow-down"
							severity="secondary"
							text
							rounded
							size="small"
							:disabled="props.busy || !props.canMoveDown"
							:aria-label="t('mainMenu.treeNode.moveDown')"
							@click.stop="emit('moveDown', node)"
						/>
						<Button
							class="main-menu-action"
							icon="pi pi-plus"
							severity="secondary"
							text
							rounded
							size="small"
							:disabled="props.busy"
							:aria-label="t('mainMenu.treeNode.addChild')"
							@click.stop="emit('addChild', node)"
						/>
						<Button
							class="main-menu-action"
							icon="pi pi-pencil"
							severity="secondary"
							text
							rounded
							size="small"
							:disabled="props.busy"
							:aria-label="t('mainMenu.treeNode.edit')"
							@click.stop="emit('edit', node)"
						/>
						<Button
							class="main-menu-action"
							icon="pi pi-trash"
							severity="danger"
							text
							rounded
							size="small"
							:disabled="props.busy"
							:aria-label="t('mainMenu.treeNode.delete')"
							@click.stop="emit('delete', node)"
						/>
					</div>
				</div>
				<div class="main-menu-subtitle truncate text-xs text-slate-500">
					{{ node.route_name || t("mainMenu.treeNode.group") }}
				</div>
			</div>
		</div>

		<TransitionGroup
			v-if="hasChildren"
			v-show="isOpen"
			tag="ul"
			name="main-menu-reorder"
			:css="false"
			class="m-0 list-none p-0"
		>
			<MainMenuTreeNode
				v-for="(child, index) in node.children"
				:key="child.id"
				:node="child"
				:depth="props.depth + 1"
				:selectedId="props.selectedId"
				:canMoveUp="index > 0"
				:canMoveDown="index < node.children.length - 1"
				:collapsedIds="props.collapsedIds"
				:busy="props.busy"
				:dragEnabled="props.dragEnabled"
				:draggedId="props.draggedId"
				:dropTarget="props.dropTarget"
				@select="emit('select', $event)"
				@addChild="emit('addChild', $event)"
				@edit="emit('edit', $event)"
				@delete="emit('delete', $event)"
				@moveUp="emit('moveUp', $event)"
				@moveDown="emit('moveDown', $event)"
				@toggle="emit('toggle', $event)"
				@dragStart="(node, event) => emit('dragStart', node, event)"
				@dragEnd="emit('dragEnd')"
				@dragOver="(node, event) => emit('dragOver', node, event)"
				@dragLeave="(node, event) => emit('dragLeave', node, event)"
				@drop="(node, event) => emit('drop', node, event)"
			/>
		</TransitionGroup>
	</li>
</template>

<style scoped>
.main-menu-node,
.main-menu-row {
	position: relative;
}

.main-menu-caption {
	position: relative;
	box-sizing: border-box;
	width: fit-content;
	max-width: 100%;
	height: 1.5rem;
	padding-right: 9rem;
	line-height: 1.25rem;
}

.main-menu-subtitle {
	height: 1rem;
	line-height: 1rem;
}

.main-menu-actions {
	position: absolute;
	top: 50%;
	right: 0;
	display: flex;
	align-items: center;
	gap: 0.25rem;
	width: 8.5rem;
	height: 1.5rem;
	transform: translateY(-50%);
	opacity: 0;
	pointer-events: none;
}

.main-menu-row:hover .main-menu-actions,
.main-menu-row:focus-within .main-menu-actions {
	opacity: 1;
	pointer-events: auto;
}

.main-menu-actions :deep(.main-menu-action) {
	box-sizing: border-box;
	width: 1.5rem;
	height: 1.5rem;
	min-width: 1.5rem;
	min-height: 0;
	padding: 0;
	flex: 0 0 1.5rem;
}

.main-menu-drag-label[draggable="true"] {
	cursor: grab;
	user-select: none;
}

.main-menu-drag-label[draggable="true"]:active {
	cursor: grabbing;
}

.main-menu-dragging {
	opacity: 0.5;
}

.main-menu-row.main-menu-drop-before::before,
.main-menu-node.main-menu-drop-after::after {
	position: absolute;
	right: 0;
	left: 0;
	z-index: 1;
	height: 3px;
	background: #2563eb;
	content: "";
	pointer-events: none;
}

.main-menu-row.main-menu-drop-before::before {
	top: -1px;
}

.main-menu-node.main-menu-drop-after::after {
	bottom: -1px;
}

.main-menu-row.main-menu-drop-inside {
	background: #dbeafe;
	box-shadow: inset 0 0 0 2px #2563eb;
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
