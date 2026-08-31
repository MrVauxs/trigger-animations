const { NodeEntry } = globalThis.triggerEngine;

declare global {
	/**
	 * A live handle to TMFX shader, produced by the Add state of the Token Magic node and consumed by its Remove state.
	 */
	interface TMFXFilterHandle {
		/** The id the filter was registered under. */
		filterId: string;
		/**
		 * The filter's key in the module's registry (`$lib/tmfxRegistry`). Carrying
		 * the key rather than a closure lets any later section release the filter,
		 * even one built after the Add node's own section is gone.
		 */
		key: string;
		/** UUID of the document the filter sits on, the other half of {@link key}. */
		uuid: string;
		/** Identifies this node's claim, so it cannot release another node's filter. */
		leaseId: string;
		/** The document the filter sits on. */
		placeable: TokenDocument | RegionDocument;
		/** Removes the filter, along with its duration timer and tie-to hooks. */
		remove: (reason?: string) => Promise<void>;
	}
}

class TokenMagicFilterEntry extends NodeEntry<TMFXFilterHandle> {
	static override get type() {
		return "tmfx-filter";
	}

	static override get default() {
		return undefined;
	}

	/** The color of the node connection. */
	static override get color(): ColorSource {
		return "#4bc470";
	}

	static override isValidType(value: unknown): boolean {
		return (
			typeof value === "object"
			&& value !== null
			&& typeof (value as TMFXFilterHandle).filterId === "string"
			&& typeof (value as TMFXFilterHandle).key === "string"
			&& typeof (value as TMFXFilterHandle).remove === "function"
		);
	}
}

export { TokenMagicFilterEntry };
