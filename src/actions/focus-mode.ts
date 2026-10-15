import streamDeck, { action, DidReceiveSettingsEvent, SendToPluginEvent, SingletonAction, WillAppearEvent, type Action } from "@elgato/streamdeck";

import { readActiveModeId } from "../focus/active";
import { renderIcon } from "../focus/icon";
import { readModes, type FocusMode } from "../focus/modes";

type Settings = { modeId?: string };

const DIMMED = 0;
const LIT = 1;

@action({ UUID: "com.akeboshiwind.focus-mode-switcher.focus-mode" })
export class FocusModeKey extends SingletonAction<Settings> {
	override async onWillAppear(ev: WillAppearEvent<Settings>): Promise<void> {
		await showMode(ev.action, ev.payload.settings, ...(await readFocus()));
	}

	override async onDidReceiveSettings(ev: DidReceiveSettingsEvent<Settings>): Promise<void> {
		await showMode(ev.action, ev.payload.settings, ...(await readFocus()));
	}

	/**
	 * Answers the property inspector's `sdpi-select` datasource request.
	 */
	override async onSendToPlugin(ev: SendToPluginEvent<{ event?: string }, Settings>): Promise<void> {
		if (ev.payload.event !== "getModes") return;
		const modes = await readModes();
		await streamDeck.ui.sendToPropertyInspector({
			event: "getModes",
			items: modes.map((mode) => ({ label: mode.name, value: mode.id })),
		});
	}

	async refresh(): Promise<void> {
		const focus = await readFocus();
		await Promise.all(this.actions.map(async (key) => showMode(key, await key.getSettings(), ...focus)).toArray());
	}
}

function readFocus(): Promise<[FocusMode[], string | undefined]> {
	return Promise.all([readModes(), readActiveModeId()]);
}

async function showMode(key: Action<Settings>, { modeId }: Settings, modes: FocusMode[], activeModeId: string | undefined): Promise<void> {
	if (!key.isKey()) return;
	const mode = modes.find((m) => m.id === modeId);
	if (mode === undefined) {
		await key.setImage();
		await key.setState(DIMMED);
		return;
	}
	const [dimmed, lit] = await Promise.all([renderIcon(mode, false), renderIcon(mode, true)]);
	await key.setImage(dimmed, { state: DIMMED });
	await key.setImage(lit, { state: LIT });
	await key.setState(mode.id === activeModeId ? LIT : DIMMED);
}
