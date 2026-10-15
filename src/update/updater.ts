import streamDeck from "@elgato/streamdeck";
import { execFile } from "node:child_process";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

import { ASSET, fetchLatestRelease, newerRelease, type Release } from "./release";

const execFileAsync = promisify(execFile);

type GlobalSettings = { updateOpenedFor?: string };

/**
 * Downloads the release's `.streamDeckPlugin` and opens it, so Stream Deck asks the user whether to install it.
 */
export async function openInstaller(release: Release): Promise<void> {
	const response = await fetch(release.assetUrl, { signal: AbortSignal.timeout(60_000) });
	if (!response.ok) throw new Error(`${release.assetUrl} returned ${response.status}`);
	const file = join(await mkdtemp(join(tmpdir(), "focus-mode-switcher-")), ASSET);
	await writeFile(file, Buffer.from(await response.arrayBuffer()));
	await execFileAsync("/usr/bin/open", [file]);
}

/**
 * The release newer than `runningVersion`, if there is one, after opening its installer at most once per release.
 * Rejects when GitHub can't be reached; a failed download is logged and retried on the next check.
 */
export async function checkForUpdate(runningVersion: string): Promise<Release | undefined> {
	const latest = await fetchLatestRelease();
	const update = latest && newerRelease(latest, runningVersion);
	if (update === undefined) return undefined;
	const settings = await streamDeck.settings.getGlobalSettings<GlobalSettings>();
	if (settings.updateOpenedFor !== update.tag) {
		try {
			await openInstaller(update);
			await streamDeck.settings.setGlobalSettings<GlobalSettings>({ ...settings, updateOpenedFor: update.tag });
		} catch (error) {
			streamDeck.logger.debug(`Opening the installer for ${update.tag} failed`, error);
		}
	}
	return update;
}
