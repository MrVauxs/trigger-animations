import { API } from "./api";
import "./module.css";
import "./hooks"
// Expose the API on the module's global namespace
globalThis.triggerAnimations = {
	api: new API()
};
