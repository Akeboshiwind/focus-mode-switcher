import assert from "node:assert/strict";
import { test } from "node:test";

import { checkVersion, focusFailure, UnsupportedVersion } from "./focus";

const errno = (code: string) => Object.assign(new Error(code), { code });

test("a file in a version this plugin knows passes", () => {
	assert.doesNotThrow(() => checkVersion("Assertions.json", { header: { version: 8 } }));
});

test("a file in any other version is refused rather than misread", () => {
	assert.throws(() => checkVersion("Assertions.json", { header: { version: 9 } }), UnsupportedVersion);
	assert.throws(() => checkVersion("ModeConfigurations.json", {}), UnsupportedVersion);
});

test("a read refused by macOS privacy controls means Stream Deck lacks Full Disk Access", () => {
	assert.deepEqual(focusFailure(errno("EPERM")), { kind: "no-access" });
	assert.deepEqual(focusFailure(errno("EACCES")), { kind: "no-access" });
});

test("an unsupported version is reported as such", () => {
	assert.deepEqual(focusFailure(new UnsupportedVersion("Assertions.json", 9)), { kind: "unsupported-version" });
});

test("any other failure is not swallowed", () => {
	const error = errno("ENOENT");
	assert.throws(() => focusFailure(error), error);
});
