import { execFile, spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

import type { FocusMode } from "./modes";

const execFileAsync = promisify(execFile);

export const SHORTCUT_NAME = "Focus Mode Switcher";

/**
 * A shortcut with one Set Focus action that turns on the Focus named by the shortcut's input.
 */
export const SHORTCUT = {
	WFWorkflowActions: [
		{
			WFWorkflowActionIdentifier: "is.workflow.actions.dnd.set",
			WFWorkflowActionParameters: {
				Enabled: 1,
				FocusModes: { Value: { Type: "ExtensionInput" }, WFSerializationType: "WFTextTokenAttachment" },
			},
		},
	],
	WFWorkflowClientVersion: "4711",
	WFWorkflowHasShortcutInputVariables: true,
	WFWorkflowIcon: { WFWorkflowIconGlyphNumber: 61440, WFWorkflowIconStartColor: 946986751 },
	WFWorkflowImportQuestions: [],
	WFWorkflowInputContentItemClasses: ["WFStringContentItem"],
	WFWorkflowMinimumClientVersion: 900,
	WFWorkflowTypes: [],
};

export function focusNameFor(modes: Pick<FocusMode, "id" | "name">[], modeId: string | undefined): string | undefined {
	const mode = modes.find((m) => m.id === modeId);
	if (mode === undefined || modes.filter((m) => m.name === mode.name).length > 1) return undefined;
	return mode.name;
}

/**
 * Signs the shortcut and opens it, so Shortcuts asks the user to add it.
 */
export async function installShortcut(): Promise<void> {
	const directory = join(tmpdir(), "focus-mode-switcher");
	await mkdir(directory, { recursive: true });
	const json = join(directory, "shortcut.json");
	const unsigned = join(directory, "unsigned.shortcut");
	const signed = join(directory, `${SHORTCUT_NAME}.shortcut`);
	await writeFile(json, JSON.stringify(SHORTCUT));
	await execFileAsync("/usr/bin/plutil", ["-convert", "binary1", "-o", unsigned, json]);
	await execFileAsync("/usr/bin/shortcuts", ["sign", "--mode", "people-who-know-me", "-i", unsigned, "-o", signed]);
	await execFileAsync("/usr/bin/open", [signed]);
}

/**
 * Runs the shortcut with `focusName` on stdin; `shortcuts run -i` would read a file of that name if one existed.
 */
export function enableFocus(focusName: string): Promise<void> {
	return new Promise((resolve, reject) => {
		const child = spawn("/usr/bin/shortcuts", ["run", SHORTCUT_NAME]);
		let stderr = "";
		child.stderr.on("data", (chunk) => (stderr += chunk));
		child.on("error", reject);
		child.on("close", (code) => (code === 0 ? resolve() : reject(new Error(stderr.trim() || `shortcuts exited with ${code}`))));
		child.stdin.end(focusName);
	});
}
