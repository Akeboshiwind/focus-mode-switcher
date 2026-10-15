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

const NO_SCHEDULES = { data: [] };

const monday = (hour: number) => new Date(2026, 9, 12, hour);
const tuesday = (hour: number) => new Date(2026, 9, 13, hour);
const MONDAY_NOON = monday(12);

/** Seconds since 2001-01-01, as the DoNotDisturb DB counts. */
const at = (date: Date) => date.getTime() / 1000 - 978307200;

const MONDAY = 1;
const TUESDAY = 2;

const schedule = (modeId: string, from: number, to: number, weekdays: number, enabledSetting = 2) => ({
	data: [
		{
			modeConfigurations: {
				[modeId]: {
					mode: { modeIdentifier: modeId },
					triggers: {
						triggers: [
							{
								class: "DNDModeConfigurationScheduleTrigger",
								enabledSetting,
								timePeriodStartTimeHour: from,
								timePeriodStartTimeMinute: 0,
								timePeriodEndTimeHour: to,
								timePeriodEndTimeMinute: 0,
								timePeriodWeekdays: weekdays,
							},
						],
					},
				},
			},
		},
	],
});

test("no assertions means no mode is active", () => {
	assert.equal(parseActiveModeId(NO_SCHEDULES, assertions({}), MONDAY_NOON), undefined);
});

test("the newest assertion's mode is active", () => {
	const store = { storeAssertionRecords: [assertion("rest", 100), assertion("work", 200), assertion("transit", 150)] };
	assert.equal(parseActiveModeId(NO_SCHEDULES, assertions(store), MONDAY_NOON), "work");
});

test("an assertion older than the last turn-everything-off is not active", () => {
	const store = { storeAssertionRecords: [assertion("work", 100)], storeInvalidationRequestRecords: [turnedOff(200)] };
	assert.equal(parseActiveModeId(NO_SCHEDULES, assertions(store), MONDAY_NOON), undefined);
});

test("only a turn-everything-off request clears older assertions", () => {
	const other = { invalidationRequestDateTimestamp: 200, invalidationRequestPredicate: { invalidationPredicateType: "client" } };
	const store = { storeAssertionRecords: [assertion("work", 100)], storeInvalidationRequestRecords: [other] };
	assert.equal(parseActiveModeId(NO_SCHEDULES, assertions(store), MONDAY_NOON), "work");
});

test("switching modes turns everything off and asserts the new mode at the same instant", () => {
	const store = { storeAssertionRecords: [assertion("work", 813765226.556298)], storeInvalidationRequestRecords: [turnedOff(813765226.556298)] };
	assert.equal(parseActiveModeId(NO_SCHEDULES, assertions(store), MONDAY_NOON), "work");
});

test("a scheduled mode is active while its window is open", () => {
	assert.equal(parseActiveModeId(schedule("rest", 9, 17, MONDAY), assertions({}), MONDAY_NOON), "rest");
	assert.equal(parseActiveModeId(schedule("rest", 9, 17, MONDAY), assertions({}), monday(18)), undefined);
});

test("a disabled schedule is ignored", () => {
	assert.equal(parseActiveModeId(schedule("rest", 9, 17, MONDAY, 1), assertions({}), MONDAY_NOON), undefined);
});

test("a schedule only opens on its weekdays", () => {
	assert.equal(parseActiveModeId(schedule("rest", 9, 17, TUESDAY), assertions({}), MONDAY_NOON), undefined);
});

test("an overnight window belongs to the day it opened", () => {
	assert.equal(parseActiveModeId(schedule("sleep", 22, 7, MONDAY), assertions({}), tuesday(2)), "sleep");
	assert.equal(parseActiveModeId(schedule("sleep", 22, 7, TUESDAY), assertions({}), tuesday(2)), undefined);
});

test("whichever began last, a scheduled window or an assertion, is active", () => {
	const after = { storeAssertionRecords: [assertion("work", at(monday(10)))] };
	const before = { storeAssertionRecords: [assertion("work", at(monday(8)))] };
	assert.equal(parseActiveModeId(schedule("rest", 9, 17, MONDAY), assertions(after), MONDAY_NOON), "work");
	assert.equal(parseActiveModeId(schedule("rest", 9, 17, MONDAY), assertions(before), MONDAY_NOON), "rest");
});

test("turning Focus off during a scheduled window ends it", () => {
	const store = { storeInvalidationRequestRecords: [turnedOff(at(monday(11)))] };
	assert.equal(parseActiveModeId(schedule("rest", 9, 17, MONDAY), assertions(store), MONDAY_NOON), undefined);
});
