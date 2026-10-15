import streamDeck, { action, DidReceiveSettingsEvent, SendToPluginEvent, SingletonAction, WillAppearEvent, type Action } from "@elgato/streamdeck";

import { readActiveModeId } from "../focus/active";
import { readModes } from "../focus/modes";

type Settings = { modeId?: string };

const DIMMED = 0;
const LIT = 1;

@action({ UUID: "com.akeboshiwind.focus-mode-switcher.focus-mode" })
export class FocusModeKey extends SingletonAction<Settings> {
	override async onWillAppear(ev: WillAppearEvent<Settings>): Promise<void> {
		await showState(ev.action, ev.payload.settings, await readActiveModeId());
	}

	override async onDidReceiveSettings(ev: DidReceiveSettingsEvent<Settings>): Promise<void> {
		await showState(ev.action, ev.payload.settings, await readActiveModeId());
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
		const activeModeId = await readActiveModeId();
		await Promise.all(this.actions.map(async (key) => showState(key, await key.getSettings(), activeModeId)).toArray());
	}
}

async function showState(key: Action<Settings>, { modeId }: Settings, activeModeId: string | undefined): Promise<void> {
	if (!key.isKey()) return;
	await key.setState(modeId !== undefined && modeId === activeModeId ? LIT : DIMMED);
}
