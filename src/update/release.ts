const LATEST = "https://api.github.com/repos/Akeboshiwind/focus-mode-switcher/releases/latest";
export const ASSET = "rocks.bythe.focus-mode-switcher.streamDeckPlugin";

/** The release workflow packs a `vX.Y.Z` tag as `X.Y.Z.0`, so the two compare on their first three parts. */
const TAG = /^v(\d+)\.(\d+)\.(\d+)$/;
const RUNNING_VERSION = /^(\d+)\.(\d+)\.(\d+)\.\d+$/;

type Version = readonly [number, number, number];

export type Release = { version: Version; tag: string; assetUrl: string };

type LatestRelease = { tag_name?: string; assets?: { name?: string; browser_download_url?: string }[] };

function parseVersion(text: string, pattern: RegExp): Version | undefined {
	const match = pattern.exec(text);
	return match ? [Number(match[1]), Number(match[2]), Number(match[3])] : undefined;
}

export function parseRelease(latest: LatestRelease): Release | undefined {
	const tag = latest.tag_name;
	const version = tag === undefined ? undefined : parseVersion(tag, TAG);
	const assetUrl = latest.assets?.find((asset) => asset.name === ASSET)?.browser_download_url;
	return tag !== undefined && version !== undefined && assetUrl !== undefined ? { version, tag, assetUrl } : undefined;
}

export function newerRelease(release: Release, runningVersion: string): Release | undefined {
	const running = parseVersion(runningVersion, RUNNING_VERSION);
	if (running === undefined) return undefined;
	const differing = release.version.findIndex((part, i) => part !== running[i]);
	return differing !== -1 && release.version[differing]! > running[differing]! ? release : undefined;
}

export async function fetchLatestRelease(): Promise<Release | undefined> {
	const response = await fetch(LATEST, { headers: { Accept: "application/vnd.github+json" }, signal: AbortSignal.timeout(10_000) });
	if (!response.ok) throw new Error(`${LATEST} returned ${response.status}`);
	return parseRelease((await response.json()) as LatestRelease);
}
