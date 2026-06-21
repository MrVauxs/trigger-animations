import type { API as realAPI } from "./api";

declare global {
	namespace triggerAnimations {
		interface API extends realAPI { }
	}
}

export type { API };
