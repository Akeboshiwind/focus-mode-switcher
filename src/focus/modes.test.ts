import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { parseModes } from "./modes";

const fixture = JSON.parse(readFileSync(new URL("fixtures/ModeConfigurations.json", import.meta.url), "utf8"));

test("modes are keyed by modeIdentifier", () => {
	assert.deepEqual(parseModes(fixture), [
		{ id: "com.apple.donotdisturb.mode.default", name: "Do Not Disturb", symbol: "moon.fill", tint: "systemIndigoColor" },
		{ id: "com.apple.donotdisturb.mode.guitarsfill", name: "Rest", symbol: "guitars.fill", tint: "systemOrangeColor" },
		{ id: "com.apple.donotdisturb.mode.bookmarkfill", name: "Work", symbol: "bookmark.fill", tint: "systemBlueColor" },
	]);
});

test("built-in modes the user hasn't set up (visibility 1) are left out", () => {
	assert.ok(!parseModes(fixture).some((mode) => mode.id === "com.apple.focus.work"));
});

test("a file with no mode configurations has no modes", () => {
	assert.deepEqual(parseModes({ data: [] }), []);
});
