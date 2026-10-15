import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

import { parseActiveModeId } from "./active";
import { parseModes, type FocusMode } from "./modes";

export const DATABASE_DIR = join(homedir(), "Library/DoNotDisturb/DB");

const SUPPORTED_VERSIONS = {
	"ModeConfigurations.json": 3,
	"Assertions.json": 8,
};

type DatabaseFile = keyof typeof SUPPORTED_VERSIONS;

export type Focus =
	| { kind: "ok"; modes: FocusMode[]; activeModeId: string | undefined }
	| { kind: "no-access" }
	| { kind: "unsupported-version" };

export class UnsupportedVersion extends Error {
	constructor(file: DatabaseFile, version: unknown) {
		super(`${file} has header version ${String(version)}; this plugin reads version ${SUPPORTED_VERSIONS[file]}`);
	}
}

export function checkVersion(file: DatabaseFile, json: { header?: { version?: unknown } }): void {
	const version = json.header?.version;
	if (version !== SUPPORTED_VERSIONS[file]) throw new UnsupportedVersion(file, version);
}

export function focusFailure(error: unknown): Exclude<Focus, { kind: "ok" }> {
	if (error instanceof UnsupportedVersion) return { kind: "unsupported-version" };
	const code = (error as NodeJS.ErrnoException).code;
	if (code === "EPERM" || code === "EACCES") return { kind: "no-access" };
	throw error;
}

async function readDatabaseFile(file: DatabaseFile) {
	const json = JSON.parse(await readFile(join(DATABASE_DIR, file), "utf8"));
	checkVersion(file, json);
	return json;
}

export async function readFocus(): Promise<Focus> {
	try {
		const [configurations, assertions] = await Promise.all([readDatabaseFile("ModeConfigurations.json"), readDatabaseFile("Assertions.json")]);
		return { kind: "ok", modes: parseModes(configurations), activeModeId: parseActiveModeId(assertions) };
	} catch (error) {
		return focusFailure(error);
	}
}
