import type { API } from "./api";

declare global {
	namespace triggerAnimations {
		export const api: API;
	}
}

export type { API };
