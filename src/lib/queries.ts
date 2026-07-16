import { id } from "moduleJSON";
import * as s from "./serialize";
import { devLog } from "./utils";

interface QueryOptions { timeout?: number }
type QueryFunc = (data: Record<string, any>, options: QueryOptions) => Promise<any>;

function addQuery(name: string, func: QueryFunc) {
	CONFIG.queries[`${id}.${name}`] = func;
	return name;
}

export function useQuery(user: User | string, name: string, data: Record<string, any>, options: QueryOptions = {}) {
	options.timeout ??= 30 * 1000; // 30 second timeout

	let userDoc: User | undefined;
	if (typeof user === "string") {
		userDoc = game.users.get(user);
	} else {
		userDoc = user;
	}
	if (!userDoc)
		throw new Error(`Could not find user "${user}"`);

	return userDoc.query(name, { serialized: s.stringify(data) }, options);
}

export function registerQueries() {
	addQuery("showCrosshair", async (data, { timeout }) => {
		const crosshairData = s.parse(data.serialized);
		devLog("Received query showCrosshair", crosshairData);
	});
}

const ready = Hooks.on("ready", registerQueries);
if (import.meta.hot) {
	import.meta.hot.accept((m) => {
		if (m)
			m.registerQueries();
	});
	import.meta.hot.dispose(() => {
		Hooks.off("ready", ready);
	});
}
