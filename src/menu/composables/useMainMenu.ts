import {
	onBeforeUnmount,
	onMounted,
	ref,
} from "vue";

import { errorText } from "@katren/vue-collection-lib/utils/errorText";

import { useBusinessApp } from "../../core/runtime";
import type { MainMenuForUser } from "../types";

export interface UseMainMenuOptions {
	autoLoad?: boolean;
	listenForChanges?: boolean;
}

export const useMainMenu = (
	options: UseMainMenuOptions = {},
) => {
	const runtime = useBusinessApp();
	const menu = ref<MainMenuForUser[]>([]);
	const loading = ref(false);
	const error = ref<string | null>(null);

	const load = async (): Promise<void> => {
		loading.value = true;
		error.value = null;

		try {
			menu.value = await runtime.apis.mainMenu.forUser();
		} catch (err: unknown) {
			menu.value = [];
			error.value = errorText(err);
		} finally {
			loading.value = false;
		}
	};

	const changeHandler = (): void => {
		void load();
	};

	onMounted(() => {
		if (options.listenForChanges !== false && typeof window !== "undefined") {
			window.addEventListener(runtime.mainMenuChangedEventName, changeHandler);
		}

		if (options.autoLoad !== false) {
			void load();
		}
	});

	onBeforeUnmount(() => {
		if (options.listenForChanges !== false && typeof window !== "undefined") {
			window.removeEventListener(runtime.mainMenuChangedEventName, changeHandler);
		}
	});

	return {
		menu,
		loading,
		error,
		load,
		reload: load,
	};
};
