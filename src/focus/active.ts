// Adapted from Raycast's focus-modes extension (MIT):
// https://github.com/raycast/extensions/blob/main/extensions/focus-modes/src/focus-state.ts
const DATABASE_EPOCH = 978307200;
const TRIGGER_ENABLED = 2;

interface Assertions {
	data?: {
		storeAssertionRecords?: {
			assertionStartDateTimestamp?: number;
			assertionDetails?: { assertionDetailsModeIdentifier?: string };
		}[];
		storeInvalidationRequestRecords?: {
			invalidationRequestDateTimestamp?: number;
			invalidationRequestPredicate?: { invalidationPredicateType?: string };
		}[];
	}[];
}

interface ScheduleTrigger {
	class?: string;
	enabledSetting?: number;
	timePeriodStartTimeHour?: number;
	timePeriodStartTimeMinute?: number;
	timePeriodEndTimeHour?: number;
	timePeriodEndTimeMinute?: number;
	/** Monday = 1, Tuesday = 2, … Sunday = 64. */
	timePeriodWeekdays?: number;
}

interface ModeConfigurations {
	data?: {
		modeConfigurations?: Record<string, { mode?: { modeIdentifier?: string }; triggers?: { triggers?: ScheduleTrigger[] } }>;
	}[];
}

const weekdayBit = (date: Date) => (date.getDay() === 0 ? 64 : 1 << (date.getDay() - 1));

function daysBefore(now: Date, days: number, hour: number, minute: number): Date {
	return new Date(now.getFullYear(), now.getMonth(), now.getDate() - days, hour, minute);
}

/**
 * When the schedule's window that contains `now` opened, if one does. A window that crosses midnight belongs to the day it opened.
 */
function windowOpenedAt(trigger: ScheduleTrigger, now: Date): Date | undefined {
	const startHour = trigger.timePeriodStartTimeHour ?? 0;
	const startMinute = trigger.timePeriodStartTimeMinute ?? 0;
	const start = startHour * 60 + startMinute;
	const end = (trigger.timePeriodEndTimeHour ?? 0) * 60 + (trigger.timePeriodEndTimeMinute ?? 0);
	const minute = now.getHours() * 60 + now.getMinutes();
	const scheduledOn = (date: Date) => ((trigger.timePeriodWeekdays ?? 0) & weekdayBit(date)) !== 0;

	if (start < end) {
		return scheduledOn(now) && start <= minute && minute < end ? daysBefore(now, 0, startHour, startMinute) : undefined;
	}
	if (minute >= start && scheduledOn(now)) return daysBefore(now, 0, startHour, startMinute);
	const yesterday = daysBefore(now, 1, startHour, startMinute);
	if (minute < end && scheduledOn(yesterday)) return yesterday;
	return undefined;
}

/**
 * The mode that most recently began, by assertion or by schedule, since Focus was last turned off.
 */
export function parseActiveModeId(configurations: ModeConfigurations, assertions: Assertions, now: Date): string | undefined {
	const store = assertions.data?.[0];
	const turnedOffAt = Math.max(
		-Infinity,
		...(store?.storeInvalidationRequestRecords ?? [])
			.filter((request) => request.invalidationRequestPredicate?.invalidationPredicateType === "any")
			.map((request) => request.invalidationRequestDateTimestamp ?? -Infinity),
	);

	const asserted = (store?.storeAssertionRecords ?? [])
		.map((record) => ({ modeId: record.assertionDetails?.assertionDetailsModeIdentifier, start: record.assertionStartDateTimestamp ?? -Infinity }))
		.filter((record) => record.start >= turnedOffAt);

	const scheduled = Object.entries(configurations.data?.[0]?.modeConfigurations ?? {}).flatMap(([key, { mode, triggers }]) =>
		(triggers?.triggers ?? [])
			.filter((trigger) => trigger.class === "DNDModeConfigurationScheduleTrigger" && trigger.enabledSetting === TRIGGER_ENABLED)
			.map((trigger) => windowOpenedAt(trigger, now))
			.filter((opened) => opened !== undefined)
			.map((opened) => ({ modeId: mode?.modeIdentifier ?? key, start: opened.getTime() / 1000 - DATABASE_EPOCH }))
			.filter((window) => window.start > turnedOffAt),
	);

	const [newest] = [...asserted, ...scheduled].sort((a, b) => b.start - a.start);
	return newest?.modeId;
}
