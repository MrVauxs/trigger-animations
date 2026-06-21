import type { API } from "./api";

declare global {
	namespace triggerAnimations {
		// TODO: This is ugly to me, but Idle's types force my hand. Look into making this actually proper.
		namespace api {
			const db: API["db"];
			const settingsMount: API["settingsMount"];
			const openBlueprint: API["openBlueprint"];
			const endAnimation: API["endAnimation"];
			const endAllAnimation: API["endAllAnimation"];
			const createJournalDatabase: API["createJournalDatabase"];
		}
	}
}

export type { API };
