import { fileURLToPath, URL } from "node:url";

import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";

const external = (
	id: string,
): boolean => {
	return id === "vue"
		|| id === "vue-router"
		|| id === "vue-i18n"
		|| id === "valibot"
		|| id === "primevue"
		|| id.startsWith("primevue/")
		|| id === "@katren/vue-collection-lib"
		|| id.startsWith("@katren/vue-collection-lib/");
};

export default defineConfig({
	plugins: [vue()],
	resolve: {
		alias: {
			"@": fileURLToPath(new URL("./src", import.meta.url)),
		},
	},
	build: {
		lib: {
			entry: fileURLToPath(new URL("./src/index.ts", import.meta.url)),
			formats: ["es"],
			fileName: "index",
		},
		rollupOptions: {
			external,
			output: {
				preserveModules: true,
				preserveModulesRoot: "src",
				entryFileNames: "[name].js",
			},
		},
	},
});
