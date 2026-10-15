import { watch } from "node:fs";

import { DATABASE_DIR } from "./focus";

/**
 * Calls `onChange` whenever a file in the DoNotDisturb database changes.
 *
 * Watches the directory rather than the files, so the watch survives a file being replaced rather than rewritten in place.
 */
export function watchDatabase(onChange: () => void, onError: (error: unknown) => void): void {
	try {
		watch(DATABASE_DIR, onChange).on("error", onError);
	} catch (error) {
		onError(error);
	}
}
