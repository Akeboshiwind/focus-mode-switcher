// Adapted from Raycast's focus-modes extension (MIT):
// https://github.com/raycast/extensions/blob/main/extensions/focus-modes/src/focus-state.ts
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

export function parseActiveModeId(assertions: Assertions): string | undefined {
	const store = assertions.data?.[0];
	const turnedOffAt = Math.max(
		-Infinity,
		...(store?.storeInvalidationRequestRecords ?? [])
			.filter((request) => request.invalidationRequestPredicate?.invalidationPredicateType === "any")
			.map((request) => request.invalidationRequestDateTimestamp ?? -Infinity),
	);
	const [newest] = (store?.storeAssertionRecords ?? [])
		.map((record) => ({ modeId: record.assertionDetails?.assertionDetailsModeIdentifier, start: record.assertionStartDateTimestamp ?? -Infinity }))
		.filter((record) => record.start >= turnedOffAt)
		.sort((a, b) => b.start - a.start);
	return newest?.modeId;
}
