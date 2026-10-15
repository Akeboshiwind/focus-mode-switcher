import assert from "node:assert/strict";
import { test } from "node:test";

import { parseActiveModeId } from "./active";

const assertion = (modeId: string, start: number) => ({
	assertionStartDateTimestamp: start,
	assertionDetails: { assertionDetailsModeIdentifier: modeId },
});

const turnedOff = (at: number) => ({
	invalidationRequestDateTimestamp: at,
	invalidationRequestPredicate: { invalidationPredicateType: "any" },
});

const assertions = (store: object) => ({ data: [store] });

test("no assertions means no mode is active", () => {
	assert.equal(parseActiveModeId(assertions({})), undefined);
});

test("the newest assertion's mode is active", () => {
	const store = { storeAssertionRecords: [assertion("rest", 100), assertion("work", 200), assertion("transit", 150)] };
	assert.equal(parseActiveModeId(assertions(store)), "work");
});

test("an assertion older than the last turn-everything-off is not active", () => {
	const store = { storeAssertionRecords: [assertion("work", 100)], storeInvalidationRequestRecords: [turnedOff(200)] };
	assert.equal(parseActiveModeId(assertions(store)), undefined);
});

test("only a turn-everything-off request clears older assertions", () => {
	const other = { invalidationRequestDateTimestamp: 200, invalidationRequestPredicate: { invalidationPredicateType: "client" } };
	const store = { storeAssertionRecords: [assertion("work", 100)], storeInvalidationRequestRecords: [other] };
	assert.equal(parseActiveModeId(assertions(store)), "work");
});

test("switching modes turns everything off and asserts the new mode at the same instant", () => {
	const store = { storeAssertionRecords: [assertion("work", 813765226.556298)], storeInvalidationRequestRecords: [turnedOff(813765226.556298)] };
	assert.equal(parseActiveModeId(assertions(store)), "work");
});
