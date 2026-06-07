import { API } from "./api";
import "./module.css";
import "./hooks"

const { NodeEntry, NodeField, TriggerHook, TriggerNode } = globalThis.triggerEngine;

// Expose the API on the module's global namespace
globalThis.triggerAnimations = {
	api: new API()
};
