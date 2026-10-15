import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

export const DATABASE_DIR = join(homedir(), "Library/DoNotDisturb/DB");

export interface FocusMode {
	id: string;
	name: string;
}

interface ModeConfigurations {
	data?: {
		modeConfigurations?: Record<string, { mode?: { name?: string; modeIdentifier?: string; visibility?: number } }>;
	}[];
}

const HIDDEN = 1;

export function parseModes(configurations: ModeConfigurations): FocusMode[] {
	return Object.entries(configurations.data?.[0]?.modeConfigurations ?? {})
		.filter(([, { mode }]) => mode?.visibility !== HIDDEN)
		.map(([key, { mode }]) => {
			const id = mode?.modeIdentifier ?? key;
			return { id, name: mode?.name ?? id };
		});
}

export async function readModes(): Promise<FocusMode[]> {
	return parseModes(JSON.parse(await readFile(join(DATABASE_DIR, "ModeConfigurations.json"), "utf8")));
}
