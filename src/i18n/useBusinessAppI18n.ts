import { useI18n } from "vue-i18n";

import { businessAppMessages } from "./messages";

export const useBusinessAppI18n = () => {
	return useI18n({
		useScope: "local",
		inheritLocale: true,
		messages: businessAppMessages,
	});
};
