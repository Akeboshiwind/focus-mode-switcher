import assert from "node:assert/strict";
import { test } from "node:test";

import { renderIcon } from "./icon";

const png = (dataUri: string) => {
	const [prefix, base64] = dataUri.split(",");
	assert.equal(prefix, "data:image/png;base64");
	const bytes = Buffer.from(base64, "base64");
	return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20), bytes };
};

const size = (dataUri: string) => {
	const { width, height } = png(dataUri);
	return { width, height };
};

test("a mode's SF Symbol renders as a 144px key image", async () => {
	assert.deepEqual(size(await renderIcon({ symbol: "guitars.fill", tint: "systemOrangeColor" }, true, false)), { width: 144, height: 144 });
});

test("the dimmed image differs from the lit one", async () => {
	const mode = { symbol: "guitars.fill", tint: "systemOrangeColor" };
	assert.notEqual(await renderIcon(mode, true, false), await renderIcon(mode, false, false));
});

test("an emoji mode, which has no SF Symbol, gets the fallback icon", async () => {
	const emoji = await renderIcon({ symbol: "emoji.face.grinning", tint: "systemBlueColor" }, true, false);
	const unknown = await renderIcon({ symbol: "not.a.symbol", tint: "systemBlueColor" }, true, false);
	assert.equal(emoji, unknown);
	png(emoji);
});

test("a badged icon, shown while an update is available, differs from the plain one", async () => {
	const mode = { symbol: "guitars.fill", tint: "systemOrangeColor" };
	const badged = await renderIcon(mode, true, true);
	assert.notEqual(badged, await renderIcon(mode, true, false));
	assert.deepEqual(size(badged), { width: 144, height: 144 });
});
