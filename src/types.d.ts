import type { API } from "./api";

declare global {
	namespace triggerAnimations {
		const api: API;
	}
}

export type { API };
