export interface FocusMode {
	id: string;
	name: string;
	/** An SF Symbol name, or `emoji.*` for a mode whose icon is an emoji. */
	symbol?: string;
	/** An `NSColor` class property name, such as `systemBlueColor`. */
	tint?: string;
}

interface ModeConfigurations {
	data?: {
		modeConfigurations?: Record<
			string,
			{ mode?: { name?: string; modeIdentifier?: string; visibility?: number; symbolImageName?: string; tintColorName?: string } }
		>;
	}[];
}

const HIDDEN = 1;

export function parseModes(configurations: ModeConfigurations): FocusMode[] {
	return Object.entries(configurations.data?.[0]?.modeConfigurations ?? {})
		.filter(([, { mode }]) => mode?.visibility !== HIDDEN)
		.map(([key, { mode }]) => {
			const id = mode?.modeIdentifier ?? key;
			return { id, name: mode?.name ?? id, symbol: mode?.symbolImageName, tint: mode?.tintColorName };
		});
}
