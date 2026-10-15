import assert from "node:assert/strict";
import { test } from "node:test";

import { newerRelease, parseRelease } from "./release";

const ASSET = "rocks.bythe.focus-mode-switcher.streamDeckPlugin";
const URL = "https://github.com/Akeboshiwind/focus-mode-switcher/releases/download/v0.2.0/" + ASSET;

const latest = (tag: string, assets = [{ name: ASSET, browser_download_url: URL }]) => ({ tag_name: tag, assets });

test("a release tagged vX.Y.Z with the plugin attached is a release", () => {
	assert.deepEqual(parseRelease(latest("v0.2.0")), { version: [0, 2, 0], tag: "v0.2.0", assetUrl: URL });
});

test("a release without the plugin attached, or with another tag shape, is not", () => {
	assert.equal(parseRelease(latest("v0.2.0", [])), undefined);
	assert.equal(parseRelease(latest("v0.2.0-rc.1")), undefined);
	assert.equal(parseRelease({}), undefined);
});

test("a release is an update only when newer than the running four-part version", () => {
	const release = parseRelease(latest("v0.2.0"))!;
	assert.equal(newerRelease(release, "0.1.0.0"), release);
	assert.equal(newerRelease(release, "0.2.0.0"), undefined);
	assert.equal(newerRelease(release, "0.10.0.0"), undefined);
	assert.equal(newerRelease(release, "1.0.0.0"), undefined);
});

test("an unreadable running version never offers an update", () => {
	assert.equal(newerRelease(parseRelease(latest("v0.2.0"))!, "dev"), undefined);
});
